import Stripe from 'stripe'
import { prisma } from '@/lib/db'

const secret = process.env.STRIPE_SECRET_KEY
if (!secret) {
  // Allow import, but API calls will fail until set. This avoids crashing builds.
  console.warn('Stripe: STRIPE_SECRET_KEY is not set')
}

export const stripe = secret ? new Stripe(secret, { apiVersion: '2024-09-30.acacia' as any }) : (null as unknown as Stripe)

function getDefaultCurrency() {
  return (process.env.STRIPE_DEFAULT_CURRENCY || 'eur').toLowerCase()
}

// Ensure Stripe products/prices exist for DB plans, save IDs back to Plan, and return a mapping.
export async function ensureStripeProductsAndPrices() {
  if (!stripe) throw new Error('Stripe not configured')
  const currency = getDefaultCurrency()

  // Load plans from DB to ensure Stripe amounts exactly match DB
  const dbPlans = await prisma.plan.findMany({
    where: { code: { in: ['basic', 'pro', 'ultra'] } },
    select: { id: true, code: true, name: true, price: true, discountAmount: true, discountUntil: true },
  })

  const out: Record<string, { productId: string; priceId: string }> = {}

  for (const p of dbPlans) {
    // Skip free/zero priced if any such code leaks in
    if (!p.price || p.price <= 0) {
      continue
    }

  let productId = ''
  let priceId = ''

    // Verify product exists, else create
    {
      // Try to find by name first to keep idempotency
      const products = await stripe.products.search({ query: `name:'${p.name || `Plan ${p.code.toUpperCase()}`}' AND active:'true'` }).catch(() => ({ data: [] as any[] }))
      const existing = products.data?.[0]
      if (existing) {
        productId = existing.id
      }
    }
    if (!productId) {
      const created = await stripe.products.create({ name: p.name || `Plan ${p.code.toUpperCase()}` })
      productId = created.id
    }

    // Calculate final price with discount
    const discountAmount = p.discountAmount || 0
    const hasActiveDiscount = p.discountUntil && new Date(p.discountUntil) > new Date()
    const finalPrice = hasActiveDiscount ? Math.max(0, p.price - discountAmount) : p.price

    // Verify a matching recurring monthly price exists for product+amount+currency
    {
      // Find any existing active price for this product synchronously
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 100
      })
      let price = prices.data.find(pr => pr.unit_amount === finalPrice && pr.currency === currency && pr.recurring?.interval === 'month')
      if (!price) {
        price = await stripe.prices.create({ 
          unit_amount: finalPrice, 
          currency, 
          recurring: { interval: 'month' }, 
          product: productId,
          nickname: hasActiveDiscount ? `${p.name || p.code} (Discounted)` : undefined
        })
      }
      priceId = price.id
    }

    out[p.code] = { productId, priceId }
  }

  return out
}
