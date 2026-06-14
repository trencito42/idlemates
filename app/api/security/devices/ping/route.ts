import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getRedis } from '@/lib/redis'
import { sendSuspiciousLoginEmail } from '@/lib/mailer'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { deviceId } = await req.json().catch(() => ({}))
  const ua = req.headers.get('user-agent') || ''
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || ''
  if (!deviceId) return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 })

  const p: any = prisma as any
  const existing = await p.deviceSession.findFirst({ where: { userId: session.user.id, deviceId } })
  let created = false
  if (existing) {
    await p.deviceSession.update({ where: { id: existing.id }, data: { userAgent: ua.slice(0,255), ip: ip || null } })
  } else {
    await p.deviceSession.create({ data: { userId: session.user.id, deviceId, userAgent: ua.slice(0,255), ip: ip || null } })
    created = true
  }

  // Suspicious login detection: new device and not trusted
  if (created) {
    try {
      const redis = getRedis()
      const user = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (user?.email) {
        const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
        const payload = { userId: session.user.id, deviceId, ip, ua, ts: Date.now() }
        await redis.set(`security:report:${token}`, JSON.stringify(payload), 'EX', 60 * 60 * 24)
        const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '').replace(/\/$/, '')
        const reportUrl = `${base}/api/security/devices/report?token=${encodeURIComponent(token)}`
        await sendSuspiciousLoginEmail({ to: user.email, ip, userAgent: ua, reportUrl })
      }
    } catch (e) {
      try { console.warn('[security] failed to send suspicious login email', e) } catch {}
    }
  }

  return NextResponse.json({ ok: true, created })
}
