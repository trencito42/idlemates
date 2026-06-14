import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import argon2 from 'argon2'
export const dynamic = 'force-dynamic'

const schema = z.object({ token: z.string().min(10), password: z.string().min(8) })

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    const { token, password } = parsed.data
    const record = await prisma.passwordResetToken.findUnique({ where: { token } })
    if (!record || record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }
    const passwordHash = await argon2.hash(password)
    await prisma.user.update({ where: { id: record.userId }, data: { passwordHash } })
    await prisma.passwordResetToken.delete({ where: { token } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
