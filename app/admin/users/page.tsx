'use client'

import { useState, useEffect } from 'react'
import { showSuccess, showError, confirm } from '@/lib/sweetalert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'

type User = {
  id: string
  email: string
  role: string
  createdAt: string
  banned?: boolean
  banReason?: string | null
  twoFactorEnabled?: boolean
  last2FAAt?: string | null
  subscription?: {
    id: string
    status: string
    planCode: string
    currentPeriodEnd: string
  }
  _count: { sessions: number; payments: number; deviceSessions?: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftEmail, setDraftEmail] = useState('')
  const [draftRole, setDraftRole] = useState<'USER' | 'ADMIN'>('USER')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailUser, setDetailUser] = useState<User | null>(null)
  const [banReason, setBanReason] = useState('')
  const [grantMonths, setGrantMonths] = useState(1)
  const [grantPlan, setGrantPlan] = useState<'free' | 'basic' | 'pro' | 'ultra'>('pro')
  const [events, setEvents] = useState<Array<{ id: string; type: string; createdAt: string; json: any }>>([])
  const [banned, setBanned] = useState(false)
  const [detailBanReason, setDetailBanReason] = useState('')
  const [banSaving, setBanSaving] = useState(false)
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [devices, setDevices] = useState<Array<{ id: string, deviceId: string, userAgent: string, ip?: string | null, trusted: boolean, lastSeenAt: string }>>([])
  const [loadingDevices, setLoadingDevices] = useState(false)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  function startEdit(u: User) {
    setEditingId(u.id)
    setDraftEmail(u.email)
    setDraftRole((u.role as 'USER' | 'ADMIN') || 'USER')
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function openDetails(u: User) {
    setDetailUser(u)
    setDetailOpen(true)
    setBanned(u.banned ?? false)
    setDetailBanReason(u.banReason || '')
    // fetch recent events
    fetch(`/api/admin/users/events?userId=${u.id}&limit=10`).then(r => r.json()).then(d => setEvents(d.events || [])).catch(() => setEvents([]))
    // fetch devices
    setLoadingDevices(true)
    fetch(`/api/admin/users/devices?userId=${u.id}`).then(r => r.json()).then(d => setDevices(d.devices || [])).catch(() => setDevices([])).finally(() => setLoadingDevices(false))
  }

  async function banUser() {
    if (!detailUser) return
    if (!banReason.trim()) return
    if (banSaving) return
    setBanSaving(true)
    const res = await fetch('/api/admin/users/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: detailUser.id, reason: banReason })
    })
    if (res.ok) {
      showSuccess('Ban noted')
      const created = await res.json().catch(() => null)
      setBanReason('')
      // Append to events list if returned, otherwise refetch a small page
      if (created?.event) {
        setEvents(prev => [{ id: created.event.id, type: created.event.type, createdAt: created.event.createdAt, json: created.event.json }, ...prev])
      } else {
        fetch(`/api/admin/users/events?userId=${detailUser.id}&limit=10`).then(r => r.json()).then(d => setEvents(d.events || [])).catch(() => {})
      }
    } else {
      showError('Failed to add ban note')
    }
    setBanSaving(false)
  }

  async function grantManualPlan() {
    if (!detailUser) return
    const res = await fetch('/api/admin/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: detailUser.email, planCode: grantPlan, months: grantMonths })
    })
    if (res.ok) {
      showSuccess('Plan granted')
      setDetailOpen(false)
      // refresh list
      const r = await fetch('/api/admin/users')
      const d = await r.json()
      setUsers(d.users || [])
    } else {
      showError('Failed to grant plan')
    }
  }

  async function saveEdit(userId: string) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email: draftEmail, role: draftRole })
    })
    if (res.ok) {
      setUsers(users.map(u => u.id === userId ? { ...u, email: draftEmail, role: draftRole } : u))
      setEditingId(null)
      showSuccess('User updated')
    } else {
      showError('Failed to update user')
    }
  }

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
    const ok = await confirm('Change role?', `Change role to ${newRole}?`)
    if (!ok) return

    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole })
    })

    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    showSuccess('Role updated')
  }

  async function deleteUser(userId: string, email: string) {
    const ok = await confirm('Delete user?', `Delete user ${email}? This cannot be undone.`)
    if (!ok) return

    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })

    setUsers(users.filter(u => u.id !== userId))
    showSuccess('User deleted')
  }

  async function grantSubscription(userId: string, planCode: string) {
    const response = await fetch('/api/admin/grant-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, planCode })
    })

    if (response.ok) {
      // Reload users to reflect changes
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users || [])
      showSuccess('Plan granted')
    } else {
      showError('Failed to grant plan')
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted">Loading users...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Users</h1>
          <p className="text-muted">Manage user accounts and permissions</p>
        </div>
        <div className="text-2xl font-bold">{users.length}</div>
      </div>

      <div className="card p-4">
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
        />
      </div>

      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <div key={user.id} className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {editingId === user.id ? (
                    <>
                      <input
                        value={draftEmail}
                        onChange={e => setDraftEmail(e.target.value)}
                        className="px-2 py-1 rounded bg-surface/2 border border-border/10 text-sm"
                      />
                      <select
                        value={draftRole}
                        onChange={e => setDraftRole(e.target.value as 'USER' | 'ADMIN')}
                        className="px-2 py-1 rounded bg-surface/2 border border-border/10 text-xs"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-lg">{user.email}</p>
                      <span className={`text-xs px-2 py-1 rounded ${user.role === 'ADMIN' ? 'bg-danger/20 text-danger' : 'bg-primary/20 text-primary'}`}>
                        {user.role}
                      </span>
                      {user.banned && (
                        <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">BANNED</span>
                      )}
                    </>
                  )}
                  {user.subscription && (
                    <span className={`text-xs px-2 py-1 rounded capitalize ${
                      user.subscription.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {user.subscription.planCode}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-6 text-sm text-muted">
                  <span><i className="fa-duotone fa-gamepad mr-1"></i> {user._count.sessions} sessions</span>
                  <span><i className="fa-duotone fa-credit-card mr-1"></i> {user._count.payments} payments</span>
                  <span><i className="fa-duotone fa-calendar mr-1"></i> Joined {new Date(user.createdAt).toLocaleDateString('ro-RO')}</span>
                  {user.subscription && (
                    <span><i className="fa-duotone fa-clock mr-1"></i> Expires {new Date(user.subscription.currentPeriodEnd).toLocaleDateString('ro-RO')}</span>
                  )}
                  {typeof user._count.deviceSessions === 'number' && (
                    <span><i className="fa-duotone fa-laptop mr-1"></i> {user._count.deviceSessions} device{user._count.deviceSessions === 1 ? '' : 's'}</span>
                  )}
                  {user.twoFactorEnabled !== undefined && (
                    <span title={user.twoFactorEnabled ? 'TOTP enabled' : 'TOTP disabled'}>
                      <i className="fa-duotone fa-shield mr-1"></i>
                      {user.twoFactorEnabled ? '2FA on' : '2FA off'}
                    </span>
                  )}
                  {user.twoFactorEnabled && user.last2FAAt && (
                    <span title={new Date(user.last2FAAt).toLocaleString()}>
                      <i className="fa-duotone fa-stopwatch mr-1"></i> last 2FA {new Date(user.last2FAAt).toLocaleDateString('ro-RO')}
                    </span>
                  )}
                </div>
                
                {/* Grant Subscription */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-muted">Grant Plan:</span>
                  <button onClick={() => grantSubscription(user.id, 'basic')} className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
                    Basic
                  </button>
                  <button onClick={() => grantSubscription(user.id, 'pro')} className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">
                    Pro
                  </button>
                  <button onClick={() => grantSubscription(user.id, 'ultra')} className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">
                    Ultra
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editingId === user.id ? (
                  <>
                    <button onClick={() => saveEdit(user.id)} className="btn text-xs">Save</button>
                    <button onClick={cancelEdit} className="btn-secondary text-xs">Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openDetails(user)} className="btn text-xs">Details</button>
                    <button onClick={() => startEdit(user)} className="btn-secondary text-xs" disabled={user.banned}>Edit</button>
                    <button
                      onClick={() => toggleRole(user.id, user.role)}
                      className="btn-secondary text-xs"
                      disabled={user.banned}
                    >
                      Toggle Role
                    </button>
                    <button
                      onClick={() => deleteUser(user.id, user.email)}
                      className="btn-danger text-xs"
                      disabled={user.banned}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Details Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
  <DialogContent className="w-full max-w-lg md:max-w-xl lg:max-w-2xl">
          <DialogHeader>
            <DialogTitle>User details</DialogTitle>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted mb-1">Email</div>
                <div className="font-mono text-sm">{detailUser.email}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-muted mb-1">Role</div>
                  <div className="font-mono text-xs">{detailUser.role}</div>
                </div>
                <div>
                  <div className="text-sm text-muted mb-1">Sessions</div>
                  <div className="font-mono text-xs">{detailUser._count.sessions}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm text-muted">Banned</label>
                <input type="checkbox" checked={banned} onChange={e => setBanned(e.target.checked)} />
                <button
                  onClick={async () => {
                    if (!detailUser) return
                    const res = await fetch('/api/admin/users', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: detailUser.id, banned, banReason: detailBanReason })
                    })
                    if (res.ok) {
                      showSuccess('Banned state updated')
                      setUsers(prev => prev.map(u => u.id === detailUser.id ? ({ ...u, banned, banReason: detailBanReason }) : u))
                    } else {
                      showError('Failed to update banned state')
                    }
                  }}
                  className="btn btn-sm"
                >Save</button>
              </div>

              {banned && (
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-sm text-muted">Ban reason</label>
                  <input value={detailBanReason} onChange={e => setDetailBanReason(e.target.value)} className="flex-1 px-3 py-1 rounded bg-surface/2 border border-border/10 text-sm" />
                </div>
              )}

              <div className="border-t border-border/10 pt-3">
                <div className="text-sm font-semibold mb-2">Grant manual plan</div>
                <div className="flex items-center gap-2">
                  <select value={grantPlan} onChange={e => setGrantPlan(e.target.value as any)} className="px-2 py-1 rounded bg-surface/2 border border-border/10 text-sm">
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="ultra">Ultra</option>
                  </select>
                  <input type="number" min={1} max={24} value={grantMonths} onChange={e => setGrantMonths(parseInt(e.target.value || '1'))} className="w-20 px-2 py-1 rounded bg-surface/2 border border-border/10 text-sm" />
                  <button onClick={grantManualPlan} className="btn btn-sm">Grant</button>
                </div>
              </div>

              <div className="border-t border-border/10 pt-3">
                <div className="text-sm font-semibold mb-2">Ban note</div>
                <textarea value={banReason} onChange={e => setBanReason(e.target.value)} rows={3} className="w-full px-3 py-2 rounded bg-surface/2 border border-border/10 text-sm" placeholder="Reason (kept as an internal event log)" />
                <div className="flex justify-end mt-2">
                  <button onClick={banUser} disabled={banSaving || !banReason.trim()} className="btn-danger btn-sm disabled:opacity-50">{banSaving ? 'Saving...' : 'Add note'}</button>
                </div>
              </div>

              <div className="border-t border-border/10 pt-3">
                <div className="text-sm font-semibold mb-2">Recent events</div>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {events.length === 0 && <div className="text-sm text-muted">No recent events</div>}
                  {events.map(ev => (
                    <div key={ev.id} className="p-2 rounded bg-surface/2 border border-border/10 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono">{ev.type}</span>
                        <span className="text-muted">{new Date(ev.createdAt).toLocaleString()}</span>
                      </div>
                      {ev.json && <pre className="mt-1 text-[11px] opacity-80 whitespace-pre-wrap break-words">{JSON.stringify(ev.json)}</pre>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/10 pt-3">
                <div className="text-sm font-semibold mb-2">Devices</div>
                {loadingDevices ? (
                  <div className="text-sm text-muted">Loading devices…</div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {devices.length === 0 && <div className="text-sm text-muted">No devices</div>}
                    {devices.map(d => (
                      <div key={d.id} className="p-2 rounded bg-surface/2 border border-border/10 text-xs flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-mono truncate">{d.userAgent}</div>
                          <div className="text-muted">{d.ip || 'Unknown'} • last seen {new Date(d.lastSeenAt).toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className={`text-xs px-2 py-1 rounded ${d.trusted ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}
                            onClick={async () => {
                              await fetch('/api/admin/users/devices', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: d.id, trusted: !d.trusted }) })
                              setDevices(prev => prev.map(x => x.id === d.id ? { ...x, trusted: !x.trusted } : x))
                            }}
                          >{d.trusted ? 'Trusted' : 'Untrusted'}</button>
                          <button
                            className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            onClick={async () => {
                              await fetch('/api/admin/users/devices', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: d.id }) })
                              setDevices(prev => prev.filter(x => x.id !== d.id))
                            }}
                          >Revoke</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Change password */}
              <div className="border-t border-border/10 pt-3">
                <div className="text-sm font-semibold mb-2">Change password</div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={pw1}
                    onChange={e => setPw1(e.target.value)}
                    placeholder="New password"
                    className="flex-1 px-3 py-2 rounded bg-surface/2 border border-border/10 text-sm"
                  />
                  <input
                    type="password"
                    value={pw2}
                    onChange={e => setPw2(e.target.value)}
                    placeholder="Confirm"
                    className="flex-1 px-3 py-2 rounded bg-surface/2 border border-border/10 text-sm"
                  />
                  <button
                    className="btn btn-sm disabled:opacity-50"
                    disabled={pwSaving || pw1.length < 8 || pw1 !== pw2}
                    onClick={async () => {
                      if (!detailUser) return
                      if (pw1 !== pw2 || pw1.length < 8) return
                      setPwSaving(true)
                      const res = await fetch('/api/admin/users/password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: detailUser.id, password: pw1 })
                      })
                      if (res.ok) {
                        showSuccess('Password changed')
                        setPw1('')
                        setPw2('')
                      } else {
                        showError('Failed to change password')
                      }
                      setPwSaving(false)
                    }}
                  >
                    {pwSaving ? 'Saving...' : 'Update'}
                  </button>
                </div>
                <p className="text-xs text-muted mt-1">Minimum 8 characters.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <button className="btn-secondary" onClick={() => setDetailOpen(false)}>Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {filteredUsers.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-muted">No users found matching "{search}"</p>
        </div>
      )}
    </div>
  )
}
