import { Worker, Queue } from 'bullmq'
import { getRedis } from '@/lib/redis'
import { prisma } from '@/lib/db'
import { SessionJob, QUEUE_SESSION, QUEUE_HEALTH, defaultJobOpts } from '@/lib/queue'
import SteamUser from 'steam-user'
// Note: steam-user expects proxy URLs as strings, not http.Agent instances
import SteamTotp from 'steam-totp'
import { log } from '@/lib/logger'
import { envelopeDecryptDataKey, decryptWithDataKey, encryptWithDataKey, envelopeEncryptDataKey } from '@/lib/crypto'
import { resolvePlanForUser } from '@/lib/plans'
import { withRetry, RetryableError, PermanentError } from './error-handler'
import { ProxyManager } from '@/lib/proxy-manager'

type ClientMap = Map<string, any>
const clients: ClientMap = new Map()
const clientProxies: Map<string, string> = new Map() // Track proxy per client
const loginRetries = new Map<string, number>()
const MAX_RETRIES = 5
const rateLimitedUntil = new Map<string, number>() // Track rate limit cooldown per account

// Initialize ProxyManager immediately at module load
const proxyManager = ProxyManager.getInstance()

async function getClient(key: string, forceProxy: boolean = false) {
  let c = clients.get(key)
  if (!c) {
    const proxyUrl = await proxyManager.getProxyForAccount(key, forceProxy)
    c = new SteamUser({ 
      autoRelogin: false, 
      promptSteamGuardCode: false,
      enablePicsCache: true,
      picsCacheAll: false,
      ...(proxyUrl ? { httpProxy: proxyUrl } : {})
    })
    clients.set(key, c)
    if (proxyUrl) {
      clientProxies.set(key, proxyUrl)
    }
    log.info('🔌 Created Steam client', { 
      accountId: key.slice(0, 8) + '***',
      proxy: proxyUrl ? proxyUrl.replace(/\/\/.*:.*@/, '//***:***@') : 'none (VPS)'
    })
  }
  return c
}

/**
 * Apply custom game status to Steam client
 * 
 * For ADVERTISING: Pass customInGameTitle as a string - it will show as "Playing <your text>"
 * The custom status string must be FIRST in the gamesPlayed array!
 * 
 * @param client - Steam user client instance
 * @param steamAccountId - Steam account ID for logging
 * @param settings - Configuration object
 * @param settings.customInGameTitle - Custom status text (e.g., "Visit IdleMates.com - Boost Your Hours!")
 * @param settings.gameIds - Array of Steam game IDs to idle
 * @param settings.appearOnline - Whether to show as Online or Invisible
 */
async function applyCustomStatus(
  client: any,
  steamAccountId: string,
  settings: {
    customInGameTitle?: string | null
    gameIds: number[]
    appearOnline: boolean
  }
) {
  // Set persona state FIRST
  const personaState = settings.appearOnline 
    ? SteamUser.EPersonaState.Online 
    : SteamUser.EPersonaState.Invisible
  
  log.info('🔄 Setting Steam persona state', { 
    steamAccountId, 
    appearOnline: settings.appearOnline,
    personaState: personaState === SteamUser.EPersonaState.Online ? 'Online' : 'Invisible'
  })
  
  client.setPersona(personaState)
  
  // Wait for Steam to process persona change (required to avoid rate limits)
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const { customInGameTitle, gameIds } = settings
  
  if (customInGameTitle && gameIds.length > 0) {
    // HYBRID MODE: Custom advertising status + background games
    // Custom string MUST be first in array for Steam to display it as primary status
    const gamesArray: (string | number)[] = [customInGameTitle, ...gameIds]
    client.gamesPlayed(gamesArray)
    
    log.info('📢 Advertising mode: Custom status + games', {
      steamAccountId,
      customStatus: customInGameTitle,
      backgroundGames: gameIds.length,
      totalItems: gamesArray.length
    })
  } else if (customInGameTitle) {
    // ADVERTISING ONLY MODE: Just show custom status, no games
    client.gamesPlayed([customInGameTitle])
    
    log.info('📢 Advertising mode: Custom status only', {
      steamAccountId,
      customStatus: customInGameTitle
    })
  } else if (gameIds.length > 0) {
    // IDLE MODE: Just play games normally
    client.gamesPlayed(gameIds)
    
    log.info('🎮 Idle mode: Games only', {
      steamAccountId,
      games: gameIds,
      count: gameIds.length
    })
  } else {
    // ONLINE MODE: No games, just online
    client.gamesPlayed([])
    
    log.info('🟢 Online mode: No games', { steamAccountId })
  }
}

async function decryptSteamCreds(steamAccountId: string) {
  const acc = await withRetry(
    () => prisma.steamAccount.findUnique({ 
      where: { id: steamAccountId }, 
      include: { user: true } 
    }),
    { maxRetries: 3 },
    'fetchSteamAccount'
  )
  
  if (!acc) {
    throw new PermanentError('Steam account not found')
  }

  const dataKey = envelopeDecryptDataKey(acc.user.dataKeyEnc)
  return {
    username: decryptWithDataKey(dataKey, acc.usernameEnc),
    password: decryptWithDataKey(dataKey, acc.passwordEnc),
    sharedSecret: acc.sharedSecretEnc ? decryptWithDataKey(dataKey, acc.sharedSecretEnc) : null,
    refreshToken: acc.refreshTokenEnc ? decryptWithDataKey(dataKey, acc.refreshTokenEnc) : null,
  }
}

async function handleLoggedInElsewhere(steamAccountId: string) {
  try {
    log.warn('👤 User logged in elsewhere. Stopping boosting session.', { steamAccountId })
    
    // Stop playing games and log off client cleanly
    const client = clients.get(steamAccountId)
    if (client) {
      try {
        client.gamesPlayed([])
        client.logOff()
      } catch {}
      clients.delete(steamAccountId)
      clientProxies.delete(steamAccountId)
      proxyManager.releaseProxy(steamAccountId)
    }

    // Update database session status to stopped
    await prisma.boostSession.updateMany({
      where: { steamAccountId },
      data: { 
        status: 'stopped', 
        /* @ts-ignore */ 
        statusMessage: 'Session paused: Logged in elsewhere', 
        pausedAt: new Date() 
      } as any
    })
    
    // Update steam account status to idle
    await prisma.steamAccount.update({
      where: { id: steamAccountId },
      data: { status: 'idle' }
    }).catch(() => {})
    
  } catch (err: any) {
    log.error('❌ Error handling LoggedInElsewhere', { steamAccountId, error: err.message })
  }
}

async function loginSteam(
  client: any,
  creds: { username: string; password: string; sharedSecret: string | null; refreshToken: string | null },
  steamAccountId: string,
  totpCode?: string
) {
  return new Promise<void>((resolve, reject) => {
    let timeout: NodeJS.Timeout | null = null
    
    const onLoggedOn = () => {
      cleanup()
      log.info('🔓 Initial login persona set to Online', { steamAccountId })
      client.setPersona(SteamUser.EPersonaState.Online)
      client.gamesPlayed([]) // Clear any previous games
      prisma.steamAccount.update({ where: { id: steamAccountId }, data: { status: 'online', lastLoginAt: new Date() } }).catch(() => {})
      loginRetries.delete(steamAccountId)
      rateLimitedUntil.delete(steamAccountId) // Clear rate limit on successful login
      
      // Report proxy success
      const proxyUrl = clientProxies.get(steamAccountId)
      if (proxyUrl) {
        proxyManager.reportProxySuccess(proxyUrl)
      }
      
      log.info('✅ Steam login successful', { steamAccountId, username: creds.username })
      resolve()
    }

    const onError = (err: Error) => {
      cleanup()
      const eresult = (err as any).eresult
      
      // Report proxy failure
      const proxyUrl = clientProxies.get(steamAccountId)
      if (proxyUrl) {
        proxyManager.reportProxyFailure(steamAccountId, proxyUrl, err.message)
      }
      
      log.error('❌ Steam login error', { steamAccountId, error: err.message, code: eresult })
      reject(err)
    }

    const onSteamGuard = (domain: any, callback: (code: string) => void, lastCodeWrong?: boolean) => {
      log.info('🔐 Steam Guard triggered', { steamAccountId, domain, lastCodeWrong, hasTotp: !!totpCode, hasSharedSecret: !!creds.sharedSecret })
      
      if (lastCodeWrong) {
        cleanup()
        reject(new Error('TOTP_WRONG_CODE'))
        return
      }
      
      if (totpCode) {
        log.info('Using provided TOTP code', { steamAccountId })
        callback(totpCode)
      } else if (creds.sharedSecret) {
        const code = SteamTotp.generateAuthCode(creds.sharedSecret)
        log.info('Generated TOTP from shared_secret', { steamAccountId })
        callback(code)
      } else {
        cleanup()
        // Check if it's email or mobile authenticator
        const authType = domain ? 'EMAIL' : 'MOBILE'
        reject(new Error(`TOTP_REQUIRED:${authType}`))
      }
    }

    const cleanup = () => {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      client.removeListener('loggedOn', onLoggedOn)
      client.removeListener('error', onError)
      client.removeListener('steamGuard', onSteamGuard)
    }

    timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Login timeout after 60s'))
    }, 60000)

    client.on('loggedOn', onLoggedOn)
    client.on('error', onError)
    client.on('steamGuard', onSteamGuard)

    // Add persistent error handler to prevent unhandled crashes
    if (client.listenerCount('error') === 0) {
      client.on('error', () => {}) // Catch all errors to prevent crash
    }

    log.info('🔄 Starting Steam login', { steamAccountId, username: creds.username, via: creds.refreshToken ? 'refreshToken' : 'password' })

    if (creds.refreshToken) {
      client.logOn({ refreshToken: creds.refreshToken })
    } else {
      client.logOn({ accountName: creds.username, password: creds.password })
    }
  })
}

function setupClientEvents(client: any, steamAccountId: string) {
  // Clean up any existing listeners on the client to avoid leaks
  client.removeAllListeners('friendMessage')
  client.removeAllListeners('friendRelationship')
  client.removeAllListeners('disconnected')
  
  // Set a safe maximum listener limit
  client.setMaxListeners(20)

  // Persistent error handler to capture LoggedInElsewhere / disconnects
  client.removeAllListeners('error')
  client.on('error', (err: any) => {
    const eresult = err.eresult
    log.error('Steam client error event', { steamAccountId, error: err.message, code: eresult })
    
    if (eresult === 6 || err.message === 'LoggedInElsewhere') {
      handleLoggedInElsewhere(steamAccountId)
    }
  })

  // Listen for disconnections with LoggedInElsewhere
  client.on('disconnected', (eresult: number, msg?: string) => {
    log.warn('Steam client disconnected event', { steamAccountId, eresult, msg })
    
    if (eresult === 6) {
      handleLoggedInElsewhere(steamAccountId)
    }
  })

  client.on('friendMessage', async (steamId: string, message: string) => {
    log.info('Friend message received', { steamAccountId, fromSteamId: steamId, message })
    
    const steamAccount = await withRetry(
      () => prisma.steamAccount.findUnique({ 
        where: { id: steamAccountId },
        include: { user: true }
      }),
      { maxRetries: 3 },
      'fetchSteamAccount'
    )

    if (steamAccount?.chatHistory) {
      // Store chat message in database with retries
      await withRetry(
        () => prisma.chatMessage.create({
          data: {
            steamAccountId,
            fromSteamId: steamId.toString(),
            message,
            isOutbound: false,
            timestamp: new Date()
          }
        }),
        { maxRetries: 3 },
        'saveChatMessage'
      )
    }

    // Auto-reply if enabled and we have a custom away message
    if (steamAccount?.customAwayMessage) {
      try {
        // Check if we recently sent an auto-reply to this user (within 10 minutes)
        const redis = getRedis()
        const rateLimitKey = `autoreply:${steamAccountId}:${steamId}`
        const lastReply = await redis.get(rateLimitKey)
        
        if (lastReply) {
          log.info('Auto-reply rate limited', { 
            steamAccountId, 
            fromSteamId: steamId,
            lastReplyTime: lastReply 
          })
          return // Skip auto-reply if we sent one recently
        }
        
        // Send the auto-reply message
        client.chatMessage(steamId, steamAccount.customAwayMessage)
        
        // Set rate limit (10 minutes)
        await redis.set(rateLimitKey, Date.now().toString(), 'EX', 600) // 10 minutes = 600 seconds
        
        log.info('Auto-reply sent', { steamAccountId, toSteamId: steamId })
          
        // Store auto-reply if chat history is enabled
        if (steamAccount.chatHistory) {
          await withRetry(
            async () => {
              // We need to pass the data through a type guard to ensure it's not null
              const messageText = steamAccount.customAwayMessage
              if (!messageText) throw new Error('Custom away message is null')

              // Create chat message record
              await prisma.chatMessage.create({
                data: {
                  steamAccountId,
                  fromSteamId: steamId.toString(), // Keep for backward compatibility
                  toSteamId: steamId.toString(), // The recipient of our message
                  message: messageText,
                  isOutbound: true,
                  timestamp: new Date()
                }
              })
            },
            { maxRetries: 3 },
            'saveAutoReply'
          )
        }
      } catch (error) {
        log.error('Failed to send auto-reply', { 
          steamAccountId, 
          error: error instanceof Error ? error.message : String(error),
          attempted: steamAccount.customAwayMessage 
        })
      }
    }
  })

  client.on('friendRelationship', async (steamId: string, relationship: number) => {
    try {
      const steamAccount = await withRetry(
        () => prisma.steamAccount.findUnique({ where: { id: steamAccountId } }),
        { maxRetries: 3 },
        'fetchSteamAccountSettings'
      )
      
      if (relationship === 2) { // 2 = RequestRecipient (incoming friend request)
        log.info('Received friend request', { steamAccountId, fromSteamId: steamId, autoAcceptEnabled: steamAccount?.autoAcceptFriends })
        
        // Gate by plan feature flag
        const planInfo = await resolvePlanForUser(steamAccountId.split(':')[0] || '')
        const canAutoAccept = !!(planInfo.features?.autoAcceptFriends)
        if (steamAccount?.autoAcceptFriends && canAutoAccept) {
          client.addFriend(steamId)
          log.info('Auto-accepted friend request', { steamAccountId, fromSteamId: steamId })
          
          // Send welcome message if auto-reply is enabled
          if (steamAccount.customAwayMessage) {
            setTimeout(() => {
              try {
                client.chatMessage(steamId, steamAccount.customAwayMessage)
                log.info('Sent welcome message to new friend', { steamAccountId, fromSteamId: steamId })
              } catch (err) {
                log.error('Failed to send welcome message', { steamAccountId, fromSteamId: steamId, error: err })
              }
            }, 2000) // Small delay to ensure friend request was accepted
          }
        }
      }
    } catch (err) {
      log.error('Error handling friend request', { steamAccountId, fromSteamId: steamId, error: err })
    }
  })
}

async function handleStart(userId: string, steamAccountId: string, totpCode?: string) {
  try {
    log.info('🚀 handleStart called', { userId, steamAccountId, hasTotpCode: !!totpCode })
    
    // Check if account is rate-limited
    const rateLimitExpiry = rateLimitedUntil.get(steamAccountId)
    if (rateLimitExpiry && Date.now() < rateLimitExpiry) {
      const waitMinutes = Math.ceil((rateLimitExpiry - Date.now()) / 60000)
      log.warn('⏱️ Account still rate-limited', { steamAccountId, waitMinutes })
      await prisma.boostSession.updateMany({ 
        where: { userId, steamAccountId }, 
        data: { 
          status: 'throttled', 
          /* @ts-ignore */ 
          statusMessage: `Rate limited. Wait ${waitMinutes} more minutes.` 
        } as any 
      })
      return // Don't attempt login
    }
    
    const plan = await resolvePlanForUser(userId)
    
    // Check hour limits for free users
    if (plan.code === 'free') {
      const freeBalance = await prisma.freePlanBalance.findUnique({
        where: { userId }
      })
      const hoursLeft = freeBalance?.hoursLeft ?? 100 // Default to 100 if no record exists
      
      if (hoursLeft <= 0) {
        log.warn('⚠️ Free user out of hours', { userId, steamAccountId, hoursLeft })
        await prisma.boostSession.updateMany({ 
          where: { userId, steamAccountId }, 
          data: { 
            status: 'paused', 
            /* @ts-ignore */ 
            statusMessage: 'Free hours exhausted. Renew from dashboard or upgrade plan.' 
          } as any 
        })
        return // Don't start session
      }
    }
    
    const creds = await decryptSteamCreds(steamAccountId)
    let client = await getClient(steamAccountId)
    
    // Make sure session exists but DON'T set status yet - wait for actual response
    let session = await prisma.boostSession.findFirst({ where: { userId, steamAccountId }, include: { games: true } })
    if (!session) {
      session = await prisma.boostSession.create({ 
        data: { userId, steamAccountId, status: 'stopped', personaState: 'Online' as any },
        include: { games: true }
      })
    }

    // Check if already logged in and running - don't force re-login to avoid rate limits
    if (client && client.steamID) {
      log.info('✓ Client already logged in, reusing connection', { steamAccountId })
    } else {
      try {
        // WAIT for login response before assuming anything
        log.info('⏳ Waiting for Steam login response...', { steamAccountId })
        await loginSteam(client, creds, steamAccountId, totpCode)
      } catch (loginErr: any) {
        // FALLBACK LOGIC: If failed on VPS (proxyUrl was null), retry with proxy
        const currentProxy = clientProxies.get(steamAccountId)
        if (!currentProxy && (loginErr.message.includes('RateLimitExceeded') || loginErr.message.includes('timeout'))) {
          log.warn('⚠️ Login failed on VPS IP. Retrying with a PROXY...', { steamAccountId, error: loginErr.message })
          // Remove client from map so getClient creates a new one with proxy
          clients.delete(steamAccountId)
          client = await getClient(steamAccountId, true) // Force proxy
          await loginSteam(client, creds, steamAccountId, totpCode)
        } else {
          throw loginErr // Re-throw if it wasn't a VPS-to-proxy fallback case
        }
      }
    }

    // Get fresh client reference after login
    const activeClient = await getClient(steamAccountId)
    const s = await prisma.boostSession.findFirst({ 
      where: { userId, steamAccountId }, 
      include: { 
        games: {
          include: {
            game: true
          }
        }, 
        steamAccount: true 
      } 
    })

    if (!s) throw new Error('Session not found')
    
    // Set up client event handlers
    setupClientEvents(activeClient, steamAccountId)
    
    // Get game IDs with plan limit
    const appIds = (s.games || []).map((g: any) => g.appId).slice(0, Math.min(plan.maxConcurrentGames, 32))
    
    // Apply custom status using the correct method for advertising, gated by plan features
    const planInfoForFeatures = await resolvePlanForUser(userId)
    const allowAppearOnline = !!(planInfoForFeatures.features?.appearOnline)
    await applyCustomStatus(activeClient, steamAccountId, {
      customInGameTitle: s.steamAccount.customInGameTitle,
      gameIds: appIds,
      appearOnline: allowAppearOnline ? s.steamAccount.appearOnline : false
    })
    
    // NOW we can set status to running since we successfully logged in
    await prisma.boostSession.updateMany({ 
      where: { userId, steamAccountId }, 
      data: { status: 'running', /* @ts-ignore */ statusMessage: null, startedAt: new Date(), lastHeartbeatAt: new Date() } as any 
    })
    
  } catch (err: any) {
    log.error('❌ handleStart error', { userId, steamAccountId, error: err.message })
    
    // Parse error types and set accurate status
    if (err.message && err.message.startsWith('TOTP_REQUIRED')) {
      const authType = err.message.split(':')[1] || 'MOBILE'
      await prisma.boostSession.updateMany({ 
        where: { userId, steamAccountId }, 
        data: { status: 'totp_required', /* @ts-ignore */ statusMessage: `${authType} authenticator code needed` } as any 
      })
      log.info('🔐 Steam Guard required', { steamAccountId, authType })
    } else if (err.message && err.message === 'TOTP_WRONG_CODE') {
      await prisma.boostSession.updateMany({ 
        where: { userId, steamAccountId }, 
        data: { status: 'totp_wrong', /* @ts-ignore */ statusMessage: 'Invalid code - try again' } as any 
      })
      log.warn('🔐 Wrong TOTP code provided', { steamAccountId })
    } else if (err.message && (err.message.includes('RateLimitExceeded') || err.message.includes('AccountLoginDeniedThrottle'))) {
      // Set 30-minute cooldown for rate-limited accounts
      const cooldownExpiry = Date.now() + (30 * 60 * 1000) // 30 minutes
      rateLimitedUntil.set(steamAccountId, cooldownExpiry)
      
      await prisma.boostSession.updateMany({ 
        where: { userId, steamAccountId }, 
        data: { status: 'throttled', /* @ts-ignore */ statusMessage: 'Rate limited by Steam. Wait 30 minutes before retrying.' } as any 
      })
      await prisma.steamAccount.update({ where: { id: steamAccountId }, data: { status: 'throttled' } }).catch(() => {})
      log.warn('⏱️ Steam rate limit hit - 30min cooldown applied', { steamAccountId, cooldownExpiry: new Date(cooldownExpiry) })
    } else if (err.message && err.message.includes('InvalidPassword')) {
      await prisma.boostSession.updateMany({ 
        where: { userId, steamAccountId }, 
        data: { status: 'error', /* @ts-ignore */ statusMessage: 'Wrong username or password' } as any 
      })
      log.error('🔒 Invalid password', { steamAccountId })
    } else if (err.message && err.message.includes('timeout')) {
      await prisma.boostSession.updateMany({ 
        where: { userId, steamAccountId }, 
        data: { status: 'error', /* @ts-ignore */ statusMessage: 'Connection timeout' } as any 
      })
      log.error('⏱️ Login timeout', { steamAccountId })
    } else {
      await prisma.boostSession.updateMany({ 
        where: { userId, steamAccountId }, 
        data: { status: 'error', /* @ts-ignore */ statusMessage: err.message?.substring(0, 100) || 'Unknown error' } as any 
      })
    }
    
    // Don't re-throw - we handled the error gracefully
  }
}

async function handleStop(userId: string, steamAccountId: string) {
  try {
    log.info('🛑 handleStop called', { userId, steamAccountId })
    
    // Get client ONLY if it exists, don't create a new one
    const client = clients.get(steamAccountId)
    if (client) {
      if (client.steamID) {
        log.info('Logging off Steam client', { steamAccountId })
        client.gamesPlayed([]) // Stop playing games
        client.logOff() // Disconnect from Steam
      }
      clients.delete(steamAccountId) // Remove from map
      clientProxies.delete(steamAccountId) // Remove proxy mapping
      proxyManager.releaseProxy(steamAccountId) // Release proxy
      log.info('✅ Client removed from map', { steamAccountId })
    } else {
      log.info('No active client found (already stopped)', { steamAccountId })
    }
    
    await prisma.boostSession.updateMany({ 
      where: { userId, steamAccountId }, 
      data: { status: 'stopped', /* @ts-ignore */ statusMessage: null, pausedAt: new Date() } as any 
    })
    
    log.info('✅ Session stopped successfully', { userId, steamAccountId })
  } catch (err: any) {
    log.error('❌ handleStop error', { userId, steamAccountId, error: err.message })
  }
}

async function handleReloadSettings(userId: string, steamAccountId: string) {
  try {
    log.info('🔄 handleReloadSettings called', { userId, steamAccountId })
    
    // Get the existing client
    const client = clients.get(steamAccountId)
    if (!client || !client.steamID) {
      log.warn('No active client found, cannot reload settings', { steamAccountId })
      return
    }

    // Get the running session with updated settings
    const session = await prisma.boostSession.findFirst({
      where: { 
        userId, 
        steamAccountId,
        status: 'running'
      },
      include: { 
        steamAccount: true,
        games: { include: { game: true } }
      }
    })

    if (!session) {
      log.warn('No running session found', { steamAccountId })
      return
    }

    // Apply updated settings using correct custom status method
    const appIds = session.games.map(g => g.appId)
    
    await applyCustomStatus(client, steamAccountId, {
      customInGameTitle: session.steamAccount.customInGameTitle,
      gameIds: appIds,
      appearOnline: session.steamAccount.appearOnline
    })

    log.info('✅ Settings reloaded successfully', { userId, steamAccountId })
  } catch (err: any) {
    log.error('❌ handleReloadSettings error', { userId, steamAccountId, error: err.message })
  }
}

async function healthCheck() {
  const sessions = await prisma.boostSession.findMany({ 
    where: { status: 'running' }, 
    include: { steamAccount: true, games: true, user: true } 
  })
  
  for (const s of sessions) {
    const client = await getClient(s.steamAccountId)
    if (!client || !client.steamID) {
      log.warn('Client disconnected, restarting', { sessionId: s.id })
      await handleStart(s.userId, s.steamAccountId)
    } else {
      // increment per-game seconds by 60 for running sessions
      const now = new Date()
      await prisma.boostSession.update({ where: { id: s.id }, data: { lastHeartbeatAt: now } })
      
      if (s.games && s.games.length > 0) {
        await prisma.boostSessionGame.updateMany({
          where: { sessionId: s.id },
          data: { /* @ts-ignore */ secondsAccumulated: { increment: 60 } } as any
        })
      }

      // Track usage hours for active subscription (1 minute = 1/60 hour)
      try {
        const activeSubscription = await prisma.subscription.findFirst({
          where: {
            userId: s.userId,
            status: { in: ['ACTIVE', 'TRIAL'] }
          },
          orderBy: { createdAt: 'desc' }
        })

        if (activeSubscription) {
          // Track hours for paid subscriptions - concurrent games count cumulatively
          const activeGames = s.games?.length || 0
          const hourIncrement = activeGames * (1 / 60) // Each game counts as 1 minute per minute
          
          await prisma.subscription.update({
            where: { id: activeSubscription.id },
            data: {
              hoursUsed: {
                increment: hourIncrement // Add minutes based on number of concurrent games
              }
            }
          })
        } else {
          // Track hours for free users - concurrent games count cumulatively
          const activeGames = s.games?.length || 0
          if (activeGames > 0) {
            const hourDecrement = activeGames * (1 / 60) // Each game counts as 1 minute per minute
            
            const result = await prisma.freePlanBalance.upsert({
              where: { userId: s.userId },
              create: { userId: s.userId, hoursLeft: 100 - hourDecrement }, // Start with 100 hours minus this period
              update: {
                hoursLeft: {
                  decrement: hourDecrement // Subtract minutes based on number of concurrent games
                }
              }
            })
            
            // Stop session if free user runs out of hours
            if (result.hoursLeft <= 0) {
              log.warn('⚠️ Free user exhausted hours during gameplay, stopping session', { 
                userId: s.userId, 
                sessionId: s.id,
                hoursLeft: result.hoursLeft 
              })
              
              await prisma.boostSession.update({
                where: { id: s.id },
                data: {
                  status: 'paused',
                  /* @ts-ignore */
                  statusMessage: 'Free hours exhausted. Renew from dashboard or upgrade plan.'
                } as any
              })
              
              // Disconnect client to stop idling
              const client = await getClient(s.steamAccountId)
              if (client) {
                try {
                  client.logOff()
                } catch (err) {
                  log.error('Failed to disconnect client after hour exhaustion', { error: err })
                }
              }
            }
          }
        }
      } catch (error) {
        log.error('Failed to update usage hours', { error, userId: s.userId })
      }
    }
  }
}

async function handleQRLogin(userId: string, sessionId: string) {
  const redis = getRedis()
  let loginSession: any = null
  // Track proxy assignment id for this transient QR flow
  const proxyAssignmentId = `qr_${sessionId}`
  let proxyUrl: string | null = null
  let proxyLocation: string = 'Our Cloud Server (Romania)'
  const useProxyForQR = process.env.STEAM_QR_USE_PROXY === '1'
  
  try {
    log.info('🔷 Starting QR login', { userId, sessionId })
    
    const QRCode = require('qrcode')
    const { LoginSession, EAuthTokenPlatformType } = require('steam-session')
    
    // Get user
    const user = await prisma.user.findUnique({ 
      where: { id: userId }
    })
    
    if (!user) {
      throw new Error('User not found')
    }
    
    if (useProxyForQR) {
      // Get a proxy URL for the QR login session
      proxyUrl = await proxyManager.getProxyForAccount(proxyAssignmentId, false) // Try VPS first
      
      // Get location for the selected proxy (or VPS)
      const proxyConfig = proxyUrl ? proxyManager.getProxyConfig(proxyUrl) : null
      proxyLocation = proxyConfig?.location || 'Our Cloud Server (Romania)'
      
      log.info('🔷 Using proxy for QR login', { 
        userId, 
        hasProxy: !!proxyUrl, 
        proxy: proxyUrl ? proxyUrl.replace(/\/\/.*:.*@/, '//***:***@') : 'none (VPS)',
        location: proxyLocation
      })
    } else {
      log.info('🔷 Skipping proxy for QR login (STEAM_QR_USE_PROXY!=1)', { userId })
    }

    // Create login session for QR authentication with optional proxy URL
    const loginOptions: any = {}
    if (proxyUrl) {
      // steam-session supports httpProxy/httpsProxy as URL strings
      loginOptions.httpProxy = proxyUrl
      loginOptions.httpsProxy = proxyUrl
    }
    loginSession = new LoginSession(EAuthTokenPlatformType.SteamClient, loginOptions)
    // Increase default loginTimeout from 30 seconds to 3 minutes (180,000 ms)
    loginSession.loginTimeout = 180000
    
    loginSession.on('authenticated', async () => {
      const refreshToken = loginSession.refreshToken
      const steamID = loginSession.steamID
      const steamId = steamID ? steamID.getSteamID64() : null
      const username = loginSession.accountName
      
      log.info('✅ QR login authenticated', { userId, steamId, username })
      
      try {
        if (!refreshToken) throw new Error('No refresh token received from Steam')
        
        // Enforce decryption key existence
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) throw new Error('User not found')
        
        const dataKey = envelopeDecryptDataKey(user.dataKeyEnc)
        const refreshTokenEnc = encryptWithDataKey(dataKey, refreshToken)
        
        // Find if this account already exists
        const userAccounts = await prisma.steamAccount.findMany({
          where: { userId }
        })
        
        let existingAccount = null
        if (username) {
          for (const acc of userAccounts) {
            try {
              const decUsername = decryptWithDataKey(dataKey, acc.usernameEnc)
              if (decUsername.toLowerCase() === username.toLowerCase()) {
                existingAccount = acc
                break
              }
            } catch (decErr: any) {
              log.error('Error decrypting username for comparison', { accountId: acc.id, error: decErr.message })
            }
          }
        }
        
        if (existingAccount) {
          await prisma.steamAccount.update({
            where: { id: existingAccount.id },
            data: { 
              refreshTokenEnc,
              status: 'idle',
              lastLoginAt: new Date()
            }
          })
          log.info('✅ Steam account updated via QR with refreshToken', { userId, steamId, username })
        } else {
          if (!username) {
            throw new Error('Could not retrieve username from Steam session')
          }
          const usernameEnc = encryptWithDataKey(dataKey, username)
          const passwordEnc = encryptWithDataKey(dataKey, '') // Placeholder password
          
          await prisma.steamAccount.create({
            data: {
              userId,
              usernameEnc,
              passwordEnc,
              refreshTokenEnc,
              status: 'idle',
              lastLoginAt: new Date()
            }
          })
          log.info('✅ Steam account created via QR with refreshToken', { userId, steamId, username })
        }
        
        // Update Redis with success status
        const currentSessionData = await redis.get(`qr:${sessionId}`)
        if (currentSessionData) {
          const data = JSON.parse(currentSessionData)
          data.status = 'authenticated'
          data.steamId = steamId
          data.username = username
          await redis.set(`qr:${sessionId}`, JSON.stringify(data), 'EX', 60)
        }
        
        // Release proxy transiently used for QR
        try {
          if (proxyUrl) {
            proxyManager.releaseProxy(proxyAssignmentId)
          }
        } catch {}
      } catch (err: any) {
        log.error('❌ Failed to save QR login account', { error: err.message, stack: err.stack })
        
        // Release proxy transiently used for QR on error
        try {
          if (proxyUrl) {
            proxyManager.releaseProxy(proxyAssignmentId)
          }
        } catch {}
        
        // Update Redis with error status
        const currentSessionData = await redis.get(`qr:${sessionId}`)
        if (currentSessionData) {
          const data = JSON.parse(currentSessionData)
          data.status = 'error'
          data.error = err.message
          await redis.set(`qr:${sessionId}`, JSON.stringify(data), 'EX', 60)
        }
      }
    })
    
    loginSession.on('timeout', async () => {
      log.warn('⏱️ QR session timeout', { sessionId })
      // Release proxy on timeout
      try {
        if (proxyUrl) {
          proxyManager.releaseProxy(proxyAssignmentId)
        }
      } catch {}
      const currentSessionData = await redis.get(`qr:${sessionId}`)
      if (currentSessionData) {
        const data = JSON.parse(currentSessionData)
        data.status = 'timeout'
        await redis.set(`qr:${sessionId}`, JSON.stringify(data), 'EX', 60)
      }
    })
    
    loginSession.on('error', async (err: Error) => {
      log.error('❌ QR login session error', { sessionId, error: err.message, stack: err.stack })
      // Report proxy failure and release
      try {
        if (proxyUrl) {
          proxyManager.reportProxyFailure(proxyAssignmentId, proxyUrl, err.message)
          proxyManager.releaseProxy(proxyAssignmentId)
        }
      } catch {}
      
      const currentSessionData = await redis.get(`qr:${sessionId}`)
      if (currentSessionData) {
        const data = JSON.parse(currentSessionData)
        data.status = 'error'
        data.error = err.message
        await redis.set(`qr:${sessionId}`, JSON.stringify(data), 'EX', 60)
      }
    })
    
    // Start QR login and get challenge URL
    const startResult = await loginSession.startWithQR()
    
    log.info('✅ QR challenge received', { 
      sessionId, 
      qrChallengeUrl: startResult.qrChallengeUrl
    })
    
    // Generate QR code as data URL from the challenge URL
    const qrDataUrl = await QRCode.toDataURL(startResult.qrChallengeUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    log.info('✅ QR code image generated', { sessionId, qrDataUrlLength: qrDataUrl.length })
    
    // Store QR data URL in Redis
    const sessionData = await redis.get(`qr:${sessionId}`)
    if (sessionData) {
      const data = JSON.parse(sessionData)
      data.qrUrl = qrDataUrl // Store as data URL for direct display
      data.challengeUrl = startResult.qrChallengeUrl
      data.status = 'waiting' // Update status to waiting for scan
      data.proxyLocation = proxyLocation // Store location for UI display
      await redis.set(`qr:${sessionId}`, JSON.stringify(data), 'EX', 300)
      log.info('✅ QR data stored in Redis', { sessionId, proxyLocation })
    } else {
      log.warn('⚠️ Session data not found in Redis', { sessionId })
    }
    
  } catch (err: any) {
    log.error('❌ QR login handler error', { userId, sessionId, error: err.message, stack: err.stack })
    // Ensure proxy is released on handler-level error
    try {
      if (proxyUrl) {
        proxyManager.releaseProxy(proxyAssignmentId)
      }
    } catch {}
    
    // Update Redis with error status
    try {
      const currentSessionData = await redis.get(`qr:${sessionId}`)
      if (currentSessionData) {
        const data = JSON.parse(currentSessionData)
        data.status = 'error'
        data.error = err.message
        await redis.set(`qr:${sessionId}`, JSON.stringify(data), 'EX', 60)
      }
    } catch (redisErr) {
      log.error('❌ Failed to update Redis error status', { error: redisErr })
    }
  }
}

async function main() {
  const connection = getRedis()
  
  new Worker<SessionJob>(QUEUE_SESSION, async job => {
    const { action, userId, steamAccountId, totpCode } = job.data as any
    log.info('Worker processing job', { action, userId, steamAccountId, hasTotpCode: !!totpCode })
    if (action === 'start') return handleStart(userId, steamAccountId, totpCode)
    if (action === 'stop') return handleStop(userId, steamAccountId)
    if (action === 'refresh') return handleStart(userId, steamAccountId, totpCode)
    if (action === 'reload_settings') return handleReloadSettings(userId, steamAccountId)
    if (action === 'qr-login') return handleQRLogin(userId, (job.data as any).sessionId)
  }, { connection, concurrency: 3 })

  const healthQueue = new Queue(QUEUE_HEALTH, { connection })
  new Worker(QUEUE_HEALTH, async () => {
    await healthCheck()
  }, { connection })

  await healthQueue.add('health', {}, { ...defaultJobOpts, repeat: { pattern: '*/60 * * * * *' } })

  log.info('Worker started with health checks')
}

process.on('unhandledRejection', (reason, promise) => {
  log.error('⚠️ Unhandled Rejection detected globally in worker:', { 
    reason: reason instanceof Error ? reason.message : String(reason), 
    stack: reason instanceof Error ? reason.stack : undefined 
  })
})

process.on('uncaughtException', (err) => {
  log.error('⚠️ Uncaught Exception detected globally in worker:', { 
    error: err.message, 
    stack: err.stack 
  })
})

main().catch(err => {
  console.error(err)
  process.exit(1)
})
