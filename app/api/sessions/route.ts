import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sessionQueue, defaultJobOpts } from '@/lib/queue'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { getRedis } from '@/lib/redis'
export const dynamic = 'force-dynamic'

type SteamGame = {
  name: string
  icon?: string
}

type SessionWithGames = Prisma.BoostSessionGetPayload<{
  include: {
    games: {
      include: {
        game: true
      }
    }
    steamAccount: true
  }
}>

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // Return all sessions for all accounts with game details
  const sessions = await prisma.boostSession.findMany({ 
    where: { userId: user.id },
    include: { 
      games: {
        include: {
          game: true
        }
      },
      steamAccount: true
    }
  })
  
  // Post-process to ensure game names are available
  const sessionsWithGameDetails = await Promise.all(sessions.map(async (session: SessionWithGames) => {
    const gamesWithNames = await Promise.all(session.games.map(async (sg) => {
      if (!sg.game || !sg.game.name) {
        // Try to fetch game details from Steam if missing
        try {
          const searchUrl = `https://steamcommunity.com/actions/SearchApps/${sg.appId}`
          const searchRes = await fetch(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IdleMatesBot/1.0)' }
          })
          if (searchRes.ok) {
            const results = await searchRes.json() as SteamGame[]
            const gameDetails = results[0]
            if (gameDetails) {
              // Update game in database
              await prisma.game.upsert({
                where: { appId: sg.appId },
                create: {
                  appId: sg.appId,
                  name: gameDetails.name,
                  image: gameDetails.icon ? 
                    `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${sg.appId}/${gameDetails.icon}.jpg` : 
                    null
                },
                update: {
                  name: gameDetails.name,
                  image: gameDetails.icon ?
                    `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${sg.appId}/${gameDetails.icon}.jpg` :
                    null
                }
              })
              
              // Update the game object in memory
              return {
                ...sg,
                game: {
                  ...sg.game,
                  name: gameDetails.name,
                  imageUrl: gameDetails.icon ? 
                    `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${sg.appId}/${gameDetails.icon}.jpg` : 
                    null
                }
              }
            }
          }
        } catch (e) {
          console.error('Failed to fetch game details:', e)
        }
      }
      return sg
    }))

    return {
      ...session,
      games: gamesWithNames
    }
  }))

  return NextResponse.json({ sessions: sessionsWithGameDetails })
}

const actionSchema = z.object({ 
  action: z.enum(['start', 'stop']),
  totpCode: z.string().optional(),
  steamAccountId: z.string()
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Respect maintenance mode: prevent new session actions for non-admins
  try {
    const redis = getRedis()
    const raw = await redis.get('system:settings')
    const settings = raw ? JSON.parse(raw) : null
    if (settings?.maintenanceMode && (user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Maintenance mode: sessions are temporarily disabled' }, { status: 503 })
    }
  } catch {}
  const body = await req.json().catch(() => null)
  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  const steam = await prisma.steamAccount.findUnique({ where: { id: parsed.data.steamAccountId } })
  if (!steam || steam.userId !== user.id) {
    return NextResponse.json({ error: 'Steam account not found' }, { status: 404 })
  }

  // Add job to queue - worker will handle TOTP if needed
  await sessionQueue.add('session', { 
    userId: user.id, 
    steamAccountId: steam.id, 
    action: parsed.data.action,
    totpCode: parsed.data.totpCode 
  }, defaultJobOpts)
  
  if (parsed.data.action === 'start') {
    const existing = await prisma.boostSession.findFirst({ where: { userId: user.id, steamAccountId: steam.id } })
    if (existing) {
      await prisma.boostSession.update({ 
        where: { id: existing.id },
        data: { status: 'connecting', startedAt: new Date() }
      })
    } else {
      await prisma.boostSession.create({ 
        data: { 
          userId: user.id, 
          steamAccountId: steam.id, 
          status: 'connecting', 
          startedAt: new Date(), 
          personaState: 'Online' as any 
        } 
      })
    }
  } else {
    await prisma.boostSession.updateMany({ 
      where: { userId: user.id, steamAccountId: steam.id }, 
      data: { status: 'stopped', pausedAt: new Date() } 
    })
  }
  return NextResponse.json({ ok: true })
}
