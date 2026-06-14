'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { signIn } from 'next-auth/react'
import { showError, showSuccess } from '@/lib/sweetalert'

function TwoFactorInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const [totp, setTotp] = useState('')
  const [loading, setLoading] = useState(false)
  const challenge = sp?.get('challenge') || ''
  const callbackUrl = sp?.get('callbackUrl') || '/app/dashboard'

  useEffect(() => {
    if (!challenge) {
      // If we landed here without a challenge, go to login
      router.replace('/auth/login')
    }
  }, [challenge, router])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!challenge) return
    setLoading(true)
    try {
      // Complete credentials flow using the challenge
      const res = await signIn('credentials', {
        redirect: false,
        challenge,
        totp,
        callbackUrl
      })
      if (res?.error) {
        // If backend sends a TOTP_REQUIRED again, treat as invalid
        const err = String(res.error)
          if (err.startsWith('TOTP_REQUIRED')) {
          showError('Invalid or expired challenge. Please sign in again.')
          router.replace('/auth/login')
          return
        }
          // Clarify messaging: allow 6-digit TOTP or a backup code
          showError('Invalid code, try again. Use a 6‑digit code or any backup code (exact match).')
        return
      }
      showSuccess('2FA verified! Redirecting…')
      router.push(callbackUrl)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="card bg-card p-8 border border-white/10 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-3">
            <img src="/logo.svg" alt="IdleMates" className="w-10 h-10" />
            <span className="text-xl font-bold text-fg">IdleMates</span>
          </Link>
          <h1 className="text-2xl font-bold mt-4">Two-factor authentication</h1>
          <p className="text-muted mt-1 text-sm">Enter the 6-digit code from your authenticator app.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-fg mb-2">Authenticator code</label>
            <input
              inputMode="numeric"
              autoFocus
              value={totp}
              onChange={(e) => setTotp(e.target.value.replace(/\s+/g, ''))}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-fg placeholder-muted focus:border-primary focus:ring-2 focus:ring-primary/20 transition duration-200 text-base tracking-widest"
              placeholder="123 456"
              maxLength={10}
              required
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading || !totp}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="btn w-full py-3"
          >
            {loading ? 'Verifying…' : 'Verify'}
          </motion.button>
        </form>

        <p className="text-xs text-muted text-center mt-4">
          Don’t have access to your authenticator? Use a backup code.
        </p>

        <div className="mt-6 text-center">
          <button onClick={() => router.replace('/auth/login')} className="text-sm text-primary hover:underline">← Back to login</button>
        </div>
      </div>
    </div>
  )
}

export default function TwoFactorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="card bg-card p-8 border border-white/10 rounded-xl shadow-lg w-full max-w-md">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-white/10 rounded" />
            <div className="h-10 bg-white/10 rounded" />
            <div className="h-10 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    }>
      <TwoFactorInner />
    </Suspense>
  )
}
