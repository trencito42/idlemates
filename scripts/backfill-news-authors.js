#!/usr/bin/env node
/*
  Backfill NewsPost.authorId for existing posts without an author.
  - Select an ADMIN user if available; otherwise the oldest user.
*/
const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } })
    const fallbackUser = admin || (await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } }))
    if (!fallbackUser) {
      console.log('No users found; nothing to backfill')
      return
    }
    const result = await prisma.newsPost.updateMany({
      where: { authorId: null },
      data: { authorId: fallbackUser.id },
    })
    console.log(`Backfill complete. Updated ${result.count} posts to authorId=${fallbackUser.id}`)
  } catch (e) {
    console.error('Backfill failed:', e)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
