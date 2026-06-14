import { PrismaAdapter } from '@next-auth/prisma-adapter'
import type { NextAuthOptions } from 'next-auth'
import type { Adapter, AdapterUser } from 'next-auth/adapters'
import Credentials from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import nodemailer from 'nodemailer'
import { prisma } from './db'
import argon2 from 'argon2'
import { z } from 'zod'
import crypto from 'crypto'
import { envelopeEncryptDataKey, generateDataKey, envelopeDecryptDataKey, decryptWithDataKey } from './crypto'
import { getRedis } from './redis'
import { verifyTotp } from './totp'

// We support two shapes:
// 1) email+password(+optional totp) for the initial step
// 2) challenge+totp for the second step (two-step flow)
const step1Schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  totp: z.string().optional()
})
const step2Schema = z.object({
  challenge: z.string().min(8),
  totp: z.string().min(3)
})

import type { Provider } from 'next-auth/providers/index'

const enableEmailProvider = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
)

type DbUser = {
  id: string
  email: string
  role: string
  banned?: boolean
  passwordHash: string
  totpSecretEnc?: string | null
  dataKeyEnc?: string | null
}

const providers: Provider[] = [
  Credentials({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Parolă', type: 'password' }
    },
    async authorize(raw) {
      // Step 2: complete using a challenge token + TOTP
      const asStep2 = step2Schema.safeParse(raw)
      if (asStep2.success) {
        const { challenge, totp } = asStep2.data
        try {
          const redis = getRedis()
          const key = `2fa:challenge:${challenge}`
          const json = await redis.get(key)
          if (!json) return null
          const payload = JSON.parse(json) as { userId: string, email: string, createdAt: number }
          // Basic freshness check (also protected by Redis TTL)
          if (!payload?.userId) return null
          const user = await prisma.user.findUnique({ where: { id: payload.userId } })
          if (!user) return null
          
          const u = user as unknown as DbUser
          if (u.banned) return null
          if (!(u.totpSecretEnc && u.dataKeyEnc)) return null
          try {
            const dk = envelopeDecryptDataKey(u.dataKeyEnc)
            const secret = decryptWithDataKey(dk, u.totpSecretEnc)
            const valid = verifyTotp(secret, String(totp))
            if (!valid) return null
          } catch {
            return null
          }
          // One-time challenge: remove it
          await redis.del(key)
          return { id: u.id, email: u.email, role: u.role }
        } catch {
          return null
        }
      }

      // Step 1: email+password(+optional totp)
      const parsed = step1Schema.safeParse(raw)
      if (!parsed.success) return null
      const { email, password, totp: totpCode } = parsed.data
      // Normalize email to lowercase for case-insensitive lookup
      const normalizedEmail = email.toLowerCase()
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
      if (!user) return null
      
      const u = user as unknown as DbUser
      if (u.banned) return null
      const ok = await argon2.verify(u.passwordHash, password)
      if (!ok) return null
      // If user has TOTP enabled, require a valid code
      if (u.totpSecretEnc && u.dataKeyEnc) {
        if (!totpCode) {
          // Two-step flow: issue a short-lived challenge and signal the client
          try {
            const redis = getRedis()
            const challenge = crypto.randomBytes(16).toString('hex')
            const payload = { userId: u.id, email: u.email, createdAt: Date.now() }
            // Store challenge by token
            await redis.set(`2fa:challenge:${challenge}`, JSON.stringify(payload), 'EX', 300)
            // Also index by email so client can recover the token if NextAuth swallows the custom error
            await redis.set(`2fa:challengeByEmail:${normalizedEmail}`, challenge, 'EX', 180)
            // Signal to the client without creating a session yet
            // NextAuth will surface this as an error string to the client when redirect:false
            throw new Error(`TOTP_REQUIRED:${challenge}`)
          } catch (e) {
            // If anything goes wrong, fail gracefully
            return null
          }
        }
        try {
          const dk = envelopeDecryptDataKey(u.dataKeyEnc)
          const secret = decryptWithDataKey(dk, u.totpSecretEnc)
          const valid = verifyTotp(secret, String(totpCode))
          if (!valid) return null
        } catch {
          return null
        }
      }
      return { id: user.id, email: user.email, role: user.role }
    }
  })
]

if (enableEmailProvider) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || ''
  const logoUrl = appUrl ? `${appUrl}/logo.svg` : undefined
  // Purple-leaning brand palette
  const brandColor = '#8B5CF6'
  const bgOuter = '#0c0b14' // purple-tinted dark
  const bgCard = '#0c0b14'
  const borderColor = '#302f39'
  providers.unshift(
    EmailProvider({
      secret: process.env.NEXTAUTH_SECRET,
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        secure: false,
      },
      from: process.env.MAIL_FROM || 'IdleMates <no-reply@idlemat.es>',
  maxAge: 60 * 60 * 6, // 6 hours to tolerate potential clock skew
      // Ensure consistent identifier casing and spacing
      normalizeIdentifier(identifier) {
        return identifier.trim().toLowerCase()
      },
      async sendVerificationRequest({ identifier, url, provider }) {
        const transport = nodemailer.createTransport(provider.server)
        const normalizedIdentifier = (identifier || '').toLowerCase()
        const host = new URL(url).host
        const verifyUrl = (() => {
          try {
            const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '').replace(/\/$/, '') || ''
            const u = new URL('/auth/verify', base || url)
            const parsed = new URL(url)
            const token = parsed.searchParams.get('token') || ''
            const emailParam = parsed.searchParams.get('email') || normalizedIdentifier
            const cb = parsed.searchParams.get('callbackUrl') || '/app/dashboard'
            u.searchParams.set('token', token)
            u.searchParams.set('email', emailParam)
            u.searchParams.set('callbackUrl', cb)
            return u.toString()
          } catch {
            return url
          }
        })()
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
              ${logoUrl ? `<img src="${logoUrl}" alt="IdleMates" width="56" height="56" style="display:block;">` : `<div style="font-weight:700;font-size:20px;color:#fff">IdleMates</div>`}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:8px;color:#fff">
              <div style="font-size:20px;font-weight:700;">Sign in to IdleMates</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:20px;color:#a1a1aa">
              <div style="font-size:14px;">Click the button below to securely sign in. This link expires in 6 hours.</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 0 24px">
              <a href="${verifyUrl}" style="background:${brandColor};color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;display:inline-block">Sign in</a>
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#9ca3af;line-height:1.5">
              If you didn’t request this, you can safely ignore this email. The link will expire automatically.
            </td>
          </tr>
          <tr>
            <td style="padding-top:16px;color:#9ca3af;font-size:12px;word-break:break-all;">
              Or copy and paste this link: <br/>
              <a href="${verifyUrl}" style="color:${brandColor}">${verifyUrl}</a>
            </td>
          </tr>
        </table>
        <div style="font-size:11px;color:#6b7280;padding-top:16px">Sent to ${normalizedIdentifier} • ${host}</div>
      </td>
    </tr>
  </table>
</body>
</html>`
  // Important: Use the human confirmation link in plaintext as well to avoid
  // email security scanners consuming the one-time verification token.
  const text = `Sign in to IdleMates\n\nUse the link below to sign in (valid for 6 hours):\n${verifyUrl}\n\nIf you didn't request this, you can safely ignore this email.`
        await transport.sendMail({
          to: normalizedIdentifier,
          from: provider.from,
          subject: 'Your IdleMates sign-in link',
          text,
          html,
        })
      },
    })
  )

}

// Wrap PrismaAdapter to ensure required fields exist for email-based user creation
function createAdapter(): Adapter {
  const base = PrismaAdapter(prisma) as Adapter
  return {
    ...base,
    // NextAuth may attempt to set `emailVerified` on the User during Email callback.
    // Our schema does not define this column, so we strip it to avoid Prisma errors.
    async updateUser(user: Partial<AdapterUser> & { id: string }) {
      try {
        const { id, ...rest } = user
        const { emailVerified: _omit, ...cleanRest } = rest as Record<string, unknown>
        if (id) {
          return await prisma.user.update({ where: { id }, data: cleanRest }) as unknown as AdapterUser
        }
        if (rest.email) {
          const email = String(rest.email).toLowerCase()
          return await prisma.user.update({ where: { email }, data: cleanRest }) as unknown as AdapterUser
        }
        // Fallback to base if we somehow cannot resolve identifiers
        if (base.updateUser) {
          return await base.updateUser(user)
        }
        throw new Error('No user id provided')
      } catch (e) {
        try { console.error('[auth] updateUser override error', e) } catch {}
        // As a last resort, return the current user record to not block auth flow
        if (user?.id) {
          return await prisma.user.findUnique({ where: { id: user.id } }) as unknown as AdapterUser
        }
        throw e
      }
    },
    // Ensure verification tokens always use lowercased identifiers
    async createVerificationToken(token: { identifier: string; token: string; expires: Date }) {
      const normalized = token.identifier.trim().toLowerCase()
      const created = await prisma.verificationToken.create({
        data: { identifier: normalized, token: token.token, expires: token.expires }
      })
      // Debug: log creation window
      try { console.log('[auth] createVerificationToken', { identifier: normalized, expires: token.expires.toISOString() }) } catch {}
      return created
    },
    async useVerificationToken(params: { identifier: string; token: string }) {
      const normalized = params.identifier.trim().toLowerCase()
      // Delete by unique token to avoid composite key mismatches
      try {
        const vt = await prisma.verificationToken.delete({ where: { token: params.token } })
        // Optional: ensure the identifier matches what we expect
        if (vt.identifier !== normalized) {
          // If it doesn't match, we still return the token (NextAuth does not reinsert it)
          try { console.warn('[auth] verification identifier mismatch', { expected: normalized, got: vt.identifier }) } catch {}
        }
        try { console.log('[auth] useVerificationToken', { identifier: vt.identifier, expires: vt.expires.toISOString() }) } catch {}
        return vt
      } catch (e) {
        try { console.warn('[auth] useVerificationToken not found', { identifier: normalized }) } catch {}
        return null
      }
    },
    async createUser(user: Omit<AdapterUser, 'id'>) {
      const email = (user.email || '').toLowerCase()
      // If already exists, return it
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) return existing as unknown as AdapterUser
      const dk = generateDataKey()
      const dataKeyEnc = envelopeEncryptDataKey(dk)
      const randomPwd = crypto.randomBytes(16).toString('hex')
      const passwordHash = await argon2.hash(randomPwd)
      return (await prisma.user.create({ data: { email, passwordHash, dataKeyEnc } })) as unknown as AdapterUser
    },
  }
}

export const authOptions: NextAuthOptions = {
  adapter: createAdapter(),
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30,
  },
  providers,
  callbacks: {
    async signIn({ user, account, email }) {
      try {
        if (account?.provider === 'email') {
          const normalized = (user?.email || (email as { email?: string })?.email || '').toLowerCase()
          // If we cannot resolve an email here, don’t block the flow; NextAuth will handle validation
          if (normalized) {
            const existing = await prisma.user.findUnique({ where: { email: normalized } })
            if (existing && (existing as unknown as DbUser).banned) return false
          }
        }
        return true
      } catch {
        return false
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      } else if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          })
          if (dbUser) token.role = dbUser.role
        } catch {}
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        try {
          const u = await (prisma as any).user.findUnique({ where: { id: token.id as string }, select: { avatarUrl: true } })
          if (u) session.user.avatarUrl = (u as any).avatarUrl || null
        } catch {}
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      try {
        const base = new URL(baseUrl)
        const parsed = new URL(url, baseUrl)

        // Helper to unwrap nested callbackUrl params up to a safe depth
        const unwrapCallback = (u: URL, depth = 0): URL | null => {
          if (depth > 3) return null
          const cb = u.searchParams.get('callbackUrl')
          if (!cb) return u
          try {
            const next = new URL(cb, base.origin)
            return unwrapCallback(next, depth + 1)
          } catch {
            return null
          }
        }

        const finalTarget = unwrapCallback(parsed)
        if (finalTarget && finalTarget.origin === base.origin) {
          return finalTarget.toString()
        }

        // Allow relative paths
        if (url.startsWith('/')) return base.origin + url
      } catch {}
      // Fallback: always land users safely on dashboard
      return baseUrl + '/app/dashboard'
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login'
  },
  secret: process.env.NEXTAUTH_SECRET
}

// In App Router, create the handler in the route file to avoid import cycles
