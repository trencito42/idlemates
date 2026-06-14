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

  console.log(`Found user ${user.email} with ${user.steamAccounts.length} accounts.`);

  for (const acc of user.steamAccounts) {
    if (acc.sharedSecretEnc) {
      await prisma.steamAccount.update({
        where: { id: acc.id },
        data: { sharedSecretEnc: null }
      });
      console.log(`Removed sharedSecretEnc from account: ${acc.id}`);
    } else {
      console.log(`Account ${acc.id} already had no sharedSecretEnc.`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
