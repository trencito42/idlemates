import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    const { session_id } = await req.json().catch(() => ({}))
    if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

    const session = await stripe.checkout.sessions.retrieve(session_id)
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const isPaid = session.payment_status === 'paid'
    const isComplete = (session.status as any) === 'complete'

    const userId = (session.metadata as any)?.userId
    const planCode = (session.metadata as any)?.planCode || 'basic'
  const stripeSubId = session.subscription as string
  const stripeCustomerId = session.customer as string

    if (!userId || !stripeSubId) return NextResponse.json({ error: 'Invalid session metadata' }, { status: 400 })

    // Ensure plan exists
    const plan = await prisma.plan.findUnique({ where: { code: planCode } })
    const planIdDb = plan ? plan.id : (await prisma.plan.create({ data: { code: planCode, name: planCode, price: 0, maxConcurrentGames: planCode==='basic'?6:planCode==='pro'?12:24, hourlyCap: planCode==='basic'?500:planCode==='pro'?1000:2000, featuresJson: '[]' } })).id

    // Confirm activation only if paid or session complete
    if (isPaid || isComplete) {
      // Retrieve Stripe subscription to get accurate period end
      let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      try {
        if (stripeSubId) {
          const sub = await stripe.subscriptions.retrieve(stripeSubId)
          if ((sub as any)?.current_period_end) {
            periodEnd = new Date(((sub as any).current_period_end as number) * 1000)
          }
        }
      } catch {}
      // Activate or create subscription by userId
      const existingSub = await prisma.subscription.findFirst({ where: { userId, status: 'ACTIVE' } })
      const createdSub = existingSub || await (prisma as any).subscription.create({
        data: {
          userId,
          planId: planIdDb,
          status: 'ACTIVE',
          currentPeriodEnd: periodEnd,
          hoursUsed: 0, // Reset hours when creating new subscription
          // NOTE: intentionally omitting Stripe ID fields here to avoid Prisma validation errors
        }
      })

      // Best-effort: persist Stripe IDs for future operations (using any-cast to bypass type drift)
      try {
        await (prisma as any).subscription.update({
          where: { id: createdSub.id },
          data: {
            stripeSubscriptionId: stripeSubId,
            stripeCustomerId: stripeCustomerId,
          }
        })
      } catch {}

      // Record payment if missing
      try {
        const amount = (session as any).amount_total ?? (session as any).amount_subtotal ?? plan?.price ?? 0
        const currency = ((session as any).currency || 'eur').toString().toUpperCase()
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
      } catch {}

      return NextResponse.json({ confirmed: true })
    }
    return NextResponse.json({ confirmed: false, reason: 'pending' })
  } catch (e: any) {
    console.error('Stripe confirm error', e)
    return NextResponse.json({ error: e?.message || 'Confirm failed' }, { status: 500 })
  }
}
