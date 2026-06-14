import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { envelopeDecryptDataKey, decryptWithDataKey } from '@/lib/crypto'
import { verifyTotp } from '@/lib/totp'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { code } = await req.json().catch(() => ({}))
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const user = (await prisma.user.findUnique({ where: { id: session.user.id } })) as any
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (!user.totpSecretEnc || !user.dataKeyEnc) return NextResponse.json({ error: '2FA not enabled' }, { status: 400 })

  const dataKey = envelopeDecryptDataKey(user.dataKeyEnc)
  const secret = decryptWithDataKey(dataKey, user.totpSecretEnc)
  let ok = verifyTotp(secret, String(code))

  if (!ok && user.totpBackupCodesEnc) {
    try {
      const arr: string[] = JSON.parse(decryptWithDataKey(dataKey, user.totpBackupCodesEnc))
      const idx = arr.findIndex((c) => c === String(code))
      if (idx >= 0) {
        ok = true
        arr.splice(idx, 1)
        const { encryptWithDataKey } = await import('@/lib/crypto')
        const updatedEnc = encryptWithDataKey(dataKey, JSON.stringify(arr))
        await prisma.user.update({ where: { id: user.id }, data: { totpBackupCodesEnc: updatedEnc } as any })
      }
    } catch {}
  }

  if (!ok) return NextResponse.json({ error: 'Invalid code' }, { status: 400 })

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, totpSecretEnc: null, totpBackupCodesEnc: null } as any
  })
  return NextResponse.json({ ok: true })
}
