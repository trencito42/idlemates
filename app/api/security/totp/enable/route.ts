import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getRedis } from '@/lib/redis'
import { verifyTotp, generateBase32Secret } from '@/lib/totp'
import { envelopeDecryptDataKey, encryptWithDataKey } from '@/lib/crypto'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { code } = await req.json().catch(() => ({}))
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const redis = getRedis()
  let secret = await redis.get(`totp:setup:${user.id}`)
  if (!secret) {
    // Allow enabling with a code generated from an existing stored secret (rare re-enable case)
    return NextResponse.json({ error: 'Setup expired. Start again.' }, { status: 400 })
  }

  const isValid = verifyTotp(secret, String(code))
  if (!isValid) {
    console.warn('[2FA] Invalid TOTP during enable', { userId: user.id })
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  if (!user.dataKeyEnc) return NextResponse.json({ error: 'Missing data key' }, { status: 500 })
  const dataKey = envelopeDecryptDataKey(user.dataKeyEnc)

  // Generate backup codes (10 codes, 10 chars each)
  const backupCodes: string[] = Array.from({ length: 10 }, () => generateBase32Secret(8).replace(/=+$/, '').slice(0, 10))
  const secretEnc = encryptWithDataKey(dataKey, secret)
  const backupEnc = encryptWithDataKey(dataKey, JSON.stringify(backupCodes))

  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: true,
      totpSecretEnc: secretEnc,
      totpBackupCodesEnc: backupEnc,
      last2FAAt: new Date()
    } as any
  })
  await redis.del(`totp:setup:${user.id}`)

  return NextResponse.json({ ok: true, backupCodes })
}
