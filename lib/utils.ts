import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Avatar helpers
function md5(input: string) {
  // Use built-in Web Crypto if available; fallback to simple MD5 via dynamic import if needed
  // In Node 18+, crypto.subtle may not be available; we'll do a tiny runtime import if needed
  try {
    const nodeCrypto = require('crypto') as typeof import('crypto')
    return nodeCrypto.createHash('md5').update(input).digest('hex')
  } catch {
    return ''
  }
}

export function getAvatarUrl(email?: string | null, avatarUrl?: string | null, size: number = 64) {
  if (avatarUrl) return avatarUrl
  const e = (email || '').trim().toLowerCase()
  if (!e) return `https://www.gravatar.com/avatar/?s=${size}&d=identicon`
  const hash = md5(e)
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`
}