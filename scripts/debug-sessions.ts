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
  
  // Check ALL sessions for this user
  const sessions = await prisma.boostSession.findMany({
    where: { userId: user.id },
    include: { 
      games: { include: { game: true } },
      steamAccount: true
    }
  })
  
  console.log(`Total sessions for user: ${sessions.length}`)
  
  sessions.forEach(s => {
    console.log(`\nSession ${s.id}:`)
    console.log(`  Status: ${s.status}`)
    console.log(`  Steam Account: ${s.steamAccount?.id || 'Unknown'}`)
    console.log(`  Started: ${s.startedAt}`)
    console.log(`  Games: ${s.games?.length || 0}`)
    s.games?.forEach(g => {
      console.log(`    - ${g.game?.name || 'Unknown'} (appId: ${g.appId})`)
    })
  })
  
  // Check if there are any running session games
  const allSessionGames = await prisma.boostSessionGame.findMany({
    where: {
      session: {
        userId: user.id
      }
    },
    include: {
      game: true,
      session: true
    }
  })
  
  console.log(`\nTotal games across all sessions: ${allSessionGames.length}`)
  allSessionGames.forEach(g => {
    console.log(`  - ${g.game?.name} (Session: ${g.session.status})`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())