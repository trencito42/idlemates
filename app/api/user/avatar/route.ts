import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { avatarUrl } = await req.json().catch(() => ({}))
  if (!avatarUrl || typeof avatarUrl !== 'string') return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  try {
    await (prisma as any).user.update({ where: { id: session.user.id }, data: { avatarUrl } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
