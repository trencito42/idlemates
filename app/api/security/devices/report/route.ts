import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRedis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token') || ''
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  const redis = getRedis()
  const raw = await redis.get(`security:report:${token}`)
  if (!raw) return NextResponse.json({ error: 'Invalid or expired' }, { status: 400 })
  const { userId, deviceId } = JSON.parse(raw)
  const p: any = prisma as any
  await p.deviceSession.updateMany({ where: { userId, deviceId }, data: { trusted: false } as any })
  // Kill all active NextAuth sessions for this user to force sign-out across devices
  try {
    await p.session.deleteMany({ where: { userId } })
  } catch {}
  try {
    await p.eventLog.create({ data: { userId, type: 'security.device_report', json: { deviceId } } })
  } catch {}
  // Optional: in a real system, you might also invalidate user sessions or require 2FA next login
  await redis.del(`security:report:${token}`)
  // Render a simple branded confirmation page (no layout to avoid import cycles)
  const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Device reported</title>
    <link rel="icon" href="/favicon.ico" />
    <style>
      body { background:#0c0b14; color:#e5e7eb; font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Helvetica Neue, Noto Sans, sans-serif; margin:0; padding:0; }
      .card { max-width:560px; margin:6rem auto; background:#0c0b14; border:1px solid #302f39; border-radius:16px; padding:24px; }
      .btn { display:inline-block; background:#8B5CF6; color:#fff; padding:10px 14px; border-radius:10px; text-decoration:none; font-weight:600; }
      .muted { color:#9ca3af; }
    </style>
  </head>
  <body>
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <img src="/logo.svg" alt="IdleMates" width="32" height="32" />
        <h1 style="margin:0;font-size:20px;color:#fff;">Device reported</h1>
      </div>
      <p>Thanks. We marked that device as <strong>untrusted</strong>.</p>
      <p class="muted">If this wasn’t you, we recommend changing your password and enabling two‑factor authentication.</p>
      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
        <a class="btn" href="/auth/login">Sign in</a>
        <a class="btn" href="/security">Security tips</a>
      </div>
    </div>
  </body>
  </html>`
  // Also clear next-auth token cookie to encourage re-auth on this browser
  const res = new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  try {
    // Best-effort; cookie name depends on strategy, but we nudge sign-out UX
    res.cookies.set('next-auth.session-token', '', { path: '/', maxAge: 0 })
    res.cookies.set('__Secure-next-auth.session-token', '', { path: '/', maxAge: 0, secure: true })
  } catch {}
  return res
}
