'use client'

import { useState, useEffect } from 'react'

type SystemSettings = {
  maintenanceMode: boolean
  allowNewRegistrations: boolean
  maxConcurrentUsers: number
  proxyHealthCheckInterval: number
  sessionHealthCheckInterval: number
  defaultRateLimitMinutes: number
  announcementEnabled: boolean
  announcementType: 'info' | 'success' | 'warning' | 'danger'
  announcementMessage: string
  announcementLinkLabel: string
  announcementLinkUrl: string
}

type ProxyStats = {
  totalProxies: number
  healthyProxies: number
  rateLimitedProxies: number
  failedProxies: number
}

type SystemHealth = {
  webServer: boolean
  worker: boolean
  redis: boolean
  database: boolean
  proxies: boolean
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    allowNewRegistrations: true,
    maxConcurrentUsers: 1000,
    proxyHealthCheckInterval: 30,
    sessionHealthCheckInterval: 60,
    defaultRateLimitMinutes: 30,
    announcementEnabled: false,
    announcementType: 'info',
    announcementMessage: '',
    announcementLinkLabel: '',
    announcementLinkUrl: ''
  })
  
  const [proxyStats, setProxyStats] = useState<ProxyStats | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadSettings()
    loadSystemStatus()
    const interval = setInterval(loadSystemStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  async function loadSettings() {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadSystemStatus() {
    try {
      const res = await fetch('/api/admin/system-status')
      if (res.ok) {
        const data = await res.json()
        setProxyStats(data.proxyStats)
        setSystemHealth(data.health)
      }
    } catch (error) {
      console.error('Failed to load system status:', error)
    }
  }

  async function saveSettings() {
    setSaving(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setSaving(false)
    }
  }

  // Auto-save helper that updates local state then persists
  async function updateAndSave<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) {
    const next = { ...settings, [key]: value }
    setSettings(next)
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
      } else {
        setMessage(null)
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setSaving(false)
    }
  }

  async function clearProxyCache() {
    try {
      const res = await fetch('/api/admin/clear-proxy-cache', { method: 'POST' })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Proxy cache cleared' })
        loadSystemStatus()
      } else {
        setMessage({ type: 'error', text: 'Failed to clear cache' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' })
    }
  }

  if (loading) {
    return <div className="p-8">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">System Settings</h1>
        <p className="text-muted">Configure system-wide settings and monitor health</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' ? 'bg-success/20 text-success border-success/30' : 'bg-danger/20 text-danger border-danger/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* System Health */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">System Health</h2>
        {systemHealth ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(systemHealth).map(([key, status]) => (
              <div key={key} className="text-center">
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  status ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {status ? '✓' : '✗'}
                </div>
                <div className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                <div className={`text-xs ${status ? 'text-green-600' : 'text-red-600'}`}>
                  {status ? 'Healthy' : 'Down'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted">Loading health status...</div>
        )}
      </div>

      {/* Proxy Statistics */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Proxy Pool Status</h2>
        {proxyStats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">{proxyStats.totalProxies}</div>
                <div className="text-sm text-gray-600">Total Proxies</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{proxyStats.healthyProxies}</div>
                <div className="text-sm text-gray-600">Healthy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{proxyStats.rateLimitedProxies}</div>
                <div className="text-sm text-gray-600">Rate Limited</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{proxyStats.failedProxies}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>
            <button
              onClick={clearProxyCache}
              className="btn-secondary"
            >
              Clear Proxy Cache
            </button>
          </>
        ) : (
          <div className="text-muted">Loading proxy stats...</div>
        )}
      </div>

      {/* General Settings */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">General Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Maintenance Mode</label>
              <p className="text-sm text-gray-600">Prevent new sessions from starting</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => updateAndSave('maintenanceMode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Allow New Registrations</label>
              <p className="text-sm text-gray-600">Enable user sign-ups</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowNewRegistrations}
                onChange={(e) => updateAndSave('allowNewRegistrations', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="font-medium block mb-2">Max Concurrent Users</label>
            <input
              type="number"
              value={settings.maxConcurrentUsers}
              onChange={(e) => setSettings({ ...settings, maxConcurrentUsers: parseInt(e.target.value) })}
              className="px-4 py-2 rounded-lg w-32 bg-surface/2 border border-border/10"
            />
          </div>
        </div>
      </div>

      {/* Performance Settings */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="font-medium block mb-2">Proxy Health Check Interval (seconds)</label>
            <input
              type="number"
              value={settings.proxyHealthCheckInterval}
              onChange={(e) => setSettings({ ...settings, proxyHealthCheckInterval: parseInt(e.target.value) })}
              className="px-4 py-2 rounded-lg w-32 bg-surface/2 border border-border/10"
            />
            <p className="text-sm text-gray-600 mt-1">How often to check proxy health</p>
          </div>

          <div>
            <label className="font-medium block mb-2">Session Health Check Interval (seconds)</label>
            <input
              type="number"
              value={settings.sessionHealthCheckInterval}
              onChange={(e) => setSettings({ ...settings, sessionHealthCheckInterval: parseInt(e.target.value) })}
              className="px-4 py-2 rounded-lg w-32 bg-surface/2 border border-border/10"
            />
            <p className="text-sm text-gray-600 mt-1">How often to check session status and track usage</p>
          </div>

          <div>
            <label className="font-medium block mb-2">Default Rate Limit Cooldown (minutes)</label>
            <input
              type="number"
              value={settings.defaultRateLimitMinutes}
              onChange={(e) => setSettings({ ...settings, defaultRateLimitMinutes: parseInt(e.target.value) })}
              className="px-4 py-2 rounded-lg w-32 bg-surface/2 border border-border/10"
            />
            <p className="text-sm text-gray-600 mt-1">How long to wait before retrying rate-limited proxies</p>
          </div>
        </div>
      </div>

      {/* Announcement Banner */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Announcement Banner</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Enable Banner</label>
              <p className="text-sm text-gray-600">Show a message at the top of all pages</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.announcementEnabled}
                onChange={(e) => updateAndSave('announcementEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="font-medium block mb-2">Banner Type</label>
            <select
              value={settings.announcementType}
              onChange={(e) => updateAndSave('announcementType', e.target.value as SystemSettings['announcementType'])}
              className="px-4 py-2 rounded-lg w-48 bg-card border border-border/10"
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger</option>
            </select>
          </div>

          <div>
            <label className="font-medium block mb-2">Message</label>
            <input
              type="text"
              value={settings.announcementMessage}
              onChange={(e) => updateAndSave('announcementMessage', e.target.value)}
              placeholder="E.g., 20% off Pro this weekend!"
              className="px-4 py-2 rounded-lg w-full bg-surface/2 border border-border/10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium block mb-2">Link Label (optional)</label>
              <input
                type="text"
                value={settings.announcementLinkLabel}
                onChange={(e) => updateAndSave('announcementLinkLabel', e.target.value)}
                placeholder="Join Discord"
                className="px-4 py-2 rounded-lg w-full bg-surface/2 border border-border/10"
              />
            </div>
            <div>
              <label className="font-medium block mb-2">Link URL (optional)</label>
              <input
                type="text"
                value={settings.announcementLinkUrl}
                onChange={(e) => updateAndSave('announcementLinkUrl', e.target.value)}
                placeholder="/discord or https://..."
                className="px-4 py-2 rounded-lg w-full bg-surface/2 border border-border/10"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4">
            <div className={`rounded-xl border p-4 ${
              settings.announcementType === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-300' :
              settings.announcementType === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
              settings.announcementType === 'danger' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
              'bg-blue-500/10 border-blue-500/30 text-blue-300'
            }`}>
              <div className="flex items-center gap-3">
                <i className={`fa-solid ${
                  settings.announcementType === 'success' ? 'fa-circle-check' :
                  settings.announcementType === 'warning' ? 'fa-triangle-exclamation' :
                  settings.announcementType === 'danger' ? 'fa-circle-xmark' :
                  'fa-bullhorn'
                }`}></i>
                <span className="font-medium">{settings.announcementMessage || 'Your banner preview will appear here.'}</span>
                {settings.announcementLinkLabel && (
                  <span className="ml-auto"><a className="underline hover:no-underline" href={settings.announcementLinkUrl || '#'}>{settings.announcementLinkLabel}</a></span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Environment */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Environment</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Node Version</span>
            <span className="font-mono">{process.version}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Environment</span>
            <span className="font-mono">{process.env.NODE_ENV}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Payment Provider</span>
            <span className="font-mono">Stripe</span>
          </div>
        </div>
      </div>

      {/* Saving indicator */}
      <div className="flex justify-end text-sm text-muted">{saving ? 'Saving…' : null}</div>
    </div>
  )
}
