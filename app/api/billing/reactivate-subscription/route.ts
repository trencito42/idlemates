import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST() {
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

    const subscription: any = await prisma.subscription.findFirst({
      where: { 
        userId: user.id,
        status: 'ACTIVE'
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Handle Stripe subscriptions
    if (subscription.stripeSubscriptionId && stripe) {
      try {
        // Remove cancel_at_period_end flag
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, { 
          cancel_at_period_end: false 
        })
        
        return NextResponse.json({ 
          success: true, 
          message: 'Subscription reactivated! It will continue after the current period ends.'
        })
      } catch (err) {
        console.error('Stripe reactivation error:', err)
        return NextResponse.json({ error: 'Failed to reactivate with Stripe. Please try again.' }, { status: 500 })
      }
    }

    // Handle admin-granted subscriptions
    if (subscription.paypalSubscriptionId && subscription.paypalSubscriptionId.includes('_cancelled')) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { 
          paypalSubscriptionId: subscription.paypalSubscriptionId.replace('_cancelled', '')
        }
      })
      return NextResponse.json({ 
        success: true, 
        message: 'Subscription reactivated successfully!'
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription reactivated successfully!'
    })
  } catch (error: any) {
    console.error('Reactivate subscription error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to reactivate subscription. Please try again.' 
    }, { status: 500 })
  }
}