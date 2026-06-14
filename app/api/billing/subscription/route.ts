import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch the user's free plan balance (if any) and the configured Free plan caps
    const [freeBalance, freePlan] = await Promise.all([
      prisma.freePlanBalance.findUnique({ where: { userId: user.id } }),
      prisma.plan.findUnique({ where: { code: 'free' } })
    ])

    const subscription = await prisma.subscription.findFirst({
      where: { 
        userId: user.id,
        OR: [
          { status: { in: ['ACTIVE', 'TRIAL', 'APPROVAL_PENDING'] } },
          { 
            status: 'CANCELLED',
            currentPeriodEnd: { gte: new Date() }
          }
        ]
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    })

    if (!subscription) {
      // No active paid subscription: return current Free plan state
      const cap = Math.max(0, freePlan?.hourlyCap ?? 100)
      const maxGames = Math.max(1, freePlan?.maxConcurrentGames ?? 1)
      const rawLeft = freeBalance?.hoursLeft ?? cap
      const hoursLeft = Math.max(0, Math.min(cap, rawLeft))
      const hoursUsed = Math.max(0, cap - hoursLeft)
      // Compute monthly reset at: first day of next month 00:00 UTC
      const now = new Date()
      const nextResetAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0))
      return NextResponse.json({
        subscription: {
          id: null,
          status: 'ACTIVE',
          planCode: 'free',
          planName: freePlan?.name || 'Free',
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          hoursUsed,
          hourlyCap: cap,
          maxConcurrentGames: maxGames,
          freeHoursLeft: hoursLeft,
          nextResetAt
        }
      })
    }

    let cancelAtPeriodEnd = false
    
    // If subscription is CANCELLED but still within period, treat as cancelled at period end
    if (subscription.status === 'CANCELLED') {
      cancelAtPeriodEnd = true
    }
    
    // Check if this is a cancelled admin-granted subscription
    if (subscription.paypalSubscriptionId && subscription.paypalSubscriptionId.includes('_cancelled')) {
      cancelAtPeriodEnd = true
    }
    
    // Check Stripe for cancel_at_period_end
    const stripeSubId = (subscription as any)?.stripeSubscriptionId as string | undefined
    if (stripeSubId && stripe) {
      try {
        const sub = await stripe.subscriptions.retrieve(stripeSubId)
        cancelAtPeriodEnd = !!sub.cancel_at_period_end
      } catch (e) {
        // non-fatal; default false
      }
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status === 'CANCELLED' ? 'ACTIVE' : subscription.status,
        planCode: subscription.plan?.code || 'free',
        planName: subscription.plan?.name || 'Free',
        currentPeriodStart: subscription.createdAt,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd,
        hoursUsed: subscription.hoursUsed || 0,
        hourlyCap: subscription.plan?.hourlyCap || 100,
        maxConcurrentGames: subscription.plan?.maxConcurrentGames || 1
      }
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
