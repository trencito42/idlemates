import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { envelopeDecryptDataKey, encryptWithDataKey, decryptWithDataKey } from '@/lib/crypto'
import { generateBase32Secret } from '@/lib/totp'
export const dynamic = 'force-dynamic'

export async function POST() {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = (await prisma.user.findUnique({ where: { id: session.user.id } })) as any
  if (!user || !user.totpSecretEnc || !user.dataKeyEnc) return NextResponse.json({ error: '2FA not enabled' }, { status: 400 })

  const dataKey = envelopeDecryptDataKey(user.dataKeyEnc)
  // Optional: ensure secret decrypts
  try { void decryptWithDataKey(dataKey, user.totpSecretEnc) } catch {
    return NextResponse.json({ error: 'Corrupt secret' }, { status: 500 })
  }

  const backupCodes: string[] = Array.from({ length: 10 }, () => generateBase32Secret(8).replace(/=+$/, '').slice(0, 10))
  const backupEnc = encryptWithDataKey(dataKey, JSON.stringify(backupCodes))

  await prisma.user.update({ where: { id: user.id }, data: { totpBackupCodesEnc: backupEnc } as any })
  return NextResponse.json({ ok: true, backupCodes })
}
