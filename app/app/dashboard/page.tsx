'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { showSuccess, showError, showWarning, confirm } from '@/lib/sweetalert'
import { SubscriptionWidget } from '@/components/SubscriptionWidget'

// Sound utility function
const playSound = (soundFile: string, volume: number = 0.3) => {
  try {
    // Only play sounds if audio is supported and user has interacted with page
    if (typeof Audio !== 'undefined') {
      const audio = new Audio(`/${soundFile}`)
      audio.volume = Math.min(Math.max(volume, 0), 1) // Clamp volume between 0 and 1
      audio.play().catch(e => {
        // Silently handle play failures (common on mobile or without user interaction)
        console.debug('Sound play prevented:', e.name)
      })
    }
  } catch (e) {
    console.debug('Sound creation failed:', e)
  }
}

type SteamAccount = {
  id: string
  usernameEnc: string
  passwordEnc: string
  sharedSecretEnc: string | null
  status: string
  username?: string
  appearOnline?: boolean
  hideRecentActivity?: boolean
  autoRestart?: boolean
  autoAcceptFriends?: boolean
  customAwayMessage?: string
  customInGameTitle?: string
}

type Game = { 
  appId: number
  name: string 
  image?: string
}

type SessionGame = { 
  appId: number
  game?: Game
  secondsAccumulated?: number 
}

type Session = {
  id: string
  status: string
  statusMessage?: string | null
  steamAccountId: string
  games: SessionGame[]
}

type SearchResult = {
  appId: number
  name: string
  image?: string
}

// Known game names
const KNOWN_GAMES: Record<number, string> = {
  730: 'Counter-Strike 2',
  440: 'Team Fortress 2',
  570: 'Dota 2',
  230410: 'Warframe',
  252490: 'Rust',
  218620: 'PAYDAY 2',
  2073620: 'Arena Breakout Infinite',
  2767030: 'Marvel Rivals',
  // Add more as needed
}

// Helper function to get game name from appId
function getGameName(appId: number): string {
  return KNOWN_GAMES[appId] || `Game ${appId}`
}

// Helper function to format time from seconds
function formatTime(seconds: number = 0): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}:${minutes.toString().padStart(2, '0')} h`
}

// Helper function to calculate total accumulated hours across all active sessions
// For display consistency with subscription widget, we should show billing hours instead
function calculateTotalAccumulatedHours(sessions: Session[]): number {
  // Note: This shows raw accumulated seconds from games
  // For better UX alignment with subscription tracking, consider using subscription.hoursUsed
  return sessions.reduce((total, session) => {
    if (session.status === 'running' && session.games) {
      const sessionTotal = session.games.reduce((sessionSum, game) => {
        return sessionSum + (game.secondsAccumulated || 0)
      }, 0)
      return total + sessionTotal
    }
    return total
  }, 0)
}

export default function DashboardPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<SteamAccount[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [prevSessions, setPrevSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showConnect, setShowConnect] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [sharedSecret, setSharedSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showAddGame, setShowAddGame] = useState(false)
  const [currentAccountId, setCurrentAccountId] = useState<string>('')
  const [gameAppId, setGameAppId] = useState('')
  const [addingGame, setAddingGame] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [totpEnabled, setTotpEnabled] = useState<boolean | null>(null)

  const [totpCode, setTotpCode] = useState('')
  const [needsTotp, setNeedsTotp] = useState(false)
  const [totpAccountId, setTotpAccountId] = useState<string>('')
  const [totpLoading, setTotpLoading] = useState(false)

  const [showSettings, setShowSettings] = useState(false)
  const [settingsAccount, setSettingsAccount] = useState<SteamAccount | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  
  // QR Code login states
  const [useQRLogin, setUseQRLogin] = useState(false)
  const [qrSessionId, setQrSessionId] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [qrStatus, setQrStatus] = useState<'idle' | 'generating' | 'waiting' | 'success' | 'error'>('idle')
  const [qrLocation, setQrLocation] = useState('')
  
  const fmtHM = (sec?: number) => {
    if (!sec || sec <= 0) return '0:00'
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    return `${h}:${m.toString().padStart(2, '0')}`
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [accountsRes, sessionsRes, totpRes] = await Promise.all([
        fetch('/api/steam/account'),
        fetch('/api/sessions'),
        fetch('/api/security/totp/status')
      ])
      if (accountsRes.ok) {
        const data = await accountsRes.json()
        setAccounts(data.accounts || [])
      }
      if (sessionsRes.ok) {
        const data = await sessionsRes.json()
        const newSessions = data.sessions || []
        setSessions(newSessions)
        
        // Check if any session needs TOTP
        const totpNeeded = newSessions.find((s: Session) => s.status === 'totp_required')
        if (totpNeeded && !needsTotp) {
          setTotpAccountId(totpNeeded.steamAccountId)
          setNeedsTotp(true)
        }
      }
      if (totpRes.ok) {
        const st = await totpRes.json()
        setTotpEnabled(!!st.enabled)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Set up Server-Sent Events for real-time updates
    const eventSource = new EventSource('/api/sessions/stream')
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'update' && data.sessions) {
          setSessions(data.sessions)
          
          // Check if any session needs TOTP
          const totpNeeded = data.sessions.find((s: Session) => s.status === 'totp_required')
          if (totpNeeded && !needsTotp) {
            setTotpAccountId(totpNeeded.steamAccountId)
            setNeedsTotp(true)
          }
        }
      } catch (e) {
        console.error('SSE parse error:', e)
      }
    }
    
    eventSource.onerror = () => {
      console.log('SSE connection lost, reconnecting...')
      eventSource.close()
      // Fallback to polling if SSE fails
      const interval = setInterval(fetchData, 5000)
      return () => clearInterval(interval)
    }
    
    return () => {
      eventSource.close()
    }
  }, [])

  // Watch for session status changes and play sounds
  useEffect(() => {
    if (prevSessions.length === 0 && sessions.length > 0) {
      // First load, just set previous sessions without playing sounds
      setPrevSessions(sessions)
      return
    }

    if (sessions.length === 0) return

    // Check for status changes
    sessions.forEach(session => {
      const prevSession = prevSessions.find(p => p.steamAccountId === session.steamAccountId)
      if (prevSession && prevSession.status !== session.status) {
        // Status changed, check if it's a sound-worthy change
        if (session.status === 'running' && prevSession.status !== 'running') {
          // Worker started running
          console.log('🎵 Playing start sound - session became running')
          playSound('worker-start.wav')
        } else if (prevSession.status === 'running' && session.status !== 'running') {
          // Worker stopped running
          console.log('🎵 Playing stop sound - session stopped running')
          playSound('worker-stop.wav')
        }
      }
    })

    // Update previous sessions
    setPrevSessions(sessions)
  }, [sessions])

    const startQRLogin = async () => {
    setQrStatus('generating')
    try {
      const res = await fetch('/api/steam/qr-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      })
      
      if (!res.ok) {
        throw new Error('Failed to start QR login')
      }
      
      const data = await res.json()
      setQrSessionId(data.sessionId)
      setQrStatus('waiting')
      
      // Poll for QR code and status
      pollQRStatus(data.sessionId)
    } catch (e) {
      setError('Failed to generate QR code. Please try again.')
      setQrStatus('error')
    }
  }
  
  const pollQRStatus = async (sessionId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/steam/qr-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check', sessionId })
        })
        
        if (!res.ok) {
          clearInterval(interval)
          setQrStatus('error')
          return
        }
        
        const data = await res.json()
        
        if (data.qrUrl && !qrCodeUrl) {
          setQrCodeUrl(data.qrUrl)
        }
        
        if (data.proxyLocation) {
          setQrLocation(data.proxyLocation)
        }
        
        if (data.status === 'authenticated') {
          clearInterval(interval)
          setQrStatus('success')
          await fetchData()
          setTimeout(() => {
            setShowConnect(false)
            setUseQRLogin(false)
            setQrCodeUrl('')
            setQrSessionId('')
            setQrStatus('idle')
            showSuccess('Steam account connected successfully via QR code!')
          }, 1500)
        } else if (data.status === 'timeout' || data.status === 'cancelled') {
          clearInterval(interval)
          setQrStatus('error')
          setError('QR code expired or cancelled. Please try again.')
        }
      } catch (e) {
        clearInterval(interval)
        setQrStatus('error')
      }
    }, 2000) // Poll every 2 seconds
    
    // Timeout after 3 minutes
    setTimeout(() => {
      clearInterval(interval)
      if (qrStatus === 'waiting') {
        setQrStatus('error')
        setError('QR code expired. Please try again.')
      }
    }, 180000)
  }
  
  const cancelQRLogin = async () => {
    if (qrSessionId) {
      await fetch('/api/steam/qr-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', sessionId: qrSessionId })
      })
    }
    setUseQRLogin(false)
    setQrCodeUrl('')
    setQrSessionId('')
    setQrStatus('idle')
    setError('')
  }

  const handleSaveSteam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError('Username and password required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      // Create a payload with required fields
      const payload: Record<string, string> = { 
        username, 
        password
      }
      
      // Only add sharedSecret if it's not empty
      if (sharedSecret && sharedSecret.trim() !== '') {
        payload.sharedSecret = sharedSecret.trim()
      }
      
      const res = await fetch('/api/steam/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to connect' }))
        throw new Error(errorData.error || 'Failed to connect')
      }
      
      await fetchData()
      setShowConnect(false)
      setUsername('')
      setPassword('')
      setSharedSecret('')
      showSuccess('Steam account connected successfully!')
    } catch (e: any) {
      console.error('Steam connection error:', e);
      
      // Set a more helpful error message
      if (e.message === 'Invalid input data') {
        setError('Invalid input data. Please check that your username and password are correct and try again.')
      } else {
        setError(`Failed to connect: ${e.message || 'Please check your credentials'}. Check worker logs for details.`)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gameAppId) {
      showWarning('Please enter an App ID')
      return
    }
    const appIdNum = parseInt(gameAppId)
    if (isNaN(appIdNum) || appIdNum <= 0) {
      showError('Invalid App ID. Please enter a valid number (e.g., 730)')
      return
    }
    
    if (!currentAccountId) {
      showError('No Steam account selected')
      return
    }
    
    setAddingGame(true)
    try {
      console.log(`Adding game ${appIdNum} to account ${currentAccountId}`)
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: appIdNum, steamAccountId: currentAccountId })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      await fetchData()
      
      // Reload settings in worker if session is running
      await reloadWorkerSettings(currentAccountId)
      
      setShowAddGame(false)
      setGameAppId('')
      setCurrentAccountId('')
      showSuccess('Game added successfully!')
    } catch (e: any) {
      showError(e.message || 'Failed to add game.')
    } finally {
      setAddingGame(false)
    }
  }

  const handleRemoveGame = async (steamAccountId: string, appId: number) => {
    const confirmed = await confirm('Remove this game from the boost session?')
    if (!confirmed) return
    try {
      const res = await fetch(`/api/games/${appId}?steamAccountId=${steamAccountId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      await fetchData()
      
      // Reload settings in worker if session is running
      await reloadWorkerSettings(steamAccountId)
      
      showSuccess('Game removed successfully!')
    } catch (e) {
      showError('Failed to remove game')
    }
  }

  // Helper function to reload worker settings
  // Helper function to reload worker settings
  const reloadWorkerSettings = async (steamAccountId: string) => {
    try {
      await fetch('/api/sessions/reload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steamAccountId })
      })
      // Silent success - no need to show notification
    } catch (e) {
      console.error('Failed to reload worker settings:', e)
      // Don't show error to user - settings will apply on next session start
    }
  }

  const handleSessionAction = async (accountId: string, action: 'start' | 'stop') => {
    const account = accounts.find(a => a.id === accountId)
    if (!account) return
    
    if (action === 'start') {
      const session = sessions.find(s => s.steamAccountId === accountId)
      if (!session?.games || session.games.length === 0) {
        showWarning('Please add at least one game before starting')
        return
      }
    }
    
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, steamAccountId: accountId })
      })
      if (!res.ok) {
        const err = await res.json()
        // Worker will tell us if TOTP is needed
        if (err.error === 'TOTP_REQUIRED') {
          setTotpAccountId(accountId)
          setNeedsTotp(true)
          return
        }
        throw new Error(err.error || 'Failed')
      }
      await fetchData()
      showSuccess(action === 'start' ? 'Boost session started!' : 'Boost session stopped!')
    } catch (e: any) {
      showError(e.message || `Failed to ${action} session`)
    }
  }

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!totpCode || totpCode.length !== 5) {
      showWarning('Invalid TOTP code. Must be 5 characters.')
      return
    }
    
    setTotpLoading(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', steamAccountId: totpAccountId, totpCode })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      await fetchData()
      setNeedsTotp(false)
      setTotpCode('')
      setTotpAccountId('')
      showSuccess('Authenticated successfully! Boost session started.')
    } catch (e: any) {
      showError(e.message || 'Authentication failed. Please check your TOTP code.')
    } finally {
      setTotpLoading(false)
    }
  }

  const handleDeleteAccount = async (accountId: string, username: string) => {
    const confirmed = await confirm(
      `Delete Steam account?`,
      `"${username}" will be permanently deleted along with all sessions and games.`
    )
    if (!confirmed) return

    try {
      const res = await fetch(`/api/steam/account/${accountId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchData()
      showSuccess('Steam account deleted successfully!')
    } catch (e) {
      showError('Failed to delete account')
    }
  }

  const handleOpenSettings = (account: SteamAccount) => {
    setSettingsAccount(account)
    setShowSettings(true)
  }

  const getSessionForAccount = (accountId: string) => {
    return sessions.find(s => s.steamAccountId === accountId)
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'running':
        return { label: 'Running', color: 'text-primary', bg: 'bg-primary/20', icon: 'fa-circle-play' }
      case 'connecting':
        return { label: 'Connecting...', color: 'text-primary', bg: 'bg-primary/20', icon: 'fa-spinner-third fa-spin' }
      case 'paused':
        return { label: 'Paused', color: 'text-primary', bg: 'bg-primary/20', icon: 'fa-circle-pause' }
      case 'throttled':
        return { label: 'Rate Limited', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: 'fa-clock' }
      case 'totp_required':
        return { label: 'Auth Required', color: 'text-primary', bg: 'bg-primary/20', icon: 'fa-shield-keyhole' }
      case 'totp_wrong':
        return { label: 'Wrong Code', color: 'text-red-400', bg: 'bg-red-500/20', icon: 'fa-shield-xmark' }
      case 'error':
        return { label: 'Error', color: 'text-red-400', bg: 'bg-red-500/20', icon: 'fa-circle-xmark' }
      default:
        return { label: 'Stopped', color: 'text-muted', bg: '', icon: 'fa-circle-stop' }
    }
  }

  if (loading && accounts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shadow-lg shadow-primary/10">
                <i className="fa-duotone fa-gauge-high text-primary text-xl"></i>
              </div>
              <div>
                <h1 className="text-3xl font-black">Dashboard</h1>
                <p className="text-muted text-sm mt-1">Manage your Steam boost sessions</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-2"></div>
            <div className="h-3 w-36 bg-surface border border-border/10 rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/10">
            <i className="fa-duotone fa-spinner-third fa-spin text-3xl text-primary"></i>
          </div>
          <p className="text-lg font-medium">Loading your accounts...</p>
          <p className="text-sm text-muted mt-1">Please wait while we retrieve your data</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shadow-lg shadow-primary/10">
                <i className="fa-duotone fa-gauge-high text-primary text-xl"></i>
              </div>
              <div>
                <h1 className="text-3xl font-black">Dashboard</h1>
                <p className="text-muted text-sm mt-1">Manage your Steam boost sessions</p>
              </div>
            </div>
          </div>
          <SubscriptionWidget />
        </div>

        {totpEnabled === false && (
          <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 px-4 py-3 text-sm flex items-center gap-3">
            <i className="fa-duotone fa-shield"></i>
            <div>
              <div className="font-medium">We recommend enabling 2FA (TOTP)</div>
              <div className="text-xs opacity-80">Protect your account with an authenticator app. It takes less than a minute.</div>
            </div>
            <a href="/app/security" className="ml-auto px-3 py-1.5 rounded-xl border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors text-yellow-200 text-xs">Enable now</a>
          </div>
        )}

        {/* Statistics Card */}
        {accounts.length > 0 && (
          <div className="card p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-black text-primary mb-1">
                  {sessions.filter(s => s.status === 'running').length}
                </div>
                <div className="text-xs text-muted flex items-center justify-center gap-1">
                  <i className="fa-duotone fa-play-circle text-green-400"></i>
                  Active Sessions
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-black text-primary mb-1">
                  {sessions.reduce((total, s) => total + (s.games?.length || 0), 0)}
                </div>
                <div className="text-xs text-muted flex items-center justify-center gap-1">
                  <i className="fa-duotone fa-gamepad text-primary/70"></i>
                  Total Games
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-black text-primary mb-1">
                  {formatTime(calculateTotalAccumulatedHours(sessions)).replace(' h', '')}
                </div>
                <div className="text-xs text-muted flex items-center justify-center gap-1">
                  <i className="fa-duotone fa-clock text-amber-400"></i>
                  Session Hours
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-black text-primary mb-1">
                  {accounts.length}
                </div>
                <div className="text-xs text-muted flex items-center justify-center gap-1">
                  <i className="fa-brands fa-steam text-blue-400"></i>
                  Steam Accounts
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Steam Accounts */}
        {accounts.length === 0 ? (
          <div className="card p-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-primary/15 flex items-center justify-center shadow-lg shadow-primary/10">
                  <i className="fa-brands fa-steam text-primary text-3xl"></i>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">Welcome to IdleMates</h3>
                  <p className="text-muted">Connect your first Steam account to start boosting hours automatically</p>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-primary/10 border border-border/10">
                  <i className="fa-duotone fa-shield-check text-primary text-xl mb-3"></i>
                  <h4 className="font-bold mb-1">Secure Authentication</h4>
                  <p className="text-xs text-muted">Connect via Steam QR code or credentials with AES-256 encryption</p>
                </div>
                
                <div className="p-4 rounded-xl bg-primary/10 border border-border/10">
                  <i className="fa-duotone fa-gamepad-modern text-primary text-xl mb-3"></i>
                  <h4 className="font-bold mb-1">Multi-Game Support</h4>
                  <p className="text-xs text-muted">Boost up to 32 games simultaneously on each account</p>
                </div>
                
                <div className="p-4 rounded-xl bg-primary/10 border border-border/10">
                  <i className="fa-duotone fa-cloud text-primary text-xl mb-3"></i>
                  <h4 className="font-bold mb-1">24/7 Cloud Running</h4>
                  <p className="text-xs text-muted">Sessions run in the cloud - your PC stays free</p>
                </div>
              </div>

              <button 
                onClick={() => setShowConnect(true)}
                className="btn btn-lg flex items-center justify-center gap-2"
              >
                <i className="fa-brands fa-steam mr-1"></i> Connect Steam Account
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {accounts.map(account => {
              const session = getSessionForAccount(account.id)
              const statusInfo = getStatusDisplay(session?.status || 'stopped')
              
              return (
                <div key={account.id} className="card p-6">
                  <div className="p-4 sm:p-6 border-b border-border/10 ">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusInfo.bg} border border-border/10`}>
                          <i className={`fa-brands fa-steam text-2xl ${statusInfo.color}`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg sm:text-xl font-bold truncate">{account.username || `Steam Account #${accounts.indexOf(account) + 1}`}</h2>
                            <button
                              onClick={() => handleOpenSettings(account)}
                              className="w-7 h-7 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                              title="Account settings"
                            >
                              <i className="fa-duotone fa-gear text-sm text-primary"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(account.id, account.username || `Account #${accounts.indexOf(account) + 1}`)}
                              className="w-7 h-7 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                              title="Delete account"
                            >
                              <i className="fa-duotone fa-trash text-sm text-red-400"></i>
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color} border border-primary/10`}>
                              <i className={`fa-duotone ${statusInfo.icon}`}></i>
                              {statusInfo.label}
                            </span>
                            {session?.statusMessage && (
                              <span className="text-xs text-muted">({session.statusMessage})</span>
                            )}
                          </div>
                          {/* Custom In-Game Title */}
                          {account.customInGameTitle && (
                            <div className="mt-1 text-xs">
                              <span className="text-muted">Custom In-Game Title:</span>{' '}
                              <span className="font-semibold text-primary">{account.customInGameTitle}</span>
                            </div>
                          )}
                          {/* Connection status details */}
                          {session?.status === 'connecting' && (
                            <div className="mt-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
                              <i className="fa-duotone fa-plug mr-1.5"></i>
                              Establishing connection to Steam...
                            </div>
                          )}
                          {session?.status === 'throttled' && (
                            <div className="mt-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400">
                              <i className="fa-duotone fa-clock mr-1.5"></i>
                              Steam rate limit active. Will auto-retry in 30-60 minutes. Please don't restart manually.
                            </div>
                          )}
                          {session?.status === 'totp_required' && (
                            <div className="mt-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
                              <i className="fa-duotone fa-shield-keyhole mr-1.5"></i>
                              Steam Guard code required. {session.statusMessage || 'Check your mobile device.'}
                            </div>
                          )}
                          {session?.status === 'totp_wrong' && (
                            <div className="mt-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                              <i className="fa-duotone fa-shield-xmark mr-1.5"></i>
                              Incorrect code. {session.statusMessage || 'Please try again.'}
                            </div>
                          )}
                          {session?.status === 'error' && session?.statusMessage && (
                            <div className="mt-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                              <i className="fa-duotone fa-triangle-exclamation mr-1.5"></i>
                              {session.statusMessage}
                              {session.statusMessage.includes('ECONNREFUSED') && (
                                <span> (Proxy server not reachable)</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 sm:gap-3">
                        <button 
                          onClick={() => handleSessionAction(account.id, 'start')}
                          disabled={session?.status === 'running' || session?.status === 'connecting'}
                          className="btn text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial"
                        >
                          <i className={`fa-duotone mr-1.5 ${session?.status === 'connecting' ? 'fa-spinner-third fa-spin' : 'fa-play'}`}></i> 
                          {session?.status === 'connecting' ? 'Connecting...' : 'Start'}
                        </button>
                        <button 
                          onClick={() => handleSessionAction(account.id, 'stop')}
                          disabled={session?.status !== 'running' && session?.status !== 'connecting'}
                          className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial"
                        >
                          <i className="fa-duotone fa-stop mr-1.5"></i> Stop
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Games List */}
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                          <i className="fa-duotone fa-gamepad text-primary"></i>
                        </div>
                        Games {session?.games && session.games.length > 0 ? `(${session.games.length})` : ''}
                      </h3>
                      <button 
                        onClick={() => {
                          setCurrentAccountId(account.id)
                          setShowAddGame(true)
                        }}
                        className="btn-secondary text-sm"
                      >
                        <i className="fa-duotone fa-plus mr-1.5"></i> Add Game
                      </button>
                    </div>

                    {!session?.games || session.games.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-border/10 rounded-xl ">
                        <i className="fa-duotone fa-gamepad text-4xl text-primary mb-3"></i>
                        <p className="font-medium mb-1">No games added yet</p>
                        <p className="text-xs text-muted">Add games to start boosting hours</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {session.games.map((sg) => (
                          <div key={sg.appId} className="flex items-center justify-between p-3 sm:p-4 rounded-xl  hover:bg-primary/10 transition-all border border-primary/10 hover:border-border/10">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {sg.game?.image ? (
                                <img 
                                  src={sg.game.image} 
                                  alt={sg.game.name || getGameName(sg.appId)}
                                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-border/10"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                  }}
                                />
                              ) : null}
                              <div className={`w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 ${sg.game?.image ? 'hidden' : ''}`}>
                                {sg.appId}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm truncate">{sg.game?.name || getGameName(sg.appId)}</p>
                                <p className="text-xs text-muted flex items-center gap-1.5">
                                  <i className="fa-duotone fa-clock"></i>
                                  {formatTime(sg.secondsAccumulated)}
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleRemoveGame(account.id, sg.appId)}
                              className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors flex items-center justify-center flex-shrink-0 ml-3"
                              title="Remove"
                            >
                              <i className="fa-duotone fa-xmark"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add More Accounts Button */}
        {accounts.length > 0 && (
          <div className="card p-6">
            <button 
              onClick={() => setShowConnect(true)}
              className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 text-primary font-medium"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <i className="fa-brands fa-steam text-2xl"></i>
              </div>
              <div className="text-center sm:text-left">
                <span className="text-lg font-bold block">Add Another Steam Account</span>
                <span className="text-xs opacity-75">Boost multiple accounts simultaneously</span>
              </div>
            </button>
          </div>
        )}

        {/* Add Steam Account Modal */}
        {showConnect && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 !mt-0">
            <div className="card p-6">
              <div className="p-6 border-b border-white/10 ">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <i className="fa-brands fa-steam text-primary text-xl"></i>
                  </div>
                  Connect Steam Account
                </h3>
              </div>
              
              {!useQRLogin ? (
                <>
                  <form onSubmit={handleSaveSteam} className="p-4 sm:p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Steam Username</label>
                      <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        className="input"
                        placeholder="your_steam_username"
                        required
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Password</label>
                      <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        className="input"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Shared Secret <span className="text-muted">(optional)</span>
                      </label>
                      <input 
                        type="text" 
                        value={sharedSecret} 
                        onChange={(e) => setSharedSecret(e.target.value)}
                        className="input"
                        placeholder="ABC123XYZ=="
                      />
                      <p className="text-xs text-muted mt-2">
                        If you have Steam Guard enabled, provide your shared_secret to avoid TOTP prompts. Otherwise, you'll need to enter the code manually each time.
                      </p>
                    </div>
                    {error && (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                        <i className="fa-duotone fa-circle-exclamation text-lg flex-shrink-0 mt-0.5"></i>
                        <div className="flex-1">
                          <span className="font-medium block mb-1">Connection Error</span>
                          <span>{error}</span>
                          {error.includes('Check worker logs') && (
                            <div className="mt-2 p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-xs font-mono">
                              <p className="mb-1">To check logs, run this command:</p>
                              <code className="block bg-black/50 p-1 rounded">tail -n 100 logs/worker.log</code>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* QR Code Option */}
                    <div className="pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setUseQRLogin(true)
                          startQRLogin()
                        }}
                        className="w-full p-4 rounded-xl border-2 border-border/10 hover:border-primary/40  hover:bg-primary/10 transition-all text-center"
                      >
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                            <i className="fa-duotone fa-qrcode text-primary"></i>
                          </div>
                          <span className="font-semibold">Login with QR Code</span>
                        </div>
                        <p className="text-xs text-muted">Faster and more secure - scan with Steam Mobile</p>
                      </button>
                    </div>
                    
                    <div className="flex gap-3">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowConnect(false)
                          setError('')
                        }}
                        className="btn-secondary flex-1"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn flex-1"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <i className="fa-duotone fa-spinner-third fa-spin"></i> Connecting...
                          </>
                        ) : (
                          <>
                            <i className="fa-duotone fa-plug mr-1.5"></i> Connect
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="p-6 space-y-6">
                  <div className="text-center">
                    {qrStatus === 'generating' && (
                      <>
                        <i className="fa-duotone fa-spinner-third fa-spin text-6xl text-primary mb-4"></i>
                        <p className="text-muted font-medium">Generating QR code...</p>
                      </>
                    )}
                    
                    {qrStatus === 'waiting' && qrCodeUrl && (
                      <>
                        <div className="bg-white p-6 rounded-2xl inline-block mb-6 shadow-lg">
                          <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                        </div>
                        <h4 className="font-bold text-lg mb-3">Scan with Steam Mobile App</h4>
                        <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-border/10 mb-6">
                          <i className="fa-duotone fa-circle-notch fa-spin text-primary"></i>
                          <span className="text-sm font-medium text-primary">Waiting for confirmation...</span>
                        </div>
                        
                        {/* Instructions */}
                        <div className="text-left bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-blue-400">1</span>
                            </div>
                            <div className="text-sm">
                              <p className="font-semibold text-blue-400 mb-1">Open Steam Mobile App</p>
                              <p className="text-muted">Tap the QR code scanner in the app</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-blue-400">2</span>
                            </div>
                            <div className="text-sm">
                              <p className="font-semibold text-blue-400 mb-1">Approve Location Sign-in</p>
                              <p className="text-muted">When prompted, select <strong>"Yes, it's me"</strong> to confirm the login from <strong>{qrLocation || 'our server location'}</strong></p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-blue-400">3</span>
                            </div>
                            <div className="text-sm">
                              <p className="font-semibold text-blue-400 mb-1">Approve Steam Guard</p>
                              <p className="text-muted">You may be asked to approve via Steam Guard authenticator - tap <strong>"Approve"</strong></p>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t border-blue-500/20">
                            <p className="text-xs text-muted">
                              <i className="fa-duotone fa-info-circle text-blue-400 mr-1.5"></i>
                              The login will appear from <strong>{qrLocation || 'our cloud server\'s location'}</strong>. This is normal and secure.
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {qrStatus === 'waiting' && !qrCodeUrl && (
                      <>
                        <i className="fa-duotone fa-spinner-third fa-spin text-6xl text-primary mb-4"></i>
                        <p className="text-muted font-medium">Loading QR code...</p>
                      </>
                    )}
                    
                    {qrStatus === 'success' && (
                      <>
                        <div className="w-20 h-20 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                          <i className="fa-duotone fa-circle-check text-5xl text-green-500"></i>
                        </div>
                        <p className="text-green-500 font-bold text-lg">Authentication successful!</p>
                      </>
                    )}
                    
                    {qrStatus === 'error' && (
                      <>
                        <div className="w-20 h-20 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                          <i className="fa-duotone fa-circle-xmark text-5xl text-red-500"></i>
                        </div>
                        <p className="text-red-500 font-bold text-lg mb-2">Error</p>
                        {error && <p className="text-sm text-muted">{error}</p>}
                      </>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={cancelQRLogin}
                      className="btn-secondary flex-1"
                      disabled={qrStatus === 'success'}
                    >
                      <i className="fa-duotone fa-arrow-left mr-1.5"></i> Back
                    </button>
                    {qrStatus === 'error' && (
                      <button
                        type="button"
                        onClick={() => {
                          setQrStatus('idle')
                          setError('')
                          startQRLogin()
                        }}
                        className="btn flex-1"
                      >
                        <i className="fa-duotone fa-rotate-right mr-1.5"></i> Retry
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Game Modal */}
        {showAddGame && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 !mt-0" 
            onClick={() => {
              // Close modal when clicking outside
              setShowAddGame(false)
              setGameAppId('')
              setSearchQuery('')
              setSearchResults([])
              setCurrentAccountId('')
            }}
          >
            <div 
              className="card p-6"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
              <div className="p-6 border-b border-white/10 ">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <i className="fa-duotone fa-gamepad text-primary text-xl"></i>
                  </div>
                  Add Game
                </h3>
                {currentAccountId && (
                  <div className="mt-2 text-xs text-text-muted">
                    Target account: <span className="font-semibold text-primary">{accounts.find(a => a.id === currentAccountId)?.username || currentAccountId}</span>
                  </div>
                )}
              </div>
              <form onSubmit={handleAddGame} className="p-6 space-y-4">
                                  <div>
                    <label className="block text-sm font-medium mb-2">Search Games</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input flex-1"
                        placeholder="Search by game name..."
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!searchQuery.trim()) return
                          setSearching(true)
                          try {
                            const res = await fetch(`/api/games/search?q=${encodeURIComponent(searchQuery)}`)
                            const data = await res.json()
                            setSearchResults(data.results || [])
                          } finally {
                            setSearching(false)
                          }
                        }}
                        className="btn"
                        disabled={searching}
                      >
                        {searching ? (
                          <i className="fa-duotone fa-spinner-third fa-spin"></i>
                        ) : (
                          <i className="fa-duotone fa-search"></i>
                        )}
                      </button>
                    </div>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="border border-border/10 rounded-xl divide-y divide-white/10 max-h-48 overflow-y-auto ">
                      {searchResults.map(game => (
                        <button
                          key={game.appId}
                          type="button"
                          onClick={() => {
                            setGameAppId(String(game.appId))
                            setSearchResults([])
                            setSearchQuery('')
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-primary/10 transition-colors text-left"
                        >
                          {game.image ? (
                            <img src={game.image} alt="" className="w-10 h-10 rounded-xl border border-border/10" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                              <i className="fa-duotone fa-gamepad-modern text-primary"></i>
                            </div>
                          )}
                          <div>
                            <div className="font-semibold">{game.name}</div>
                            <div className="text-xs text-muted">App ID: {game.appId}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.length === 0 && gameAppId && (
                    <div>
                      <label className="block text-sm font-medium mb-2 mt-4">Selected App ID</label>
                      <input 
                        type="text" 
                        value={gameAppId} 
                        onChange={(e) => setGameAppId(e.target.value)}
                        className="input"
                        placeholder="e.g., 730 for CS:GO"
                        required
                      />
                      <p className="text-xs text-muted mt-2">
                        You can also find App IDs on <a href="https://steamdb.info" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SteamDB.info</a>
                      </p>
                    </div>
                  )}
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAddGame(false)
                      setGameAppId('')
                      setSearchQuery('')
                      setSearchResults([])
                      setCurrentAccountId('') // Reset currentAccountId when canceling
                    }}
                    className="btn-secondary flex-1"
                    disabled={addingGame}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn flex-1"
                    disabled={addingGame}
                  >
                    {addingGame ? (
                      <>
                        <i className="fa-duotone fa-spinner-third fa-spin mr-1.5"></i> Adding...
                      </>
                    ) : (
                      <>
                        <i className="fa-duotone fa-plus mr-1.5"></i> Add Game
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TOTP Modal */}
        {needsTotp && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 !mt-0">
            <div className="card p-6">
              <div className="p-6 border-b border-white/10 ">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <i className="fa-duotone fa-shield-keyhole text-primary text-xl"></i>
                  </div>
                  Steam Guard Verification
                </h3>
              </div>
              <form onSubmit={handleTotpSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Enter TOTP Code</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[A-Za-z0-9]{5}"
                    value={totpCode.toUpperCase()} 
                    onChange={(e) => setTotpCode(e.target.value.replace(/\s/g, '').toUpperCase())}
                    className="input text-center text-2xl tracking-widest text-base"
                    placeholder="12345"
                    maxLength={5}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted mt-2">
                    Enter the 5-character code from your Steam Guard authenticator
                  </p>
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setNeedsTotp(false)
                      setTotpCode('')
                    }}
                    className="btn-secondary flex-1"
                    disabled={totpLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn flex-1"
                    disabled={totpLoading}
                  >
                    {totpLoading ? (
                      <>
                        <i className="fa-duotone fa-spinner-third fa-spin"></i> Verifying...
                      </>
                    ) : (
                      <>
                        <i className="fa-duotone fa-shield-check mr-1.5"></i> Verify
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && settingsAccount && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 !mt-0">
            <div className="card p-6">
              <div className="p-4 sm:p-6 border-b border-border/10 ">
                <h3 className="text-xl font-bold">Account Settings</h3>
                <p className="text-sm text-muted mt-1">{settingsAccount.username}</p>
              </div>
              <form
                className="p-4 sm:p-6 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!settingsAccount) return
                  setSavingSettings(true)
                  try {
                    const res = await fetch(`/api/steam/account/${settingsAccount.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        appearOnline: settingsAccount.appearOnline ?? true,
                        hideRecentActivity: settingsAccount.hideRecentActivity ?? false,
                        autoRestart: settingsAccount.autoRestart ?? false,
                        autoAcceptFriends: settingsAccount.autoAcceptFriends ?? false,
                        customAwayMessage: settingsAccount.customAwayMessage || null,
                        customInGameTitle: settingsAccount.customInGameTitle || null,
                      })
                    })
                    if (!res.ok) throw new Error('Failed')
                    await fetchData()
                    showSuccess('Settings saved')
                    setShowSettings(false)
                    setSettingsAccount(null)
                  } catch (err) {
                    showError('Failed to save settings')
                  } finally {
                    setSavingSettings(false)
                  }
                }}
              >
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/10">
                    <div>
                      <div className="font-medium">Appear Online</div>
                      <div className="text-xs text-muted">Show online status while idling</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsAccount.appearOnline ?? true}
                      onChange={(e) => setSettingsAccount({ ...settingsAccount, appearOnline: e.target.checked })}
                      className="toggle"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/10">
                    <div>
                      <div className="font-medium">Hide Recent Activity</div>
                      <div className="text-xs text-muted">Reduce visibility of played titles</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsAccount.hideRecentActivity ?? false}
                      onChange={(e) => setSettingsAccount({ ...settingsAccount, hideRecentActivity: e.target.checked })}
                      className="toggle"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/10">
                    <div>
                      <div className="font-medium">Auto Restart</div>
                      <div className="text-xs text-muted">Restart session if disconnected</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsAccount.autoRestart ?? false}
                      onChange={(e) => setSettingsAccount({ ...settingsAccount, autoRestart: e.target.checked })}
                      className="toggle"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/10">
                    <div>
                      <div className="font-medium">Auto-Accept Friend Requests</div>
                      <div className="text-xs text-muted">Automatically accept friend requests</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsAccount.autoAcceptFriends ?? false}
                      onChange={(e) => setSettingsAccount({ ...settingsAccount, autoAcceptFriends: e.target.checked })}
                      className="toggle"
                    />
                  </label>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Custom Away Message</label>
                    <input
                      type="text"
                      value={settingsAccount.customAwayMessage || ''}
                      onChange={(e) => setSettingsAccount({ ...settingsAccount, customAwayMessage: e.target.value })}
                      className="input"
                      placeholder="e.g., Be right back"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Custom In-Game Title</label>
                    <input
                      type="text"
                      value={settingsAccount.customInGameTitle || ''}
                      onChange={(e) => setSettingsAccount({ ...settingsAccount, customInGameTitle: e.target.value })}
                      className="input"
                      placeholder="e.g., Working"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettings(false)
                      setSettingsAccount(null)
                    }}
                    className="btn-secondary flex-1"
                    disabled={savingSettings}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn flex-1" disabled={savingSettings}>
                    {savingSettings ? (<><i className="fa-duotone fa-spinner-third fa-spin mr-2"></i> Saving...</>) : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
      <footer className="w-full py-6 mt-12 border-t border-white/10 text-center text-muted text-sm">
        &copy; {new Date().getFullYear()} IdleMates. All rights reserved.
      </footer>
    </>
  )
}
