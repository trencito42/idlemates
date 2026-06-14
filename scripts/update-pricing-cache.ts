// Script to populate Redis with current pricing from database
// Run this when pricing changes in your admin panel

import { PrismaClient } from '@prisma/client'
import { getRedis } from '../lib/redis'

const prisma = new PrismaClient()
const redis = getRedis()

async function updatePricingCache() {
  try {
    console.log('Fetching current plans from database...')
    
    // Fetch all plans from database
    const plans = await prisma.plan.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        price: true,
        hourlyCap: true,
        maxConcurrentGames: true,
        featuresJson: true
      }
    })

    if (!plans || plans.length === 0) {
      console.log('No plans found in database')
      return
    }

    // Format plans data for chat bot
    const formattedPlans: Record<string, any> = {}
    
    for (const plan of plans) {
      const planKey = plan.code.toLowerCase()
      formattedPlans[planKey] = {
        price: plan.price,
        hours: plan.hourlyCap,
        games: plan.maxConcurrentGames,
        features: plan.featuresJson ? JSON.parse(plan.featuresJson) : []
      }
    }

    // Store in Redis with 1 hour expiration
    await redis.setex('plans:pricing', 3600, JSON.stringify(formattedPlans))
    
    console.log('✅ Pricing cache updated successfully:')
    console.log(JSON.stringify(formattedPlans, null, 2))
    
  } catch (error) {
    console.error('❌ Error updating pricing cache:', error)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

// Run if called directly
if (require.main === module) {
  updatePricingCache()
}

export { updatePricingCache }