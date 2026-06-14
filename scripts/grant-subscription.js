// Usage: node scripts/grant-subscription.js stefan@xodo.ro pro 1
const { PrismaClient } = require('@prisma/client')

async function main() {
  const [email, planCode = 'pro', monthsArg = '1'] = process.argv.slice(2)
  if (!email) {
    console.error('Usage: node scripts/grant-subscription.js <email> [planCode] [months]')
    process.exit(1)
  }
  const months = Math.max(1, Math.min(24, parseInt(monthsArg, 10) || 1))
  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new Error(`User not found: ${email}`)
    const PLAN_DEFAULTS = {
      free: { name: 'Free', price: 0, maxConcurrentGames: 1, hourlyCap: 100, featuresJson: JSON.stringify(['100 hours/month', '1 game']) },
      basic: { name: 'Basic', price: 500, maxConcurrentGames: 6, hourlyCap: 500, featuresJson: JSON.stringify(['Unlimited hours', '6 games']) },
      pro: { name: 'Pro', price: 900, maxConcurrentGames: 12, hourlyCap: 1000, featuresJson: JSON.stringify(['Unlimited hours', '12 games']) },
      ultra: { name: 'Ultra', price: 1500, maxConcurrentGames: 24, hourlyCap: 2000, featuresJson: JSON.stringify(['Unlimited hours', '24 games']) },
    }
    const defaults = PLAN_DEFAULTS[planCode] || PLAN_DEFAULTS['pro']
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
    console.log('Granted subscription', { email, planCode, subscriptionId: sub.id })
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
