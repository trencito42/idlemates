#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fixing plan pricing...')
  
  // Update prices to correct cents values
  await prisma.plan.update({
    where: { code: 'basic' },
    data: { price: 99 }
  })
  
  await prisma.plan.update({
    where: { code: 'pro' },
    data: { price: 199 }
  })
  
  await prisma.plan.update({
    where: { code: 'ultra' },
    data: { price: 299 }
  })
  
  // Get updated plans
  const plans = await prisma.plan.findMany()
  console.log('Updated pricing:')
  plans.forEach(plan => {
    console.log(`${plan.code}: ${plan.price} cents (€${(plan.price/100).toFixed(2)})`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())