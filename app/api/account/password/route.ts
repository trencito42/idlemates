import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import argon2 from 'argon2'
import { ensureRecent2FA } from '@/lib/2faGuard'
export const dynamic = 'force-dynamic'

export async function PATCH(req: Request) {
  try {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Must have recent 2FA
  const ok2fa = await ensureRecent2FA(session.user.id)
    if (!ok2fa) return NextResponse.json({ error: '2FA required', require2FA: true }, { status: 403 })

    const { currentPassword, newPassword } = await req.json().catch(() => ({}))
    if (!newPassword || String(newPassword).length < 8) {
      return NextResponse.json({ error: 'Password too short' }, { status: 400 })
    }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Verify current password when provided
    if (currentPassword) {
      const valid = await argon2.verify(user.passwordHash, String(currentPassword))
      if (!valid) return NextResponse.json({ error: 'Invalid current password' }, { status: 400 })
    }

    const passwordHash = await argon2.hash(String(newPassword))
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Change password error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
