import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined
  const email = searchParams.get('email') || undefined
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '20'))
  const sortBy = searchParams.get('sortBy') || 'startedAt'
  const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc'
  const skip = (page - 1) * pageSize

  const where: any = {}
  if (status) where.status = status
  if (email) where.user = { email: { contains: email } }

  const [total, sessions] = await Promise.all([
    prisma.boostSession.count({ where }),
    prisma.boostSession.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    include: {
      user: { select: { email: true } },
      steamAccount: { select: { usernameEnc: true } },
      games: { 
        include: { 
          game: { select: { appId: true, name: true } } 
        } 
      }
      }
    })
  ])

  // Flatten games to { appId, name }
  const transformed = sessions.map(s => ({
    ...s,
    games: s.games.map(g => ({ appId: g.game?.appId ?? g.appId, name: g.game?.name ?? String(g.appId) }))
  }))

  return NextResponse.json({ sessions: transformed, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { sessionId, action } = await req.json()
  
  if (action === 'stop') {
    await prisma.boostSession.update({
      where: { id: sessionId },
      data: { status: 'stopped', pausedAt: new Date() }
    })
  }

  return NextResponse.json({ success: true })
}
