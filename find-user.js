const { prisma } = require('./lib/db.ts');

async function main() {
  const userId = 'cmgu62osr0000h3o72lnncdgk';
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, id: true }
  });
  
  console.log('User found:', user);
  await prisma.$disconnect();
}

main().catch(console.error);