import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function DELETE(req: Request, { params }: { params: { appId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const appId = parseInt(params.appId)
    if (isNaN(appId)) {
      return NextResponse.json({ error: 'Invalid appId' }, { status: 400 })
    }

    // Get steamAccountId from query params
    const { searchParams } = new URL(req.url)
    const steamAccountId = searchParams.get('steamAccountId')

    if (!steamAccountId) {
      return NextResponse.json({ error: 'steamAccountId required' }, { status: 400 })
    }

    // Verify steam account belongs to user
    const steam = await prisma.steamAccount.findUnique({ where: { id: steamAccountId } })
    if (!steam || steam.userId !== user.id) {
      return NextResponse.json({ error: 'Steam account not found' }, { status: 404 })
    }

    // Check if game exists first
    const game = await prisma.game.findUnique({
      where: { appId }
    })

    if (!game) {
      return NextResponse.json({ error: `Game with ID ${appId} not found in database` }, { status: 404 })
    }

    // Find active session for this account and remove game
    const activeSession = await prisma.boostSession.findFirst({
      where: {
        userId: user.id,
        steamAccountId,
        status: { in: ['running', 'paused', 'stopped'] }
      },
      include: {
        games: {
          include: {
            game: true
          }
        }
      }
    })

    if (!activeSession) {
      return NextResponse.json({ 
        error: 'No session found. Please add a game first to create a session.' 
      }, { status: 404 })
    }

    // Check if game is in the session
    const sessionGame = activeSession.games.find(g => g.appId === appId)
    if (!sessionGame) {
      return NextResponse.json({ 
        error: `Game ${game.name || appId} is not in your current session`,
        debug: {
          searchingFor: appId,
          currentGames: activeSession.games.map(g => ({ id: g.id, appId: g.appId, name: g.game?.name }))
        }
      }, { status: 404 })
    }

    try {
      // Remove game from session
      await prisma.boostSessionGame.delete({
        where: { id: sessionGame.id }
      })

      // If this was the last game, we can keep the session but mark it as stopped
      const remainingGames = await prisma.boostSessionGame.count({
        where: { sessionId: activeSession.id }
      })

      if (remainingGames === 0) {
        await prisma.boostSession.update({
          where: { id: activeSession.id },
          data: { status: 'stopped' }
        })
      }

      return NextResponse.json({ 
        success: true,
        message: `Game ${game.name || appId} removed successfully`
      })
    } catch (deleteError: any) {
      console.error('Error removing game:', deleteError)
      return NextResponse.json({
        error: 'Failed to remove game from session',
        details: deleteError.message
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error in DELETE /api/games/[appId]:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET(req: Request, { params }: { params: { appId: string } }) {
  try {
    const appId = parseInt(params.appId)
    if (isNaN(appId)) {
      return NextResponse.json({ error: 'Invalid appId' }, { status: 400 })
    }

    // Get game details from database
    const game = await prisma.game.findUnique({
      where: { appId }
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    return NextResponse.json({ game })
  } catch (error: any) {
    console.error('Error fetching game:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch game', 
      details: error.message 
    }, { status: 500 })
  }
}
