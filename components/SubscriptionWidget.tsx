'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { showSuccess, showError } from '@/lib/sweetalert'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Skeleton } from '../app/components/ui/State'

type SubscriptionData = {
  planCode: string
  planName: string
  status: string
  currentPeriodEnd: string
  hoursUsed: number
  hourlyCap: number
  maxConcurrentGames: number
  freeHoursLeft?: number | null
  nextResetAt?: string | null
}

export function SubscriptionWidget() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeGameCount, setActiveGameCount] = useState(0)

  useEffect(() => {
    loadSubscription()
    loadActiveGameCount()
  }, [])

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

  async function loadActiveGameCount() {
    try {
      const res = await fetch('/api/sessions')
      if (res.ok) {
        const data = await res.json()
        const totalActiveGames = data.sessions?.reduce((acc: number, session: any) => {
          return acc + (session.games?.length || 0)
        }, 0) || 0
        setActiveGameCount(totalActiveGames)
      }
    } catch (error) {
      console.error('Failed to load active game count:', error)
    }
  }

  if (loading) {
    return (
      <div className="card p-4">
        <Skeleton className="h-4 w-1/3 mb-2" />
        <Skeleton className="h-3 w-full mt-2" />
      </div>
    )
  }

  if (!subscription || subscription.planCode === 'free') {
    const renew = async () => {
      try {
        const res = await fetch('/api/free/renew', { method: 'POST' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Renewal failed')
        showSuccess('Free hours renewed! You now have 100 hours.')
        // Reload subscription and any header counters
        loadSubscription()
        loadActiveGameCount()
      } catch (e: any) {
        showError(e.message || 'Could not renew free hours')
      }
    }
  const cap = subscription?.hourlyCap ?? 100
  const maxGames = subscription?.maxConcurrentGames ?? 1
  const hoursLeft = subscription?.freeHoursLeft ?? cap
  const hoursUsed = Math.max(0, cap - hoursLeft)
    const resetText = subscription?.nextResetAt ? new Date(subscription.nextResetAt).toLocaleDateString() : 'monthly'
    const canRenew = hoursLeft === 0
    return (
      <div className="card overflow-hidden flex flex-col sm:flex-row">
        <div className="flex-shrink-0 bg-primary/10 border-b sm:border-b-0 sm:border-r border-primary/20 p-3 w-full sm:w-auto flex sm:flex justify-center sm:justify-start">
          <div className="w-8 h-8 flex items-center justify-center">
            <i className="fa-duotone fa-trophy text-primary text-lg"></i>
          </div>
        </div>
        
        <div className="flex-1 min-w-0 px-3 py-2 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-h-[64px] sm:min-h-[48px]">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-white text-sm">{subscription?.planName || 'Free Plan'}</h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/20 text-primary border border-primary/20">
                  ACTIVE
                </span>
              </div>
              <div className="text-xs text-muted mt-0.5 space-y-1">
                <div className="flex flex-wrap gap-x-3 items-center">
                  <span className="flex items-center gap-1">
                    <i className="fa-duotone fa-gamepad text-primary/60"></i>
                    {activeGameCount}/{maxGames} games
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fa-duotone fa-clock text-primary/60"></i>
                    {hoursUsed}/{cap}h used
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fa-duotone fa-battery-three-quarters text-primary/60"></i>
                    {hoursLeft}h left
                  </span>
                </div>
                <div className="hidden sm:block">resets {resetText}</div>
              </div>
              {activeGameCount < maxGames && (
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1.5">
                  <i className="fa-duotone fa-lightbulb text-green-400/80"></i>
                  <span>You can boost {maxGames - activeGameCount} more {maxGames - activeGameCount === 1 ? 'game' : 'games'}!</span>
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {canRenew && (
                <button onClick={renew} className="px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-xs font-medium text-primary whitespace-nowrap">
                  Renew {cap}h
                </button>
              )}
              <Link href="/pricing" className="px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center gap-1.5 transition-colors text-xs font-medium text-primary whitespace-nowrap">
                <i className="fa-duotone fa-arrow-up text-xs"></i>
                <span className="hidden sm:inline">Upgrade</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const daysLeft = Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const capVal = subscription.hourlyCap
  // Remove infinite check - show actual hourly caps
  const isInfinite = false
  const hoursPercentage = isInfinite ? 0 : Math.min(100, Math.max(0, (subscription.hoursUsed / capVal) * 100))

  return (
    <div className="card overflow-hidden flex flex-col sm:flex-row">
        <div className="flex-shrink-0 bg-primary/10 border-b sm:border-b-0 sm:border-r border-primary/20 p-3 w-full sm:w-auto flex sm:flex justify-center sm:justify-start">
          <div className="w-8 h-8 flex items-center justify-center" style={{width: "100%", height: "100%"}}>
            <i className="fa-duotone fa-medal text-primary text-lg"></i>
          </div>
        </div>      <div className="flex-1 min-w-0 px-3 py-2 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-h-[64px] sm:min-h-[48px]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-white text-sm">{subscription.planName || subscription.planCode}</h3>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/20 text-primary border border-primary/20 uppercase">
                {subscription.status}
              </span>
            </div>
            <div className="text-xs text-muted mt-0.5 space-y-1">
              <div className="flex flex-wrap gap-x-3 items-center">
                <span className="flex items-center gap-1">
                  <i className="fa-duotone fa-calendar text-primary/60"></i>
                  {daysLeft} days left
                </span>
                <span className="flex items-center gap-1">
                  <i className="fa-duotone fa-gamepad text-primary/60"></i>
                  {activeGameCount}/{subscription.maxConcurrentGames} games
                </span>
                <span className="flex items-center gap-1">
                  <i className="fa-duotone fa-clock text-primary/60"></i>
                  {subscription.hoursUsed.toFixed(1)}/{isInfinite ? '∞' : capVal}h
                </span>
              </div>
            </div>
            {activeGameCount < subscription.maxConcurrentGames && (
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1.5">
                <i className="fa-duotone fa-lightbulb text-green-400/80"></i>
                <span>You can boost {subscription.maxConcurrentGames - activeGameCount} more {subscription.maxConcurrentGames - activeGameCount === 1 ? 'game' : 'games'}!</span>
              </p>
            )}
            {!isInfinite && (
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden w-full max-w-48">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${hoursPercentage.toFixed(1)}%` }} />
              </div>
            )}
          </div>
          
          <Link href="/app/billing" className="px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center gap-1.5 transition-colors text-xs font-medium text-primary whitespace-nowrap flex-shrink-0">
            <i className="fa-duotone fa-gear text-xs"></i>
            <span className="hidden sm:inline">Manage</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
