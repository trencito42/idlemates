const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'stefan@xodo.ro' },
    include: { steamAccounts: true }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log(JSON.stringify(user.steamAccounts, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
