import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cancelWhen } = await req.json().catch(() => ({ cancelWhen: 'period_end' }))

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const subscription: any = await prisma.subscription.findFirst({
      where: { 
        userId: user.id,
        status: 'ACTIVE'
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!subscription) {
      // Check if there are any subscriptions at all
      const allSubs = await prisma.subscription.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 3
      })
      
      console.log('No active subscription found. Recent subscriptions:', allSubs.map(s => ({ id: s.id, status: s.status, createdAt: s.createdAt })))
      
      if (allSubs.length === 0) {
        return NextResponse.json({ error: 'No subscriptions found. Please subscribe first.' }, { status: 404 })
      } else {
        const latestSub = allSubs[0]
        return NextResponse.json({ 
          error: `No active subscription found. Your latest subscription is ${latestSub.status}. Please contact support if you believe this is an error.` 
        }, { status: 404 })
      }
    }

    console.log('Cancel subscription request:', { 
      cancelWhen, 
      subscriptionId: subscription.id, 
      stripeSubId: subscription.stripeSubscriptionId,
      paypalSubId: subscription.paypalSubscriptionId 
    })

    // Check if it's an admin-granted subscription
    if (subscription.paypalSubscriptionId && subscription.paypalSubscriptionId.startsWith('admin_granted_')) {
      console.log('Processing admin-granted subscription cancellation')
      
      if (cancelWhen === 'immediately') {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'CANCELLED' }
        })
        return NextResponse.json({ 
          success: true, 
          message: 'Admin-granted subscription cancelled immediately.',
          immediate: true
        })
      } else {
        // For admin-granted subscriptions, keep them active until period end
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { 
            // Mark it internally but keep active until period end
            paypalSubscriptionId: subscription.paypalSubscriptionId + '_cancelled'
          }
        })
        return NextResponse.json({ 
          success: true, 
          message: 'Subscription will end at the end of the current period.',
          immediate: false
        })
      }
    }

    // Handle Stripe subscriptions based on user choice
    if (subscription.stripeSubscriptionId && stripe) {
      console.log('Processing Stripe subscription cancellation:', { cancelWhen })
      try {
        if (cancelWhen === 'immediately') {
          console.log('Cancelling Stripe subscription immediately')
          // Cancel immediately
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'CANCELLED' }
          })
          console.log('Stripe subscription cancelled immediately')
          return NextResponse.json({ 
            success: true, 
            message: 'Subscription cancelled immediately. Access ended now.',
            immediate: true
          })
        } else {
          console.log('Setting Stripe subscription to cancel at period end')
          // Cancel at period end
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, { cancel_at_period_end: true })
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'ACTIVE' } // keep active until end of period
          })
          console.log('Stripe subscription set to cancel at period end')
          return NextResponse.json({ 
            success: true, 
            message: 'Subscription will end at the end of the current period.',
            immediate: false
          })
        }
      } catch (err) {
        console.error('Stripe cancellation error:', err)
        return NextResponse.json({ error: 'Failed to cancel with Stripe. Please try again.' }, { status: 500 })
      }
    }

    // For admin-granted or other subscriptions
    const message = cancelWhen === 'immediately' 
      ? 'Subscription cancelled immediately.' 
      : 'Subscription will end at the end of the current period.'
    
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { 
        status: cancelWhen === 'immediately' ? 'CANCELLED' : 'ACTIVE'
      }
    })

    return NextResponse.json({ success: true, message, immediate: cancelWhen === 'immediately' })
  } catch (error: any) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to cancel subscription. Please try again.' 
    }, { status: 500 })
  }
}
