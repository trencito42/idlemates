'use client'

import { useState, useEffect, useRef } from 'react'
import { showSuccess, showError } from '@/lib/sweetalert'

type Session = {
  id: string
  status: string
  startedAt: string
  user: { email: string }
  steamAccount: { usernameEnc: string }
  games: { appId: string; name: string }[]
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState<'startedAt' | 'status'>('startedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const debounceRef = useRef<any>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions(p = page) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (email) params.set('email', email)
    params.set('page', String(p))
    params.set('pageSize', String(pageSize))
    params.set('sortBy', sortBy)
    params.set('sortDir', sortDir)
    const res = await fetch(`/api/admin/sessions?${params.toString()}`)
    const data = await res.json()
    setSessions(data.sessions || [])
    setTotal(data.total || 0)
    setPage(data.page || p)
    setLoading(false)
    setUpdatedAt(new Date())
  }

  async function forceStop(sessionId: string) {
    if (!confirm('Force stop this session?')) return
    
    await fetch('/api/admin/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action: 'stop' })
    })

    await loadSessions()
    showSuccess('Session stopped')
  }

  if (loading) {
    return <div className="text-center py-12 text-muted">Loading sessions...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Active Sessions</h1>
          <p className="text-muted flex items-center gap-2">Monitor and control boost sessions {updatedAt && (
            <span className="text-xs text-white/50">• Updated {updatedAt.toLocaleTimeString()}</span>
          )}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={status} onChange={e => setStatus(e.target.value)} className="px-2 py-2 rounded bg-white/5 border border-white/10 text-sm">
            <option value="">All statuses</option>
            <option value="running">running</option>
            <option value="stopped">stopped</option>
            <option value="paused">paused</option>
          </select>
          <input
            value={email}
            onChange={e => {
              const v = e.target.value
              setEmail(v)
              if (debounceRef.current) clearTimeout(debounceRef.current)
              debounceRef.current = setTimeout(() => loadSessions(1), 400)
            }}
            placeholder="Search by user email"
            className="px-3 py-2 rounded bg-white/5 border border-white/10 text-sm"
          />
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-2 py-2 rounded bg-white/5 border border-white/10 text-sm">
            <option value="startedAt">Start time</option>
            <option value="status">Status</option>
          </select>
          <select value={sortDir} onChange={e => setSortDir(e.target.value as any)} className="px-2 py-2 rounded bg-white/5 border border-white/10 text-sm">
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <select value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value)); setPage(1); }} className="px-2 py-2 rounded bg-white/5 border border-white/10 text-sm">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <button onClick={() => loadSessions(1)} className="btn-secondary text-sm">
            <i className="fa-duotone fa-rotate"></i> Apply
          </button>
          <button onClick={() => { setStatus(''); setEmail(''); loadSessions(1) }} className="btn-secondary text-sm">Reset</button>
        </div>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className={`card p-6`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-semibold">{session.user.email}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    session.status === 'running' ? 'bg-success/20 text-success' : 'bg-muted/20 text-muted'
                  }`}>
                    {session.status}
                  </span>
                </div>
                <p className="text-sm text-muted mb-3">
                  Started {new Date(session.startedAt).toLocaleString('ro-RO')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {session.games.map((g) => (
                    <span key={g.appId} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                      {g.name} ({g.appId})
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={async () => {
                  // optimistic update
                  setSessions(prev => prev.map(s => s.id === session.id ? { ...s, status: 'stopped' } : s))
                  try {
                    await forceStop(session.id)
                  } catch (e) {
                    showError('Failed to stop session')
                  }
                }}
                className="btn-danger text-xs"
                disabled={session.status !== 'running'}
              >
                Force Stop
              </button>
            </div>
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-muted">No active sessions</p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted">Total: {total}</div>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => loadSessions(page - 1)}
          >Prev</button>
          <div className="text-sm">Page {page} / {Math.max(1, Math.ceil(total / pageSize))}</div>
          <button
            className="btn-secondary btn-sm"
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => loadSessions(page + 1)}
          >Next</button>
        </div>
      </div>
    </div>
  )
}
