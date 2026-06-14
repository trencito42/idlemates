import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const GAME_NAME_OVERRIDES: Record<number, string> = {
  730: 'Counter-Strike 2',
  2073620: 'Arena Breakout Infinite',
  2767030: 'Marvel Rivals'
}

async function updateGameNames() {
  console.log('Updating game names...')
  for (const [appId, name] of Object.entries(GAME_NAME_OVERRIDES)) {
    await prisma.game.upsert({
      where: { appId: parseInt(appId) },
      create: { 
        appId: parseInt(appId),
        name
      },
      update: { 
        name
      }
    })
    console.log(`Updated game ${appId} to "${name}"`)
  }
  console.log('Game names updated!')
}

updateGameNames()
  .catch(console.error)
  .finally(() => prisma.$disconnect())