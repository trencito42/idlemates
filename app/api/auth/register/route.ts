import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import argon2 from 'argon2'
import { envelopeEncryptDataKey, generateDataKey } from '@/lib/crypto'
import { getRedis } from '@/lib/redis'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({ email: z.string().email(), password: z.string().min(8) })

export async function POST(req: Request) {
  try {
    // Check system settings for registration toggle
    const redis = getRedis()
    const raw = await redis.get('system:settings')
    const settings = raw ? JSON.parse(raw) : null
    if (settings && settings.allowNewRegistrations === false) {
      return NextResponse.json({ error: 'Registrations are disabled' }, { status: 403 })
    }

    const contentType = req.headers.get('content-type') || ''
    let data: unknown
    if (contentType.includes('application/json')) {
      data = await req.json().catch(() => ({}))
    } else {
      const form = await req.formData()
      data = { email: form.get('email'), password: form.get('password') }
    }

    const parsed = bodySchema.safeParse(data)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    const email = parsed.data.email.toLowerCase()
    const password = parsed.data.password

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Exists' }, { status: 409 })

    const passwordHash = await argon2.hash(password)
    const dk = generateDataKey()
    const dataKeyEnc = envelopeEncryptDataKey(dk)
    await prisma.user.create({ data: { email, passwordHash, dataKeyEnc } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
