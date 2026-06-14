#!/bin/bash

# Cleanup duplicate Steam accounts
# This script removes duplicate Steam accounts keeping only the first one per user

cd "$(dirname "$0")"

echo "🧹 Cleaning up duplicate Steam accounts..."

# Run cleanup via Prisma
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('Fetching all Steam accounts...')
  
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
        
        // Delete sessions first
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
    prisma.\$disconnect();
    process.exit(0);
  })
  .catch((e) => {
    console.error('Error:', e);
    prisma.\$disconnect();
    process.exit(1);
  });
"
