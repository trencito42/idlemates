import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const plans = [
    { code: 'free', name: 'Free', price: 0, paypalPlanId: null, maxConcurrentGames: 1, hourlyCap: 100, featuresJson: JSON.stringify({ renewable: true }) },
    { code: 'basic', name: 'Basic', price: 499, paypalPlanId: null, maxConcurrentGames: 6, hourlyCap: 500, featuresJson: JSON.stringify({ autoRestart: true }) },
    { code: 'pro', name: 'Pro', price: 999, paypalPlanId: null, maxConcurrentGames: 12, hourlyCap: 1000, featuresJson: JSON.stringify({ autoRestart: true }) },
    { code: 'ultra', name: 'Ultra', price: 1499, paypalPlanId: null, maxConcurrentGames: 24, hourlyCap: 2000, featuresJson: JSON.stringify({ autoRestart: true }) },
  ]

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    })
  }

  const sampleGames = [
    { appId: 440, name: 'Team Fortress 2' },
    { appId: 570, name: 'Dota 2' },
    { appId: 730, name: 'Counter-Strike 2' },
  ]

  for (const g of sampleGames) {
    await prisma.game.upsert({
      where: { appId: g.appId },
      update: g,
      create: g,
    })
  }

  console.log('Seed complete')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
