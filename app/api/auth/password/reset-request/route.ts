import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import crypto from 'crypto'
import { sendMail } from '@/lib/mailer'
export const dynamic = 'force-dynamic'

const schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ ok: true }) // do not leak
    const email = parsed.data.email.toLowerCase()
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ ok: true }) // same behavior

    // Create token valid for 1 hour
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60)
    await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://idlemat.es'
    const link = `${baseUrl}/auth/reset/${token}`
    const subject = 'Reset your IdleMates password'
    const logoUrl = `${baseUrl}/logo.svg`
    const brandColor = '#8B5CF6'
    const bgOuter = '#0d0b1f'
    const bgCard = '#111128'
    const borderColor = 'rgba(139,92,246,0.2)'
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;" bgcolor="${bgOuter}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${bgOuter}" style="background-color:${bgOuter};padding:32px 0;color:#e5e7eb;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,\"Helvetica Neue\",Noto Sans,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" bgcolor="${bgCard}" style="background:${bgCard};border:1px solid ${borderColor};border-radius:16px;padding:32px">
          <tr>
            <td align="center" style="padding-bottom:12px;color:#fff">
              <img src="${logoUrl}" alt="IdleMates" width="56" height="56" style="display:block;">
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:8px;color:#fff">
              <div style="font-size:20px;font-weight:700;">Reset your password</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:20px;color:#a1a1aa">
              <div style="font-size:14px;">Click the button below to set a new password. This link expires in 1 hour.</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 0 24px">
              <a href="${link}" style="background:${brandColor};color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;display:inline-block">Reset password</a>
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#9ca3af;line-height:1.5">
              If you didn’t request this, you can safely ignore this email.
            </td>
          </tr>
          <tr>
            <td style="padding-top:16px;color:#9ca3af;font-size:12px;word-break:break-all;">
              Or copy and paste this link: <br/>
              <a href="${link}" style="color:${brandColor}">${link}</a>
            </td>
          </tr>
        </table>
        <div style="font-size:11px;color:#6b7280;padding-top:16px">IdleMates • ${new URL(baseUrl).host}</div>
      </td>
    </tr>
  </table>
</body>
</html>`
    const text = `Hello,\n\nWe received a request to reset your IdleMates password. Use the link below (valid for 1 hour):\n${link}\n\nIf you didn't request this, you can safely ignore this email.`
    await sendMail({ to: email, subject, html, text, from: process.env.MAIL_FROM })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: true })
  }
}
