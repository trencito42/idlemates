import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  planCode: z.enum(['basic', 'pro', 'ultra']).default('pro'),
  durationDays: z.number().default(30)
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  const { userId, email, planCode, durationDays } = parsed.data

  let user
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } })
  } else if (email) {
    user = await prisma.user.findUnique({ where: { email } })
  }
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let plan = await prisma.plan.findUnique({ where: { code: planCode } })
  if (!plan) {
    // Seed minimal plan if missing
    const defaults: any = {
      basic: { name: 'Basic', price: 500, maxConcurrentGames: 6, hourlyCap: 500 },
      pro: { name: 'Pro', price: 900, maxConcurrentGames: 12, hourlyCap: 1000 },
      ultra: { name: 'Ultra', price: 1500, maxConcurrentGames: 24, hourlyCap: 2000 },
    }
    const d = defaults[planCode]
    plan = await prisma.plan.create({
      data: {
        code: planCode,
        name: d.name,
        price: d.price,
        maxConcurrentGames: d.maxConcurrentGames,
        hourlyCap: d.hourlyCap,
        featuresJson: JSON.stringify([])
      }
    })
  }

  // Cancel previous active subs
  await prisma.subscription.updateMany({
    where: { userId: user.id, status: { in: ['ACTIVE', 'TRIAL', 'APPROVAL_PENDING'] } },
    data: { status: 'CANCELLED' }
  })

  const currentPeriodEnd = new Date()
  currentPeriodEnd.setDate(currentPeriodEnd.getDate() + durationDays)

  await prisma.subscription.create({
    data: {
      userId: user.id,
      paypalSubscriptionId: `admin_granted_${planCode}_${Date.now()}`,
      planId: plan.id,
      status: 'ACTIVE',
      currentPeriodEnd,
      hoursUsed: 0 // Reset hours when admin grants subscription
    }
  })

  return NextResponse.json({ ok: true })
}
