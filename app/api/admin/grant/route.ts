import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  email: z.string().email(),
  planCode: z.enum(['free', 'basic', 'pro', 'ultra']).default('pro'),
  months: z.number().int().min(1).max(24).default(1),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { email, planCode, months } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Ensure plan exists
  const PLAN_DEFAULTS: Record<string, { name: string; price: number; maxConcurrentGames: number; hourlyCap: number; featuresJson: string }> = {
    free: { name: 'Free', price: 0, maxConcurrentGames: 1, hourlyCap: 100, featuresJson: JSON.stringify(['100 hours/month', '1 game']) },
    basic: { name: 'Basic', price: 500, maxConcurrentGames: 6, hourlyCap: 500, featuresJson: JSON.stringify(['Unlimited hours', '6 games']) },
    pro: { name: 'Pro', price: 900, maxConcurrentGames: 12, hourlyCap: 1000, featuresJson: JSON.stringify(['Unlimited hours', '12 games']) },
    ultra: { name: 'Ultra', price: 1500, maxConcurrentGames: 24, hourlyCap: 2000, featuresJson: JSON.stringify(['Unlimited hours', '24 games']) },
  }

  const defaults = PLAN_DEFAULTS[planCode]
  const plan = await prisma.plan.upsert({
    where: { code: planCode },
    update: {},
    create: {
      code: planCode,
      name: defaults.name,
      price: defaults.price,
      paypalPlanId: null,
      maxConcurrentGames: defaults.maxConcurrentGames,
      hourlyCap: defaults.hourlyCap,
      featuresJson: defaults.featuresJson,
    },
  })

  // Create a manual subscription (unique paypalSubscriptionId required)
  const now = new Date()
  const currentPeriodEnd = new Date(now)
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + months)

  const sub = await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      status: 'ACTIVE',
      currentPeriodEnd,
      paypalSubscriptionId: `manual_${planCode}_${Date.now()}`,
      hoursUsed: 0, // Reset hours when granting subscription
    },
  })

  return NextResponse.json({ ok: true, subscriptionId: sub.id })
}
