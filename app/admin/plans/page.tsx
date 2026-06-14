'use client'

import { useEffect, useMemo, useState } from 'react'
import { showError, showSuccess } from '@/lib/sweetalert'

type Plan = {
  id: string
  code: string
  name: string
  price: number
  maxConcurrentGames: number
  hourlyCap: number
  featuresJson: string
  discountAmount?: number | null
  discountUntil?: string | null
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const FEATURE_KEYS = useMemo(() => (
    [
      { key: 'manualRenewal', label: 'Manual Renewal' },
      { key: 'unlimitedHours', label: 'Unlimited Hours' },
      { key: 'autoRenew', label: 'Auto Renew' },
      { key: 'aes256Security', label: 'AES-256 Security' },
      { key: 'fullDashboard', label: 'Full Dashboard' },
      { key: 'realtimeDashboard', label: 'Realtime Dashboard' },
      { key: 'emailSupport', label: 'Email Support' },
      { key: 'prioritySupport', label: 'Priority Support' },
      { key: 'priority247Support', label: '24/7 Priority Support' },
      { key: 'dedicated247Support', label: 'Dedicated 24/7 Support' },
      { key: 'smartPause', label: 'Smart Pause' },
      { key: 'cancelAnytime', label: 'Cancel Anytime' },
      { key: 'chatHistory', label: 'Chat History' },
      { key: 'customStatusMessages', label: 'Custom Status Messages' },
      { key: 'advancedAnalytics', label: 'Advanced Analytics' },
      { key: 'apiWebhook', label: 'API Webhook' },
      { key: 'priorityQueue', label: 'Priority Queue' },
      { key: 'prioritySessions', label: 'Priority Sessions' },
      { key: 'uptimeSla99', label: '99.99% Uptime SLA' },
      { key: 'dedicatedProxyPool', label: 'Dedicated Proxy Pool' },
      { key: 'appearOnline', label: 'Appear Online' },
      { key: 'autoRestart', label: 'Auto Restart' },
      { key: 'autoAcceptFriends', label: 'Auto-Accept Friends' },
    ]
  ), [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/plans')
      const data = await res.json()
      setPlans(data.plans || [])
    } catch (e) {
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function save(p: Plan) {
    setSaving(p.code)
    try {
      const features = (() => { try { return JSON.parse(p.featuresJson) } catch { return [] } })()
      const body: any = {
        code: p.code,
        name: p.name,
        price: Number(p.price) || 0,
        maxConcurrentGames: Number(p.maxConcurrentGames) || 0,
        hourlyCap: Number(p.hourlyCap) || 0,
        features,
      }
      if (p.discountAmount != null) body.discountAmount = Number(p.discountAmount)
      if (p.discountUntil) body.discountUntil = p.discountUntil
      const res = await fetch('/api/admin/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Save failed')
      showSuccess('Plan saved')
    } catch (e) {
      console.error('Save plan error', e)
      showError('Failed to save plan')
    } finally {
      setSaving(null)
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Plans</h1>
        <p className="text-muted">Edit pricing, caps, and time-limited discounts</p>
      </div>

      {loading ? (
        <div className="card p-6">Loading...</div>
      ) : (
        <div className="space-y-4">
          {plans.map(p => (
            <div key={p.id} className="card p-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="label">Code</label>
                  <input className="input" value={p.code} disabled />
                  <label className="label">Name</label>
                  <input className="input" value={p.name} onChange={e => setPlans(ps => ps.map(x => x.id===p.id? { ...x, name: e.target.value }: x))} />
                  <label className="label">Price (cents)</label>
                  <input type="number" className="input" value={p.price} onChange={e => setPlans(ps => ps.map(x => x.id===p.id? { ...x, price: Number(e.target.value) }: x))} />
                </div>
                <div className="grid gap-2">
                  <label className="label">Max concurrent games</label>
                  <input type="number" className="input" value={p.maxConcurrentGames} onChange={e => setPlans(ps => ps.map(x => x.id===p.id? { ...x, maxConcurrentGames: Number(e.target.value) }: x))} />
                  <label className="label">Hourly cap</label>
                  <input type="number" className="input" value={p.hourlyCap} onChange={e => setPlans(ps => ps.map(x => x.id===p.id? { ...x, hourlyCap: Number(e.target.value) }: x))} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="grid gap-2">
                  <label className="label">Features</label>
                  {/* Feature matrix (checkboxes) keeps featuresJson in sync */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FEATURE_KEYS.map(f => {
                      const current = (() => { try { return JSON.parse(p.featuresJson || '{}') } catch { return {} } })()
                      const checked = !!current[f.key]
                      return (
                        <label key={f.key} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={checked}
                            onChange={e => setPlans(ps => ps.map(x => {
                              if (x.id !== p.id) return x
                              let obj: any = {}
                              try { obj = JSON.parse(x.featuresJson || '{}') } catch { obj = {} }
                              if (e.target.checked) obj[f.key] = true; else delete obj[f.key]
                              return { ...x, featuresJson: JSON.stringify(obj) }
                            }))}
                          />
                          <span>{f.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="label">Discount amount (cents)</label>
                  <input type="number" className="input" value={p.discountAmount ?? ''} onChange={e => setPlans(ps => ps.map(x => x.id===p.id? { ...x, discountAmount: e.target.value === '' ? null : Number(e.target.value) }: x))} />
                  <label className="label">Discount until (ISO date)</label>
                  <input type="datetime-local" className="input" value={p.discountUntil ? p.discountUntil.slice(0,16) : ''} onChange={e => setPlans(ps => ps.map(x => x.id===p.id? { ...x, discountUntil: e.target.value ? new Date(e.target.value).toISOString() : null }: x))} />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button className="btn btn-sm" onClick={() => save(p)} disabled={saving === p.code}>{saving === p.code ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <div className="card p-6 text-muted">No plans available</div>
          )}
        </div>
      )}
    </div>
  )
}
