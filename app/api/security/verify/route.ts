import { NextResponse } from 'next/server'
import { envelopeDecryptDataKey, decryptWithDataKey } from '@/lib/crypto'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { dataBlobB64, wrappedKeyBlobB64 } = await req.json()
    if (typeof dataBlobB64 !== 'string' || typeof wrappedKeyBlobB64 !== 'string') {
      return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 })
    }
    // Decrypt wrapped data key with server-side master key
    const dataKey = envelopeDecryptDataKey(wrappedKeyBlobB64)
    // Attempt decryption of the data blob (no plaintext returned)
    const plaintext = decryptWithDataKey(dataKey, dataBlobB64)
    return NextResponse.json({ ok: true, bytes: Buffer.byteLength(plaintext, 'utf8') })
  } catch (err: any) {
    const code = err?.message?.includes('ENCRYPTION_MASTER_KEY') ? 503 : 400
    return NextResponse.json({ ok: false, error: 'verify_failed' }, { status: code })
  }
}
