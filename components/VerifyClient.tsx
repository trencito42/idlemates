'use client'

import { useSearchParams } from 'next/navigation'

export default function VerifyClient() {
  const params = useSearchParams()
  const token = params.get('token') || ''
  const email = params.get('email') || ''
  const cb = params.get('callbackUrl') || '/app/dashboard'

  const callbackUrl = (() => {
    try {
      const base = process.env.NEXT_PUBLIC_APP_URL || ''
      const u = new URL('/api/auth/callback/email', base || window.location.origin)
      u.searchParams.set('token', token)
      u.searchParams.set('email', email)
      u.searchParams.set('callbackUrl', cb)
      return u.toString()
    } catch {
      return `/api/auth/callback/email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(cb)}`
    }
  })()

  const disabled = !token || !email

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-bg">
      <div className="card p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">Confirm sign-in</h1>
        <p className="text-sm text-muted mb-6">Press Continue to finish signing in. This extra step prevents automated scanners from consuming your link.</p>
        <button
          className="btn w-full"
          disabled={disabled}
          onClick={() => {
            window.location.href = callbackUrl
          }}
        >
          Continue
        </button>
        {disabled && (
          <p className="text-xs text-danger mt-4">Invalid or missing verification parameters.</p>
        )}
        <p className="text-xs text-muted mt-6">If the button doesn’t work, copy and paste this URL in your browser:</p>
        <div className="mt-2 break-all text-xs bg-white/5 border border-white/10 rounded p-2 select-all">{callbackUrl}</div>
      </div>
    </div>
  )
}
