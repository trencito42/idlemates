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
  const userId = searchParams.get('userId')
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'))
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const events = await prisma.eventLog.findMany({
    where: {
      OR: [
        { userId },
        { steamAccount: { userId } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, type: true, createdAt: true, json: true }
  })

  return NextResponse.json({ events })
}
