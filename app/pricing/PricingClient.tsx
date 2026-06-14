"use client"
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'

type ApiPlan = {
  code: string
  name: string
  price: number // cents
  maxConcurrentGames: number
  hourlyCap: number
  featuresJson: string
  discountAmount?: number | null
  discountUntil?: string | null
}

export default function PricingClient() {
  const { data: session } = useSession()
  const [plans, setPlans] = useState<ApiPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/plans', { cache: 'no-store' })
        const data = await res.json()
        if (res.ok && data?.plans) setPlans(data.plans)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const normalized = useMemo(() => {
    return plans.map(p => {
      const euro = (p.price ?? 0) / 100
      const feats = (() => {
        try { return JSON.parse(p.featuresJson || '{}') } catch { return {} }
      })() as Record<string, boolean>
      
      const list: string[] = []
      
      if (p.code === 'free') {
        list.push(`${p.hourlyCap} idling hours/month`)
        list.push(`${p.maxConcurrentGames} concurrent game`)
        if (feats.manualRenewal) list.push('Manual renewal')
        if (feats.aes256Security) list.push('AES-256 security')
        if (feats.fullDashboard) list.push('Full dashboard')
        if (feats.emailSupport) list.push('Email support')
        if (feats.chatHistory) list.push('Chat history')
      } else {
        // Show actual hourly cap instead of "unlimited hours"
        list.push(`${p.hourlyCap} idling hours/month`)
        list.push(`Up to ${p.maxConcurrentGames} concurrent games`)
        if (feats.autoRenew) list.push('Auto-renew via Stripe')
        if (feats.aes256Security) list.push('AES-256 security')
        if (feats.realtimeDashboard) list.push('Realtime dashboard')
        
        // Support level
        if (p.code === 'basic' && feats.prioritySupport) list.push('Priority support')
        if (p.code === 'pro' && feats.priority247Support) list.push('24/7 priority support')
        if (p.code === 'ultra' && feats.dedicated247Support) list.push('Dedicated 24/7 support')
        
        if (feats.smartPause) list.push('Smart pause')
        if (feats.cancelAnytime) list.push('Cancel anytime')
        if (feats.chatHistory) list.push('Chat history')
        if (feats.customStatusMessages) list.push('Custom status messages')
        if (feats.autoAcceptFriends) list.push('Auto-accept friends')
        if (feats.advancedAnalytics) list.push('Advanced analytics')
        if (feats.apiWebhook) list.push('API webhook')
        if (feats.priorityQueue || feats.prioritySessions) list.push('Priority queue')
        if (feats.uptimeSla99) list.push('99.99% uptime SLA')
        if (feats.dedicatedProxyPool) list.push('Dedicated proxy pool')
      }

      const featured = p.code === 'pro'
      
      // Different href logic for free vs paid plans
      const href = p.code === 'free' 
        ? (session ? '/app/dashboard' : '/auth/register')
        : (session ? '/app/billing' : '/auth/register')
        
      const cta = p.code === 'free' ? (session ? 'Go to dashboard' : 'Start free') : `Choose ${p.name}`
      return { ...p, euro, list, featured, href, cta }
    })
  }, [plans, session])

  return (
    <main>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/70 to-bg z-[1] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-bg z-[1] pointer-events-none" />
        <div className="relative z-10 mx-auto px-6 py-20 md:py-28">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-6">
              <i className="fa-duotone fa-clock"></i>
              Start with 100 hours free
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-shadow-md">Straightforward pricing</h1>
            <p className="text-xl text-muted">Cloud that plays for you. No contracts or weird fees.</p>
          </div>
        </div>
      </section>

      {/* Plans */}
        <div className="container-page py-16">
          <div className="grid md:grid-cols-4 gap-6 container relative z-10 mx-auto px-6 mb-16">
            {loading && (
              <div className="col-span-full text-center text-muted">Loading plans…</div>
            )}
            {!loading && normalized.map((plan) => (
          <div key={plan.code} className={`card p-6 flex flex-col ${plan.featured ? 'border-primary shadow-lg scale-105' : ''}`}>
            {plan.featured && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-white text-xs font-bold mb-4 self-start">
                <i className="fa-solid fa-star"></i> Recommended
              </div>
            )}
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <div className="mb-4">
              {plan.discountAmount && plan.discountUntil ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-bold">€{((plan.price - plan.discountAmount) / 100).toFixed(2)}</span>
                    <span className="text-2xl text-muted line-through">€{plan.euro}</span>
                  </div>
                  <span className="text-muted">/month</span>
                </div>
              ) : (
                <div>
                  <span className="text-4xl font-bold">€{plan.euro}</span>
                  <span className="text-muted">/month</span>
                </div>
              )}
            </div>
            {plan.discountAmount && plan.discountUntil && (
              <div className="mb-3 text-sm text-success">Limited offer: -€{(plan.discountAmount/100).toFixed(0)} until {new Date(plan.discountUntil).toLocaleDateString()}</div>
            )}
            <ul className="space-y-3 mb-8 flex-grow">
              {plan.list.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <i className="fa-duotone fa-circle-check text-success mt-0.5 flex-shrink-0"></i>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href={plan.href} className={plan.featured ? 'btn w-full text-center' : 'btn-secondary w-full text-center'}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="max-w-5xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Detailed comparison</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-elevated border-b border-border/10">
                <tr>
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold">Free</th>
                  <th className="text-center p-4 font-semibold">Basic</th>
                  <th className="text-center p-4 font-semibold bg-primary/5">Pro</th>
                  <th className="text-center p-4 font-semibold">Ultra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {[
                  {
                    label: 'Monthly hours limit',
                    getValue: (plan: any) => {
                      if (plan?.code === 'free') return '100'
                      if (plan?.hourlyCap) return plan.hourlyCap.toString()
                      return '-'
                    }
                  },
                  {
                    label: 'Concurrent games',
                    getValue: (plan: any) => plan?.maxConcurrentGames?.toString() || '1'
                  },
                  {
                    label: 'Auto-renewal',
                    getValue: (plan: any) => {
                      const features = plan?.featuresJson ? JSON.parse(plan.featuresJson) : {}
                      return features.autoRenew ? '✓' : '✗'
                    }
                  },
                  {
                    label: 'AES-256 encryption',
                    getValue: (plan: any) => {
                      const features = plan?.featuresJson ? JSON.parse(plan.featuresJson) : {}
                      return features.aes256Security ? '✓' : '✗'
                    }
                  },
                  {
                    label: 'Realtime dashboard',
                    getValue: (plan: any) => {
                      const features = plan?.featuresJson ? JSON.parse(plan.featuresJson) : {}
                      return features.realtimeDashboard || features.fullDashboard ? '✓' : '✗'
                    }
                  },
                  {
                    label: 'Chat history',
                    getValue: (plan: any) => {
                      const features = plan?.featuresJson ? JSON.parse(plan.featuresJson) : {}
                      return features.chatHistory ? '✓' : '✗'
                    }
                  },
                  {
                    label: 'Custom status messages',
                    getValue: (plan: any) => {
                      const features = plan?.featuresJson ? JSON.parse(plan.featuresJson) : {}
                      return features.customStatusMessages ? '✓' : '✗'
                    }
                  },
                  {
                    label: 'Smart pause',
                    getValue: (plan: any) => {
                      const features = plan?.featuresJson ? JSON.parse(plan.featuresJson) : {}
                      return features.smartPause ? '✓' : '✗'
                    }
                  },
                  {
                    label: 'Advanced analytics',
                    getValue: (plan: any) => {
                      const features = plan?.featuresJson ? JSON.parse(plan.featuresJson) : {}
                      return features.advancedAnalytics ? '✓' : '✗'
                    }
                  },
                  {
                    label: 'API webhooks',
                    getValue: (plan: any) => {
                      const features = plan?.featuresJson ? JSON.parse(plan.featuresJson) : {}
                      return features.apiWebhook ? '✓' : '✗'
                    }
                  },
                  {
                    label: 'Priority sessions',
                    getValue: (plan: any) => {
                      const features = plan?.featuresJson ? JSON.parse(plan.featuresJson) : {}
                      return features.prioritySessions ? '✓' : '✗'
                    }
                  },
                  {
                    label: 'Dedicated proxy pool',
                    getValue: (plan: any) => {
                      const features = plan?.featuresJson ? JSON.parse(plan.featuresJson) : {}
                      return features.dedicatedProxyPool ? '✓' : '✗'
                    }
                  },
                  {
                    label: 'Uptime SLA',
                    getValue: (plan: any) => {
                      const features = plan?.featuresJson ? JSON.parse(plan.featuresJson) : {}
                      return features.uptimeSla99 ? '99.99%' : '-'
                    }
                  },
                  {
                    label: 'Support',
                    getValue: (plan: any) => {
                      const features = plan?.featuresJson ? JSON.parse(plan.featuresJson) : {}
                      if (features.dedicated247Support) return 'Dedicated'
                      if (features.priority247Support) return '24/7'
                      if (features.prioritySupport) return 'Priority'
                      if (features.emailSupport) return 'Email'
                      return '-'
                    }
                  },
                ].map((row) => {
                  const freePlan = normalized.find(p => p.code === 'free')
                  const basicPlan = normalized.find(p => p.code === 'basic')
                  const proPlan = normalized.find(p => p.code === 'pro')
                  const ultraPlan = normalized.find(p => p.code === 'ultra')
                  
                  return (
                    <tr key={row.label} className="hover:bg-surface-elevated/50">
                      <td className="p-4 text-sm font-medium">{row.label}</td>
                      <td className="p-4 text-sm text-center text-muted">{freePlan ? row.getValue(freePlan) : '-'}</td>
                      <td className="p-4 text-sm text-center text-muted">{basicPlan ? row.getValue(basicPlan) : '-'}</td>
                      <td className="p-4 text-sm text-center font-semibold bg-primary/5">{proPlan ? row.getValue(proPlan) : '-'}</td>
                      <td className="p-4 text-sm text-center text-muted">{ultraPlan ? row.getValue(ultraPlan) : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Quick */}
      <div className="max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Frequently asked questions</h2>
        <div className="space-y-4">
          {[
            {
              q: 'Can I cancel anytime?',
              a: 'Yes. Cancel instantly from the dashboard. No contracts, penalties, or notice period. Access continues until the end of the paid period.'
            },
            {
              q: 'What payment methods are supported?',
              a: 'Subscriptions are handled via Stripe with monthly auto-renewal. You can pay with credit/debit cards. The Subscribe button appears on the Billing page after you sign in.'
            },
            {
              q: 'How does the Free plan work?',
              a: '100 free hours per month for 1 concurrent game. Renew manually after you use them up. No card, no time-limited trial.'
            },
            {
              q: 'What is "smart pause"?',
              a: 'We detect when you are actually playing on Steam and temporarily pause idling. When you close the game, we automatically resume the session.'
            }
          ].map((faq, i) => (
            <details key={i} className="card p-6 group">
              <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                {faq.q}
                <i className="fa-solid fa-chevron-down group-open:rotate-180 transition-transform"></i>
              </summary>
              <p className="text-muted text-sm mt-4 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/faq" className="text-primary hover:underline inline-flex items-center gap-2">
            See all FAQs <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div className="card p-12 text-center bg-gradient-to-br from-primary/10 to-primary-2/10 border-primary/20 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Start with 100 free hours</h2>
        <p className="text-muted mb-8">Try the platform risk-free. Upgrade when you're ready.</p>
        <Link href="/auth/register" className="btn text-base px-8 py-3 inline-block">
          Create a free account →
        </Link>
      </div>
    </div>
    </main>
  )
}
