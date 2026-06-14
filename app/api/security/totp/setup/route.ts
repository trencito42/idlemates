import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getRedis } from '@/lib/redis'
import { generateBase32Secret, buildOtpAuthUrl } from '@/lib/totp'
export const dynamic = 'force-dynamic'

export async function POST() {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const secret = generateBase32Secret()
  const issuer = 'IdleMates'
  const label = user.email
  const otpauth = buildOtpAuthUrl(issuer, label, secret)

  const redis = getRedis()
  await redis.set(`totp:setup:${user.id}`, secret, 'EX', 600)

  return NextResponse.json({ otpauth, secret })
}
