import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ensureRecent2FA } from '@/lib/2faGuard'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { steamAccounts: true, sessions: { include: { games: true } }, subscriptions: true, payments: true, eventLogs: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  // Require recent 2FA verification for data export
  const ok2fa = await ensureRecent2FA(user.id)
  if (!ok2fa) return NextResponse.json({ error: 'Two-factor authentication required', require2FA: true }, { status: 403 })
  return NextResponse.json({ user })
}
