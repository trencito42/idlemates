import { NextResponse } from 'next/server'
import { generateDataKey, encryptWithDataKey, envelopeEncryptDataKey } from '@/lib/crypto'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { username, password, totp, shared_secret } = await req.json()
    // Build a structured payload like the real record (stringified JSON)
    const payload = JSON.stringify({ username, password, totp, shared_secret })
    const dataKey = generateDataKey()
    const dataBlobB64 = encryptWithDataKey(dataKey, payload)
    const wrappedKeyBlobB64 = envelopeEncryptDataKey(dataKey)
    return NextResponse.json({ ok: true, dataBlobB64, wrappedKeyBlobB64 })
  } catch (err: any) {
    const msg = err?.message || 'encrypt_failed'
    const code = msg.includes('ENCRYPTION_MASTER_KEY') ? 503 : 400
    return NextResponse.json({ ok: false, error: 'encrypt_failed' }, { status: code })
  }
}
