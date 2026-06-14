import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { stripe, ensureStripeProductsAndPrices } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

type PlanCode = 'basic' | 'pro' | 'ultra'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

    const { planCode } = await req.json().catch(() => ({}))
    const code = String(planCode) as PlanCode
    if (!['basic','pro','ultra'].includes(code)) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Ensure products/prices exist and sync to DB
    const mapping = await ensureStripeProductsAndPrices()
    const priceId = mapping[code]?.priceId
    if (!priceId) return NextResponse.json({ error: 'Price not available' }, { status: 500 })

    // Find or create a Stripe customer (avoid duplicates)
    let customerId: string
    
    // First, try to find existing customer by email
    const existingCustomers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    })
    
    if (existingCustomers.data.length > 0) {
      // Use existing customer
      customerId = existingCustomers.data[0].id
      console.log('Using existing Stripe customer:', customerId)
    } else {
      // Create new customer only if none exists
      const customer = await stripe.customers.create({ 
        email: user.email, 
        metadata: { userId: user.id } 
      })
      customerId = customer.id
      console.log('Created new Stripe customer:', customerId)
    }

    const origin = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3699'
    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
  success_url: `${origin}/app/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/app/billing?canceled=true`,
      metadata: { userId: user.id, planCode: code },
    })

    return NextResponse.json({ url: checkout.url })
  } catch (e: any) {
    console.error('Stripe checkout error', e)
    return NextResponse.json({ error: e?.message || 'Checkout failed' }, { status: 500 })
  }
}
