import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// Stripe Webhook endpoint:
// Set this URL in your Stripe Dashboard → Developers → Webhooks
// ${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/stripe

export async function POST(req: NextRequest) {
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  const sig = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const raw = await req.text()
  let event: any
  try {
    if (!sig || !secret) throw new Error('Missing Stripe signature or secret')
    event = stripe.webhooks.constructEvent(raw, sig, secret)
  } catch (err: any) {
    console.warn('Stripe webhook validation failed', { hasSig: !!sig, hasSecret: !!secret })
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  try {
    // Best-effort logging for admin visibility
    try {
      await prisma.webhookEvent.create({
        data: {
          source: 'stripe',
          eventId: (event as any).id,
          payload: JSON.stringify({ 
            type: event.type, 
            id: (event as any).id,
            created: event.created,
            livemode: event.livemode
          }),
          redacted: true,
        },
      })
    } catch (err) {
      console.warn('Failed to log webhook event:', err)
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const subId = session.subscription as string
        const customerId = session.customer as string
        const planCode = session.metadata?.planCode || 'basic'
        const userId = session.metadata?.userId
        if (!userId) break
        // Create an EventLog with essentials
        try {
          await prisma.eventLog.create({
            data: {
              userId,
              type: 'stripe.checkout.session.completed',
              json: {
                eventId: (event as any).id,
                sessionId: session.id,
                subscriptionId: subId,
                customerId,
                planCode,
              } as any,
            },
          })
        } catch {}
        // Ensure plan exists
        const plan = await prisma.plan.findUnique({ where: { code: planCode } })
        const planIdDb = plan ? plan.id : (await prisma.plan.create({ data: { code: planCode, name: planCode, price: 0, maxConcurrentGames: planCode==='basic'?6:planCode==='pro'?12:24, hourlyCap: planCode==='basic'?500:planCode==='pro'?1000:2000, featuresJson: '[]' } })).id
        // Activate or create a subscription for this user (avoid querying by Stripe fields until client is regenerated)
        // Pull accurate current period end from Stripe subscription when possible
        let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        try {
          if (subId) {
            const sub = await stripe.subscriptions.retrieve(subId)
            if ((sub as any)?.current_period_end) {
              periodEnd = new Date(((sub as any).current_period_end as number) * 1000)
            }
          }
        } catch {}
        const existingAny = await prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })
        const createdSub = existingAny
          ? await prisma.subscription.update({
              where: { id: existingAny.id },
              data: {
                status: 'ACTIVE',
                planId: planIdDb,
                currentPeriodEnd: periodEnd,
                stripeSubscriptionId: subId,
                stripeCustomerId: customerId,
                hoursUsed: 0, // Reset hours when upgrading plan
              },
            })
          : await prisma.subscription.create({
              data: {
                userId,
                planId: planIdDb,
                status: 'ACTIVE',
                currentPeriodEnd: periodEnd,
                stripeSubscriptionId: subId,
                stripeCustomerId: customerId,
                hoursUsed: 0, // Reset hours for new subscription
              },
            })
        // Record a payment row if available
        try {
          const amount = session.amount_total ?? session.amount_subtotal ?? plan?.price ?? 0
          const currency = (session.currency || 'eur').toString().toUpperCase()
          // Avoid duplicate payments by unique externalId
          const existingPayment = await prisma.payment.findUnique({ where: { externalId: session.id } })
          if (!existingPayment) {
            await prisma.payment.create({
            data: {
              userId,
              subscriptionId: createdSub?.id,
              amount: typeof amount === 'number' ? amount : 0,
              currency,
              status: 'completed',
              externalId: session.id,
            }
            })
          }
        } catch (e) {
          console.warn('Stripe webhook: failed to record payment', e)
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const obj = event.data.object as any
        const subId = obj?.id
        const customerId = obj?.customer
        const status = obj?.status
        
        console.log(`Processing subscription event: ${event.type}`, {
          subscriptionId: subId,
          status,
          cancel_at_period_end: obj?.cancel_at_period_end,
          current_period_end: obj?.current_period_end ? new Date(obj.current_period_end * 1000) : null
        })
        
        // Log essentials for subscription lifecycle events
        try {
          await prisma.eventLog.create({
            data: {
              type: `stripe.${event.type}`,
              json: JSON.stringify({
                eventId: (event as any).id,
                subscriptionId: subId,
                customerId,
                status: obj?.status,
                cancel_at_period_end: obj?.cancel_at_period_end,
              }),
            },
          })
        } catch (err) {
          console.warn('Failed to log subscription event:', err)
        }
        
        // Update subscription status based on Stripe subscription
        if (subId) {
          try {
            const subscription = await prisma.subscription.findFirst({
              where: { stripeSubscriptionId: subId }
            })
            if (subscription) {
              let dbStatus = 'ACTIVE'
              
              // Only cancel if subscription is truly canceled or past due
              // Don't cancel for cancel_at_period_end - keep active until period ends
              if (status === 'canceled' || event.type === 'customer.subscription.deleted') {
                // Only set to cancelled if the subscription has actually ended
                // Check if cancel_at_period_end was set but period hasn't ended yet
                if (obj?.cancel_at_period_end && obj?.current_period_end) {
                  const periodEndDate = new Date(obj.current_period_end * 1000)
                  const now = new Date()
                  
                  // If period hasn't ended yet, keep subscription active
                  if (periodEndDate > now) {
                    dbStatus = 'ACTIVE'
                  } else {
                    dbStatus = 'CANCELLED'
                  }
                } else {
                  dbStatus = 'CANCELLED'
                }
              } else if (status === 'past_due' || status === 'unpaid') {
                dbStatus = 'CANCELLED'
              }
              
              console.log(`Updating subscription ${subscription.id} to status: ${dbStatus}`)
              
              await prisma.subscription.update({
                where: { id: subscription.id },
                data: { 
                  status: dbStatus as any,
                  currentPeriodEnd: obj?.current_period_end ? new Date(obj.current_period_end * 1000) : undefined
                }
              })
              
              console.log(`Successfully updated subscription ${subscription.id} status to ${dbStatus}`)
            }
          } catch (e) {
            console.warn('Failed to update subscription from Stripe webhook:', e)
          }
        }
        break
      }
    }
  } catch (e: any) {
    console.error('Stripe webhook handler error', e)
    return NextResponse.json({ error: e?.message || 'Handler error' }, { status: 500 })
  }
  return NextResponse.json({ received: true })
}
