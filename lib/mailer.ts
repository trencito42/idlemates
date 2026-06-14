import nodemailer from 'nodemailer'

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendMail(opts: { to: string, subject: string, html: string, text?: string, from?: string }) {
  const from = opts.from || process.env.MAIL_FROM || 'IdleMates <no-reply@idlemat.es>'
  return transport.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  })
}

export async function sendSuspiciousLoginEmail(params: { to: string, ip?: string | null, userAgent?: string | null, reportUrl: string }) {
  const { to, ip, userAgent, reportUrl } = params
  const subject = 'IdleMates: New device sign-in'
  const html = `
    <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Helvetica Neue,Noto Sans,sans-serif;color:#e5e7eb;background:#0c0b14;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#0c0b14;border:1px solid #302f39;border-radius:16px;padding:24px">
        <h2 style="margin-top:0;color:#fff">New device sign-in</h2>
        <p style="color:#a1a1aa">We detected a sign-in from a new device on your account.</p>
        <ul style="color:#a1a1aa;font-size:14px">
          <li><strong>IP</strong>: ${ip || 'Unknown'}</li>
          <li><strong>Device</strong>: ${userAgent || 'Unknown'}</li>
          <li><strong>Time</strong>: ${new Date().toUTCString()}</li>
        </ul>
        <p>If this was not you, please secure your account:</p>
        <p>
          <a href="${reportUrl}" style="background:#8B5CF6;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;display:inline-block;font-weight:600">This wasn't me</a>
        </p>
        <p style="color:#6b7280;font-size:12px">If you initiated this sign-in, you can ignore this email.</p>
      </div>
    </div>
  `
  const text = `New device sign-in\nIP: ${ip || 'Unknown'}\nDevice: ${userAgent || 'Unknown'}\nTime: ${new Date().toUTCString()}\nIf this wasn't you: ${reportUrl}`
  await sendMail({ to, subject, html, text })
}
