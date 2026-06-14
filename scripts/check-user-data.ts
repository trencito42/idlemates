#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find user (assuming it's you since you mentioned the issue)
  const user = await prisma.user.findFirst({
    where: { email: { contains: '@' } },
    select: { id: true, email: true }
  })
  
  if (!user) {
    console.log('No user found')
    return
  }
  
  console.log('User:', user.email)
  
  // Check free plan balance
  const freeBalance = await prisma.freePlanBalance.findUnique({
    where: { userId: user.id }
  })
  
  console.log('Free balance:', freeBalance)
  
  // Check active sessions
  const sessions = await prisma.boostSession.findMany({
    where: { userId: user.id },
    include: { games: true }
  })
  
  console.log('Sessions:')
  sessions.forEach(s => {
    console.log(`  Session ${s.id}: status=${s.status}, games=${s.games?.length || 0}`)
    s.games?.forEach(g => {
      console.log(`    Game: ${g.appId}`)
    })
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())