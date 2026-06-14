const { PrismaClient } = require('@prisma/client')

async function main() {
  const raw = process.env.BOOTSTRAP_ADMIN_EMAILS || ''
  const emails = raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  if (emails.length === 0) {
    return
  }

  const prisma = new PrismaClient()
  try {
    for (const email of emails) {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        console.warn(`[bootstrap-admin] user not found: ${email}`)
        continue
      }
      if (user.role === 'ADMIN') {
        console.log(`[bootstrap-admin] already admin: ${email}`)
        continue
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
      })
      console.log(`[bootstrap-admin] promoted to ADMIN: ${email}`)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('[bootstrap-admin] failed:', err.message)
  process.exit(1)
})
