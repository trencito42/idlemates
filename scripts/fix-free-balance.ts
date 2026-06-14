#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'claudiucatalin28@gmail.com' }
  })
  
  if (!user) {
    console.log('User not found')
    return
  }
  
  // Check if user has active games
  const sessions = await prisma.boostSession.findMany({
    where: { userId: user.id, status: 'running' },
    include: { games: { include: { game: true } } }
  })
  
  console.log('Running sessions:', sessions.length)
  
  sessions.forEach(s => {
    console.log(`Session ${s.id}: ${s.games?.length || 0} games`)
    s.games?.forEach(g => {
      console.log(`  - ${g.game?.name || 'Unknown'} (appId: ${g.appId})`)
    })
  })
  
  // Calculate approximate hours played (based on session start time)
  const totalHoursPlayed = sessions.reduce((acc, s) => {
    if (s.startedAt) {
      const hoursRunning = (Date.now() - s.startedAt.getTime()) / (1000 * 60 * 60)
      return acc + hoursRunning * (s.games?.length || 0)
    }
    return acc
  }, 0)
  
  console.log(`Estimated total hours played: ${totalHoursPlayed.toFixed(2)}`)
  
  // Create initial free balance based on estimated usage
  const hoursLeft = Math.max(0, 100 - totalHoursPlayed)
  
  await prisma.freePlanBalance.upsert({
    where: { userId: user.id },
    create: { userId: user.id, hoursLeft },
    update: { hoursLeft }
  })
  
  console.log(`Set free balance to ${hoursLeft.toFixed(2)} hours left`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())