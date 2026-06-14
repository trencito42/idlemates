'use client'

import { useState, useEffect } from 'react'

type Payment = {
  id: string
  amount: number
  currency: string
  status: string
  createdAt: string
  subscription?: {
    user?: { email?: string }
    plan?: { name?: string }
  } | null
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [webhookStatus, setWebhookStatus] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    fetch('/api/admin/payments')
      .then(async (res) => {
        const text = await res.text()
        let data: any = {}
        try { data = text ? JSON.parse(text) : {} } catch { /* ignore */ }
        if (!res.ok) {
          throw new Error(data?.error || `Failed to load payments (${res.status})`)
        }
        setPayments(data.payments || [])
        setLoading(false)
      })
      .catch((err) => {
        setErrorMsg(err?.message || 'Unable to load payments')
        setPayments([])
        setLoading(false)
      })
  }, [])

  const filteredPayments = filter === 'all' 
    ? payments 
    : payments.filter(p => p.status === filter)

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0) / 100

  if (loading) {
    return <div className="text-center py-12 text-muted">Loading payments...</div>
  }

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="card p-4 bg-danger/10 border border-danger/20 text-danger text-sm">
          {errorMsg}
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold mb-2">Payments</h1>
        <p className="text-muted">Transaction history and revenue</p>
      </div>
      <div className="card p-4 flex items-start gap-3">
        <i className="fa-brands fa-stripe text-indigo-400 text-xl mt-1"></i>
        <div className="space-y-1">
          <div className="font-medium">Stripe Webhook</div>
          <div className="text-sm text-muted break-all">
            Endpoint: <code className="font-mono">/api/webhooks/stripe</code>
          </div>
          <div className="text-xs text-muted">
            Set the webhook secret in STRIPE_WEBHOOK_SECRET. Events handled: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted.
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card p-6">
          <p className="text-sm text-muted mb-1">Total Revenue</p>
          <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-muted mb-1">Total Transactions</p>
          <p className="text-3xl font-bold">{payments.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-muted mb-1">Completed</p>
          <p className="text-3xl font-bold">{payments.filter(p => p.status === 'completed').length}</p>
        </div>
      </div>

      <div className="card p-4 flex gap-3">
        <button onClick={() => setFilter('all')} className={filter === 'all' ? 'btn-sm' : 'btn-secondary text-xs'}>
          All
        </button>
        <button onClick={() => setFilter('completed')} className={filter === 'completed' ? 'btn-sm' : 'btn-secondary text-xs'}>
          Completed
        </button>
        <button onClick={() => setFilter('pending')} className={filter === 'pending' ? 'btn-sm' : 'btn-secondary text-xs'}>
          Pending
        </button>
        <button onClick={() => setFilter('failed')} className={filter === 'failed' ? 'btn-sm' : 'btn-secondary text-xs'}>
          Failed
        </button>
      </div>

      <div className="space-y-3">
        {filteredPayments.map((payment) => (
          <div key={payment.id} className="card p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-semibold">{payment.subscription?.user?.email || 'Unknown user'}</p>
                  {payment.subscription?.plan?.name && (
                    <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                      {payment.subscription?.plan?.name}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded ${
                    payment.status === 'completed' ? 'bg-success/20 text-success' : 
                    payment.status === 'failed' ? 'bg-danger/20 text-danger' : 
                    'bg-muted/20 text-muted'
                  }`}>
                    {payment.status}
                  </span>
                </div>
                <p className="text-sm text-muted">
                  {new Date(payment.createdAt).toLocaleString('ro-RO')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">${(payment.amount / 100).toFixed(2)}</p>
                <p className="text-xs text-muted">{(payment.currency || 'usd').toUpperCase()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-muted">No payments found</p>
        </div>
      )}
    </div>
  )
}
