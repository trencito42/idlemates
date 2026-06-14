import crypto from 'crypto'
import { cookies, headers } from 'next/headers'

const COOKIE = 'idlemates.csrf'

export function getOrSetCsrfToken() {
  const store = cookies()
  let token = store.get(COOKIE)?.value
  if (!token) {
    token = crypto.randomBytes(16).toString('hex')
    store.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: true, path: '/' })
  }
  return token
}

export function assertCsrf() {
  const store = cookies()
  const token = store.get(COOKIE)?.value
  const hdr = headers().get('x-csrf-token') || ''
  if (!token || !hdr || token !== hdr) throw new Error('Invalid CSRF')
}
