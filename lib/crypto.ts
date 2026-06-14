import crypto from 'crypto'

const MASTER_KEY_HEX_OR_B64 = process.env.ENCRYPTION_MASTER_KEY || ''

function getMasterKey(): Buffer {
  if (!MASTER_KEY_HEX_OR_B64) throw new Error('ENCRYPTION_MASTER_KEY not set')
  // Accept raw 32-byte hex or base64
  if (MASTER_KEY_HEX_OR_B64.length === 64 && /^[0-9a-f]+$/i.test(MASTER_KEY_HEX_OR_B64)) {
    return Buffer.from(MASTER_KEY_HEX_OR_B64, 'hex')
  }
  const b = Buffer.from(MASTER_KEY_HEX_OR_B64, 'base64')
  if (b.length !== 32) throw new Error('Master key must be 32 bytes (base64)')
  return b
}

export function generateDataKey(): Buffer {
  return crypto.randomBytes(32)
}

export function envelopeEncryptDataKey(dataKey: Buffer) {
  const masterKey = getMasterKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv)
  const ciphertext = Buffer.concat([cipher.update(dataKey), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([Buffer.from('01','hex'), iv, tag, ciphertext]).toString('base64')
}

export function envelopeDecryptDataKey(blobB64: string): Buffer {
  const buf = Buffer.from(blobB64, 'base64')
  const version = buf.subarray(0,1)
  if (version.toString('hex') !== '01') throw new Error('Unsupported key blob')
  const iv = buf.subarray(1, 13)
  const tag = buf.subarray(13, 29)
  const ciphertext = buf.subarray(29)
  const masterKey = getMasterKey()
  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv)
  decipher.setAuthTag(tag)
  const dataKey = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return dataKey
}

export function encryptWithDataKey(dataKey: Buffer, plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', dataKey, iv)
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([Buffer.from('01','hex'), iv, tag, ciphertext]).toString('base64')
}

export function decryptWithDataKey(dataKey: Buffer, blobB64: string): string {
  const buf = Buffer.from(blobB64, 'base64')
  const version = buf.subarray(0,1)
  if (version.toString('hex') !== '01') throw new Error('Unsupported blob')
  const iv = buf.subarray(1, 13)
  const tag = buf.subarray(13, 29)
  const ciphertext = buf.subarray(29)
  const decipher = crypto.createDecipheriv('aes-256-gcm', dataKey, iv)
  decipher.setAuthTag(tag)
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plain.toString('utf8')
}

export function redactSecret(value: string | null | undefined): string {
  if (!value) return ''
  if (value.length <= 6) return '***'
  return value.slice(0, 2) + '***' + value.slice(-2)
}
