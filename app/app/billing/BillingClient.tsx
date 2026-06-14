"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { showError, showInfo, showSuccess, showWarning, confirm } from '@/lib/sweetalert'

type Subscription = {
  id: string
  status: string
  planCode: string
  planName: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  hoursUsed: number
  hourlyCap: number
  maxConcurrentGames: number
}

const PLAN_PRICES: Record<string, string> = {
  basic: '€5',
  pro: '€9',
  ultra: '€15'
}

export default function BillingClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [plans, setPlans] = useState<any[] | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (status === 'authenticated') {
      loadSubscription()
      loadPlans()
      // Handle return from Stripe Checkout
      try {
        const url = new URL(window.location.href)
        const success = url.searchParams.get('success')
        const canceled = url.searchParams.get('canceled')
        if (success) {
          showInfo('Payment completed. Activating your subscription…')
          const sessionId = url.searchParams.get('session_id')
          if (sessionId) {
            ;(async () => {
              try {
                const res = await fetch('/api/billing/stripe/confirm', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ session_id: sessionId })
                })
                const data = await res.json().catch(() => ({}))
                if (res.ok && data?.confirmed) {
                  await loadSubscription()
                  showSuccess('Subscription activated!')
                } else {
                  // Fallback to polling if confirm didn't activate yet
                  (async () => {
                    const attempts = 8
                    for (let i = 0; i < attempts; i++) {
                      await new Promise(r => setTimeout(r, 2000))
                      try {
                        const r2 = await fetch('/api/billing/subscription', { cache: 'no-store' })
                        const j2 = await r2.json().catch(() => ({}))
                        if (r2.ok && j2?.subscription && j2.subscription.planCode !== 'free' && ['ACTIVE','TRIAL'].includes(j2.subscription.status)) {
                          setSubscription(j2.subscription)
                          showSuccess('Subscription activated!')
                          break
                        }
                      } catch {}
                      if (i === attempts - 1) {
                        showWarning('Payment received, awaiting Stripe webhook. This can take up to 1 minute. The page will update automatically.')
                      }
                    }
                  })()
                }
              } catch {}
            })()
          }
        } else if (canceled) {
          showError('Checkout cancelled')
        }
        // Clean URL (remove query params)
        if (success || canceled) {
          url.searchParams.delete('success')
          url.searchParams.delete('canceled')
          url.searchParams.delete('session_id')
          // Use replace to avoid extra history entry
          window.history.replaceState({}, '', url.toString())
        }
      } catch {}
    }
  }, [status, router])

  async function loadSubscription() {
    try {
      const res = await fetch('/api/billing/subscription')
      if (res.ok) {
        const data = await res.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Failed to load subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPlans() {
    try {
      const res = await fetch('/api/plans', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data?.plans) setPlans(data.plans)
      }
    } catch (e) {
      console.warn('Failed to load plans', e)
    }
  }

  async function handleUpgrade(planCode: string) {
    setActionLoading(true)
    setErrorMsg(null)
    try {
      const attempt = async () => {
        const res = await fetch('/api/billing/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planCode })
        })
        const text = await res.text()
        let data: any = {}
        try { data = text ? JSON.parse(text) : {} } catch {}
        if (res.ok) {
          if (data.url) {
            window.location.href = data.url
            return true
          }
          setErrorMsg('Stripe checkout URL missing')
          return false
        } else {
          setErrorMsg(data.error || `Stripe error ${res.status}: ${res.statusText}`)
          return false
        }
      }
      // Exponential backoff: 3 attempts
      for (let i = 0; i < 3; i++) {
        const ok = await attempt()
        if (ok) break
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 500))
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      setErrorMsg('Network error. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    // First, ask when they want to cancel
    const { Swal } = await import('@/lib/sweetalert')
    
    const result = await Swal.fire({
      title: 'Cancel Subscription',
      html: `
        <div class="text-center mb-4">
          <p class="text-sm text-muted mb-4">When would you like to cancel your subscription?</p>
          <div class="flex flex-col gap-3">
            <button id="cancel-immediately" class="btn w-full" style="background: rgb(239, 68, 68); border-color: rgb(239, 68, 68); color: white;">
              <i class="fa-solid fa-stop mr-2"></i>
              Cancel Immediately
              <div class="text-xs opacity-80 mt-1">Access ends now</div>
            </button>
            <button id="cancel-period-end" class="btn-secondary w-full">
              <i class="fa-solid fa-clock mr-2"></i>
              Cancel at Period End
              <div class="text-xs opacity-80 mt-1">Keep access until ${subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'period ends'}</div>
            </button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Keep Subscription',
      background: 'rgb(17, 19, 32)',
      color: 'rgb(232, 233, 237)',
      customClass: {
        popup: 'card border border-accent/20 p-4 rounded-xl',
        cancelButton: 'btn-outline btn-sm mt-3',
        title: 'font-bold text-lg mb-3',
      },
      didOpen: () => {
        const immediateBtn = document.getElementById('cancel-immediately')
        const periodEndBtn = document.getElementById('cancel-period-end')
        
        if (immediateBtn) {
          immediateBtn.onclick = () => {
            Swal.getPopup()?.setAttribute('data-choice', 'immediately')
            Swal.clickConfirm()
          }
        }
        if (periodEndBtn) {
          periodEndBtn.onclick = () => {
            Swal.getPopup()?.setAttribute('data-choice', 'period_end')
            Swal.clickConfirm()
          }
        }
      }
    })

    // Get the user's choice
    const choice = result.isConfirmed ? Swal.getPopup()?.getAttribute('data-choice') : null
    if (!choice) return // User cancelled or closed dialog

    // Confirm the action with details
    const isImmediate = choice === 'immediately'
    const confirmTitle = isImmediate ? 'Cancel Immediately?' : 'Cancel at Period End?'
    const confirmText = isImmediate 
      ? 'Your subscription and access will end immediately. This cannot be undone.'
      : 'You will retain access until the end of your current billing period.'
    
    const finalConfirm = await confirm(confirmTitle, confirmText)
    if (!finalConfirm) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/billing/cancel-subscription', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelWhen: choice })
      })
      const data = await res.json()
      
      if (res.ok && data.success) {
        await loadSubscription()
        if (data.immediate) {
          showWarning(data.message)
          // Redirect to home if immediate cancellation
          setTimeout(() => {
            window.location.href = '/'
          }, 2000)
        } else {
          showSuccess(data.message)
        }
      } else {
        showError(data.error || 'Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Cancel error:', error)
      showError('Network error occurred. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReactivate() {
    const confirmed = await confirm(
      'Reactivate Subscription?', 
      'This will resume your subscription and prevent it from ending at the period end.'
    )
    if (!confirmed) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/billing/reactivate-subscription', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      
      if (res.ok && data.success) {
        await loadSubscription()
        showSuccess(data.message || 'Subscription reactivated successfully!')
      } else {
        showError(data.error || 'Failed to reactivate subscription')
      }
    } catch (error) {
      console.error('Reactivate error:', error)
      showError('Network error occurred. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <div className="card p-6">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Billing & Subscription</h1>

      {/* Current Subscription */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
        {subscription ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold capitalize">{subscription.planCode}</div>
                <div className="text-sm text-gray-400 mt-1">{PLAN_PRICES[subscription.planCode] || 'Custom'} / month</div>
              </div>
              <div className={`px-3 py-1 rounded text-sm font-medium ${subscription.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : subscription.status === 'TRIAL' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {subscription.status}
              </div>
            </div>

            {subscription.planCode !== 'free' && (
              <div className="border-t border-gray-700 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Current period:</span>
                  <span>{new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                </div>
                {subscription.cancelAtPeriodEnd && <div className="text-yellow-400">⚠️ Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</div>}
              </div>
            )}

            {subscription.planCode !== 'free' && subscription.status === 'ACTIVE' && !subscription.cancelAtPeriodEnd && (
              <button onClick={handleCancel} disabled={actionLoading} className="btn-secondary mt-4">{actionLoading ? 'Processing...' : 'Cancel Subscription'}</button>
            )}
            {subscription.planCode !== 'free' && subscription.status === 'ACTIVE' && subscription.cancelAtPeriodEnd && (
              <button onClick={handleReactivate} disabled={actionLoading} className="btn mt-4">{actionLoading ? 'Processing...' : 'Reactivate Subscription'}</button>
            )}
            {subscription.planCode !== 'free' && subscription.status === 'APPROVAL_PENDING' && (
              <div className="mt-4 p-3 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-sm">Waiting for payment confirmation. If you completed checkout and it still shows pending, it will update shortly after the Stripe webhook is received.</div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">You are currently on the Free plan</div>
            <div className="text-sm text-gray-500">Upgrade to unlock more features</div>
          </div>
        )}
      </div>

      {/* Available Plans */}
      {(!subscription || subscription.planCode !== 'ultra') && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Upgrade Plan</h2>
          {errorMsg && <div className="mb-3 p-3 rounded bg-danger/10 border border-danger/20 text-danger text-sm">{errorMsg} <button className="underline ml-2" onClick={() => handleUpgrade(subscription?.planCode || 'basic')}>Try again</button></div>}
          <div className="grid md:grid-cols-3 gap-4">
            {(plans ?? ['basic','pro','ultra'])
              .filter((p: any) => {
                const code = typeof p === 'string' ? p : p.code
                // Filter out free plan and prevent downgrades
                if (code === 'free') return false
                
                const currentPlan = subscription?.planCode || 'free'
                const planHierarchy = ['free', 'basic', 'pro', 'ultra']
                const currentIndex = planHierarchy.indexOf(currentPlan)
                const planIndex = planHierarchy.indexOf(code)
                
                // Only show plans that are upgrades (higher tier)
                return planIndex > currentIndex
              })
              .map((p: any) => {
              const code = typeof p === 'string' ? p : p.code
              const isCurrentPlan = subscription?.planCode === code
              const priceCents = p?.price ?? (code === 'basic' ? 500 : code === 'pro' ? 900 : 1500)
              
              // Calculate final price after discount
              const discountAmount = p?.discountAmount ?? 0
              const finalPriceCents = Math.max(0, priceCents - discountAmount)
              const originalEuro = (priceCents / 100).toFixed(priceCents % 100 === 0 ? 0 : 2)
              const finalEuro = (finalPriceCents / 100).toFixed(finalPriceCents % 100 === 0 ? 0 : 2)
              
              // Get concurrent games from the plan data
              const concurrentGames = p?.maxConcurrentGames ?? (code === 'basic' ? 6 : code === 'pro' ? 12 : 24)
              
              // Generate feature list from database
              let feats: string[] = []
              try {
                const parsed = p?.featuresJson ? JSON.parse(p.featuresJson) : {}
                
                // Convert database features to display strings - show actual hourly cap
                const hoursCap = p?.hourlyCap ?? (code === 'free' ? 100 : code === 'basic' ? 500 : code === 'pro' ? 1000 : 2000)
                feats.push(`${hoursCap} hours per month`)
                
                feats.push(`Up to ${concurrentGames} concurrent games`)
                
                if (parsed.autoRenew) feats.push('Auto-renew via Stripe')
                if (parsed.aes256Security) feats.push('AES-256 encryption')
                if (parsed.realtimeDashboard) feats.push('Realtime dashboard')
                if (parsed.chatHistory) feats.push('Chat history')
                if (parsed.customStatusMessages) feats.push('Custom status messages')
                if (parsed.smartPause) feats.push('Smart pause')
                if (parsed.autoAcceptFriends) feats.push('Auto-accept friends')
                if (parsed.advancedAnalytics) feats.push('Advanced analytics')
                if (parsed.apiWebhook) feats.push('API webhooks')
                if (parsed.prioritySessions) feats.push('Priority sessions')
                if (parsed.priorityQueue) feats.push('Priority queue')
                if (parsed.dedicatedProxyPool) feats.push('Dedicated proxy pool')
                if (parsed.uptimeSla99) feats.push('99.99% uptime SLA')
                
                // Support levels
                if (parsed.emailSupport) feats.push('Email support')
                if (parsed.prioritySupport) feats.push('Priority support')
                if (parsed.priority247Support) feats.push('24/7 support')
                if (parsed.dedicated247Support) feats.push('Dedicated support')
                
                if (parsed.cancelAnytime) feats.push('Cancel anytime')
              } catch (e) {
                console.error('Failed to parse features:', e)
              }
              
              return (
                <div key={code} className={`border rounded-xl p-4 ${isCurrentPlan ? 'border-green-500 bg-green-500/5' : 'border-gray-700'}`}>
                  <div className="text-lg font-bold capitalize mb-2">{p?.name ?? code}</div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold">€{finalEuro}</span>
                    <span className="text-sm text-gray-400">/mo</span>
                    {discountAmount > 0 && (
                      <span className="text-lg text-gray-500 line-through">€{originalEuro}</span>
                    )}
                  </div>
                  {p?.discountAmount && p?.discountUntil && new Date(p.discountUntil) > new Date() && (
                    <div className="mb-3 text-sm text-green-400 flex items-center gap-1">
                      <i className="fa-duotone fa-badge-percent"></i>
                      <span>Save €{(p.discountAmount/100).toFixed(2)} - Limited time offer!</span>
                    </div>
                  )}
                  <ul className="space-y-2 text-sm text-gray-300 mb-4">{feats.map((f, i) => <li key={i} className="flex items-start"><span className="text-green-400 mr-2">✓</span>{f}</li>)}</ul>
                  {isCurrentPlan ? <div className="btn-secondary w-full text-center cursor-not-allowed opacity-50">Current Plan</div> : <button onClick={() => handleUpgrade(code)} disabled={actionLoading} className="btn w-full">{actionLoading ? 'Processing…' : 'Subscribe'}</button>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
        <div className="flex items-center gap-4">
          <i className="fa-brands fa-stripe text-4xl text-indigo-400"></i>
          <div>
            <div className="font-medium">Stripe</div>
            <div className="text-sm text-gray-400">Secure payment processing</div>
          </div>
        </div>
      </div>
    </div>
  )
}
