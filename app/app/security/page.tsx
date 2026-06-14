'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { showError, showSuccess, showWarning, confirm } from '@/lib/sweetalert'

type Status = { enabled: boolean; backupCount: number; last2FAAt: string | null }

export default function SecuritySettingsPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>({ enabled: false, backupCount: 0, last2FAAt: null })
  const [loading, setLoading] = useState(true)
  const [otpauth, setOtpauth] = useState('')
  const [secret, setSecret] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [devices, setDevices] = useState<any[]>([])
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarSaving, setAvatarSaving] = useState(false)

  const pingDevice = async () => {
    try {
      const did = document.cookie.split('; ').find(x => x.startsWith('did='))?.split('=')[1]
      if (!did) return
      await fetch('/api/security/devices/ping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId: did }) })
    } catch {}
  }

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/security/totp/status')
      if (!res.ok) throw new Error('Failed to load status')
      const data = await res.json()
      setStatus(data)
      // Fetch devices as well
      const d = await fetch('/api/security/devices')
      if (d.ok) {
        const dj = await d.json()
        setDevices(dj.devices || [])
      }
    } catch (e: any) {
      showError(e.message || 'Failed to load')
      try {
        const me = await fetch('/api/auth/session')
        const js = await me.json()
        setAvatarUrl(js?.user?.avatarUrl || '')
      } catch {}
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchStatus(); void pingDevice() }, [])

  const startSetup = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/security/totp/setup', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to start setup')
      const data = await res.json()
      setOtpauth(data.otpauth)
      setSecret(data.secret)
      // Render QR locally to avoid leaking secrets
      try {
        const QRCode = (await import('qrcode')).default
        const url = await QRCode.toDataURL(String(data.otpauth), { errorCorrectionLevel: 'M', margin: 2, scale: 6 })
        setQrDataUrl(url)
      } catch (e) {
        console.error('QR render failed', e)
        setQrDataUrl('')
      }
    } catch (e: any) {
      showError(e.message || 'Failed to start setup')
    } finally {
      setBusy(false)
    }
  }

  const enable = async () => {
    if (!code.trim()) {
      showWarning('Enter the 6-digit code from your authenticator app')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/security/totp/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to enable 2FA')
      setBackupCodes(data.backupCodes || [])
      showSuccess('Two-factor authentication enabled!')
      setOtpauth('')
      setSecret('')
      setCode('')
      await fetchStatus()
    } catch (e: any) {
      showError(e.message || 'Failed to enable')
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    const ok = await confirm('Disable 2FA?', 'You will remove extra protection from your account.')
    if (!ok) return
    if (!code.trim()) {
      showWarning('Enter a current 6-digit TOTP code or one backup code')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/security/totp/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to disable 2FA')
      showSuccess('Two-factor disabled')
      setCode('')
      setBackupCodes(null)
      await fetchStatus()
    } catch (e: any) {
      showError(e.message || 'Failed to disable')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-1.5">
        <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shadow-lg shadow-primary/10">
          <i className="fa-duotone fa-shield-check text-primary text-xl"></i>
        </div>
        <div>
          <h1 className="text-3xl font-black">Security</h1>
          <p className="text-muted text-sm mt-1">Manage two-factor authentication</p>
        </div>
      </div>

  <div className="card p-6 border-border/10 shadow-lg ">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Two-factor authentication (TOTP)</h3>
          <span className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${status.enabled ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-surface border border-border/10 border-white/10 text-muted'}`}>
            <i className={`fa-duotone ${status.enabled ? 'fa-lock' : 'fa-unlock'}`}></i>
            {status.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <i className="fa-duotone fa-spinner-third fa-spin text-3xl text-primary"></i>
          </div>
        ) : (
          <div className="space-y-6">
            {!status.enabled ? (
              <div className="space-y-4">
                {!otpauth ? (
                  <button onClick={startSetup} className="btn" disabled={busy}>
                    <i className="fa-duotone fa-qrcode mr-2"></i> Set up Authenticator
                  </button>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="rounded-xl bg-white p-4 flex items-center justify-center border">
                      {/* We rely on user scanners via otpauth URI; render helper text */}
                      <div className="text-center">
                        <div className="text-xs text-muted mb-2">Scan this with Google Authenticator, 1Password, etc.</div>
                        <div className="rounded-lg bg-white p-2 border">
                          {qrDataUrl ? (
                            <img src={qrDataUrl} alt="TOTP QR" className="w-[220px] h-[220px]" />
                          ) : (
                            <div className="w-[220px] h-[220px] flex items-center justify-center text-muted">
                              <i className="fa-duotone fa-spinner-third fa-spin"></i>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 text-xs break-all">
                          Or enter secret: <span className="font-mono">{secret}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm font-medium">Enter 6-digit code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        className="input text-center text-2xl tracking-widest"
                        placeholder="123456"
                      />
                      <button onClick={enable} className="btn w-full" disabled={busy}>
                        <i className="fa-duotone fa-shield-check mr-2"></i> Enable 2FA
                      </button>
                      <p className="text-xs text-muted">Backup codes will be shown once enabled. Store them safely.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-surface border border-border/10 border border-white/10 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <i className="fa-duotone fa-key"></i>
                    <span>{status.backupCount} backup codes remaining</span>
                    {status.last2FAAt && <span className="ml-auto text-xs">Last used: {new Date(status.last2FAAt).toLocaleString()}</span>}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    className="btn-secondary"
                    onClick={async () => {
                      setBusy(true)
                      try {
                        const res = await fetch('/api/security/totp/regenerate-codes', { method: 'POST' })
                        const data = await res.json().catch(() => ({}))
                        if (!res.ok) throw new Error(data.error || 'Failed to regenerate')
                        setBackupCodes(data.backupCodes || [])
                        showSuccess('Generated a new set of backup codes')
                        await fetchStatus()
                      } catch (e: any) {
                        showError(e.message || 'Failed to regenerate codes')
                      } finally {
                        setBusy(false)
                      }
                    }}
                  >
                    <i className="fa-duotone fa-rotate"></i> Regenerate backup codes
                  </button>
                </div>
                {backupCodes ? (
                  <div className="rounded-xl bg-surface border border-border/10 border border-white/10 p-4">
                    <div className="font-semibold mb-2">Backup Codes</div>
                    <ul className="grid sm:grid-cols-2 gap-2 font-mono text-sm">
                      {backupCodes.map((c) => (
                        <li key={c} className="px-3 py-2 rounded-lg bg-bg border border-white/10">{c}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted mt-2">Save these in a secure place. Each can be used once.</p>
                  </div>
                ) : null}
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium">Enter current 6-digit code or a backup code</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.trim())}
                      className="input"
                      placeholder="123456 or BACKUPCODE"
                    />
                  </div>
                  <div className="flex items-end">
                    <button onClick={disable} className="btn-secondary w-full" disabled={busy}>
                      <i className="fa-duotone fa-ban mr-2"></i> Disable 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Avatar settings */}
      <div className="card p-6">
        <h3 className="text-xl font-bold mb-2">Profile Avatar</h3>
        <p className="text-sm text-muted mb-3">Set a custom avatar URL or leave empty to use Gravatar based on your email.</p>
        <div className="flex items-center gap-4">
          <img src={avatarUrl || `https://www.gravatar.com/avatar/?s=96&d=identicon`} alt="Avatar preview" className="w-16 h-16 rounded-full border border-white/10 object-cover" />
          <input className="input flex-1" placeholder="https://.../avatar.png" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
          <button
            className="btn"
            disabled={avatarSaving}
            onClick={async () => {
              setAvatarSaving(true)
              try {
                const res = await fetch('/api/user/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatarUrl: avatarUrl || null }) })
                if (!res.ok) throw new Error('Failed to save avatar')
              } catch (e: any) {
                console.error(e)
              } finally {
                setAvatarSaving(false)
              }
            }}
          >{avatarSaving ? 'Saving...' : 'Save'}</button>
        </div>
        <div className="text-xs text-muted mt-2">
          Tip: You can set your Gravatar at <a href="https://gravatar.com" target="_blank" className="underline">gravatar.com</a>
        </div>
      </div>

      {/* Devices */}
      <div className="card p-6 border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Devices</h3>
        </div>
        <div className="space-y-2">
          {devices.length === 0 ? (
            <div className="text-sm text-muted">No devices yet.</div>
          ) : (
            devices.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border/10 border border-white/10">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm truncate">{d.userAgent}</div>
                  <div className="text-xs text-muted">{d.ip || 'No IP'} • Last seen {new Date(d.lastSeenAt).toLocaleString()}</div>
                </div>
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    const ok = await confirm('Revoke device?', 'This will sign out sessions from this device (on next check).')
                    if (!ok) return
                    try {
                      const r = await fetch('/api/security/devices', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: d.id }) })
                      if (!r.ok) throw new Error('Failed')
                      showSuccess('Device revoked')
                      await fetchStatus()
                    } catch {
                      showError('Failed to revoke device')
                    }
                  }}
                >
                  Revoke
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
