import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
  console.log('🧹 Cleaning up duplicate Steam accounts...')
  
  const accounts = await prisma.steamAccount.findMany({
    orderBy: { createdAt: 'asc' }
  })
  
  console.log(`Found ${accounts.length} total accounts`)
  
  const userAccounts = new Map<string, string[]>()
  
  // Group accounts by userId
  for (const account of accounts) {
    if (!userAccounts.has(account.userId)) {
      userAccounts.set(account.userId, [])
    }
    userAccounts.get(account.userId)!.push(account.id)
  }
  
  let deleted = 0
  
  // For each user, keep only the first account, delete the rest
  for (const [userId, accountIds] of userAccounts) {
    if (accountIds.length > 1) {
      console.log(`User ${userId} has ${accountIds.length} accounts`)
      
      const toDelete = accountIds.slice(1) // Keep first, delete rest
      
      for (const accountId of toDelete) {
        console.log(`  Deleting account ${accountId}...`)
        
        // Get sessions for this account
        const sessions = await prisma.boostSession.findMany({
          where: { steamAccountId: accountId },
          select: { id: true }
        })
        
        // Delete session games first
        for (const session of sessions) {
          await prisma.boostSessionGame.deleteMany({
            where: { sessionId: session.id }
          })
        }
        
        // Delete sessions
        await prisma.boostSession.deleteMany({
          where: { steamAccountId: accountId }
        })
        
        // Delete account
        await prisma.steamAccount.delete({
          where: { id: accountId }
        })
        
        deleted++
      }
    }
  }
  
  console.log(`✅ Cleanup complete! Deleted ${deleted} duplicate accounts.`)
  
  const remaining = await prisma.steamAccount.count()
  console.log(`📊 Remaining accounts: ${remaining}`)
}

cleanup()
  .then(() => {
    prisma.$disconnect()
    process.exit(0)
  })
  .catch((e) => {
    console.error('Error:', e)
    prisma.$disconnect()
    process.exit(1)
  })
