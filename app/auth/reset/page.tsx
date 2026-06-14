'use client'

import { useState } from 'react'
import { showError, showSuccess } from '@/lib/sweetalert'

export default function ResetRequestPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'sending'|'sent'>('idle')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      await fetch('/api/auth/password/reset-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
      })
      setStatus('sent')
      showSuccess('If an account exists, a reset link has been sent')
    } catch {
      setStatus('sent')
      showError('Failed to send reset link')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-bg">
      <div className="card p-8 w-full max-w-md">
  <h1 className="text-2xl font-bold mb-2">Reset your password</h1>
        <p className="text-sm text-muted mb-6">Enter your email and we'll send you a reset link.</p>
          {status==='sent' ? (
            <></>
          ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3 py-2 rounded bg-surface/2 border border-border/10" />
            <button className="btn w-full" disabled={status==='sending'}>{status==='sending'?'Sending…':'Send reset link'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
