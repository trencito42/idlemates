'use client'

import { useState } from 'react'

export default function ResetWithTokenPage({ params }: { params: { token: string } }) {
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [status, setStatus] = useState<'idle'|'saving'|'done'|'error'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (pw1.length < 8) return setError('Password must be at least 8 characters')
    if (pw1 !== pw2) return setError('Passwords do not match')
    setStatus('saving')
    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: params.token, password: pw1 })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Reset failed')
      setStatus('done')
    } catch (e: any) {
      setError(e.message)
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-bg">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Set a new password</h1>
        <p className="text-sm text-muted mb-6">Choose a strong password for your account.</p>
        {status==='done' ? (
          <div className="rounded bg-success/10 border border-success/20 p-3 text-success text-sm">Password updated. You can now sign in.</div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <div className="rounded bg-danger/10 border border-danger/20 p-3 text-danger text-sm">{error}</div>}
            <input type="password" value={pw1} onChange={e=>setPw1(e.target.value)} placeholder="New password" className="w-full px-3 py-2 rounded bg-surface/2 border border-border/10" />
            <input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="Confirm password" className="w-full px-3 py-2 rounded bg-surface/2 border border-border/10" />
            <button className="btn w-full" disabled={status==='saving' || pw1.length<8 || pw1!==pw2}>{status==='saving'?'Saving…':'Update password'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
