import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureRecent2FA } from '@/lib/2faGuard'
export const dynamic = 'force-dynamic'

export async function PATCH(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as any
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ok2fa = await ensureRecent2FA(session.user.id)
    if (!ok2fa) return NextResponse.json({ error: '2FA required', require2FA: true }, { status: 403 })

    const { email } = await req.json().catch(() => ({}))
    const newEmail = String(email || '').trim().toLowerCase()
    if (!newEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const exists = await prisma.user.findUnique({ where: { email: newEmail } })
    if (exists && exists.id !== session.user.id) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    await prisma.user.update({ where: { id: session.user.id }, data: { email: newEmail } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Change email error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
