import crypto from 'crypto'

// Basic Base32 encoding/decoding (RFC 4648) for secrets
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function generateBase32Secret(bytes = 20): string {
  const buf = crypto.randomBytes(bytes)
  let bits = ''
  for (const b of buf) bits += b.toString(2).padStart(8, '0')
  let out = ''
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5)
    out += ALPHABET[parseInt(chunk.padEnd(5, '0'), 2)]
  }
  // Pad with '=' to a multiple of 8 chars (optional for compatibility)
  while (out.length % 8 !== 0) out += '='
  return out
}

function base32ToBuffer(b32: string): Buffer {
  const clean = b32.toUpperCase().replace(/=+$/,'')
  let bits = ''
  for (const c of clean) {
    const val = ALPHABET.indexOf(c)
    if (val < 0) continue
    bits += val.toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

export function hotp(secretB32: string, counter: number, digits = 6): string {
  const key = base32ToBuffer(secretB32)
  const msg = Buffer.alloc(8)
  // Write big-endian counter
  for (let i = 7; i >= 0; i--) {
    msg[i] = counter & 0xff
    counter >>= 8
  }
  const hmac = crypto.createHmac('sha1', key).update(msg).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const bin = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff)
  const otp = (bin % Math.pow(10, digits)).toString().padStart(digits, '0')
  return otp
}

export function totp(secretB32: string, timeStep = 30, digits = 6, epoch = Math.floor(Date.now() / 1000)): string {
  const counter = Math.floor(epoch / timeStep)
  return hotp(secretB32, counter, digits)
}

export function verifyTotp(secretB32: string, token: string, window = 1, timeStep = 30, digits = 6): boolean {
  const now = Math.floor(Date.now() / 1000)
  for (let w = -window; w <= window; w++) {
    const counter = Math.floor(now / timeStep) + w
    const code = hotp(secretB32, counter, digits)
    if (timingSafeEqual(code, token)) return true
  }
  return false
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export function buildOtpAuthUrl(issuer: string, label: string, secretB32: string): string {
  const url = new URL(`otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}`)
  url.searchParams.set('secret', secretB32.replace(/=+$/, ''))
  url.searchParams.set('issuer', issuer)
  url.searchParams.set('algorithm', 'SHA1')
  url.searchParams.set('digits', '6')
  url.searchParams.set('period', '30')
  return url.toString()
}
