import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { envelopeDecryptDataKey, decryptWithDataKey } from '@/lib/crypto'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = (await prisma.user.findUnique({ where: { id: session.user.id } })) as any
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  let backupCount = 0
  try {
    if (user.totpBackupCodesEnc && user.dataKeyEnc) {
      const dataKey = envelopeDecryptDataKey(user.dataKeyEnc)
      const arr: string[] = JSON.parse(decryptWithDataKey(dataKey, user.totpBackupCodesEnc))
      backupCount = Array.isArray(arr) ? arr.length : 0
    }
  } catch {
    backupCount = 0
  }
  const enabled = !!user.totpSecretEnc
  return NextResponse.json({ enabled, backupCount, last2FAAt: user.last2FAAt || null })
}
