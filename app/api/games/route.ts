import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { resolvePlanForUser } from '@/lib/plans'
import { fetchSteamGameDetails } from '@/lib/steam'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const games = await prisma.game.findMany({ orderBy: { name: 'asc' }, take: 200 })
  return NextResponse.json({ games })
}

const addSchema = z.object({ 
  appId: z.coerce.number().int().positive(),
  steamAccountId: z.string()
})

export async function POST(req: Request) {
  try {
    // Parse JSON body and validate
    const body = await req.json().catch(() => null)
    const parsed = addSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const { appId, steamAccountId } = parsed.data

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user with Steam account and active boost session
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get Steam account for the provided steamAccountId and ensure it belongs to the user
    const steamAccount = await prisma.steamAccount.findUnique({
      where: { id: steamAccountId }
    })

    if (!steamAccount || steamAccount.userId !== user.id) {
      return NextResponse.json({ error: 'Steam account not found' }, { status: 404 })
    }

    // Get or create boost session for this steam account
    let activeSession = await prisma.boostSession.findFirst({
      where: { 
        userId: user.id,
        steamAccountId: steamAccount.id
      },
      include: {
        games: true
      }
    })

    // Get game details from Steam API
    const game = await fetchSteamGameDetails(appId)
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Ensure game exists in database with image
    await prisma.game.upsert({
      where: { appId },
      create: {
        appId,
        name: game.name,
        image: (game.header_image || game.icon || null) as any
      },
      update: {
        name: game.name,
        image: (game.header_image || game.icon || null) as any
      }
    })

    // Create or update session game
    if (!activeSession) {
      // Create new boost session
      activeSession = await prisma.boostSession.create({ 
        data: { 
          userId: user.id, 
          steamAccountId: steamAccount.id,
          status: 'stopped',
          personaState: 'Offline'
        },
        include: {
          games: true
        }
      })
    }

    // Check if game already added to session
    const existing = activeSession.games?.some(g => g.appId === appId)
    if (existing) {
      return NextResponse.json({ error: 'Game already added to your session' }, { status: 400 })
    }

    // Check plan limits before adding game
    const plan = await resolvePlanForUser(user.id)
    const currentGameCount = activeSession.games?.length || 0
    
    if (currentGameCount >= plan.maxConcurrentGames) {
      return NextResponse.json({ 
        error: `Plan limit reached. Your ${plan.code} plan allows ${plan.maxConcurrentGames} concurrent ${plan.maxConcurrentGames === 1 ? 'game' : 'games'}.` 
      }, { status: 400 })
    }

    // Add game to session
    await prisma.boostSessionGame.create({ 
      data: { 
        sessionId: activeSession.id,
        appId
      } 
    })

    // Return enriched game data with session info
    return NextResponse.json({
      game,
      session: activeSession || undefined
    })
  } catch (error) {
    console.error('Error adding game:', error)
    return NextResponse.json({ error: 'Failed to add game' }, { status: 500 })
  }
}
