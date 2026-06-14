import { describe, it, expect, beforeAll } from 'vitest'

let cryptoUtil: typeof import('../lib/crypto')

beforeAll(async () => {
  process.env.ENCRYPTION_MASTER_KEY = Buffer.from('x'.repeat(32)).toString('base64')
  cryptoUtil = await import('../lib/crypto')
})

describe('crypto', () => {
  it('encrypts and decrypts with data key', () => {
    const dk = cryptoUtil.generateDataKey()
    const ct = cryptoUtil.encryptWithDataKey(dk, 'hello')
    const pt = cryptoUtil.decryptWithDataKey(dk, ct)
    expect(pt).toBe('hello')
  })

  it('envelope encrypts data key', () => {
    const dk = cryptoUtil.generateDataKey()
    const blob = cryptoUtil.envelopeEncryptDataKey(dk)
    const dk2 = cryptoUtil.envelopeDecryptDataKey(blob)
    expect(dk2.equals(dk)).toBe(true)
  })
})
