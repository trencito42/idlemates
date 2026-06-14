import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { userId, reason } = await req.json()
  if (!userId || !reason) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const event = await prisma.eventLog.create({
    data: {
      userId,
      type: 'admin.ban_note',
      json: JSON.stringify({ reason }),
    }
  })

  return NextResponse.json({ ok: true, event })
}
