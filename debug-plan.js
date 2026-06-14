const { prisma } = require('./lib/db.ts');

async function main() {
  console.log('=== PLAN DEBUG ===');
  
  const steamAccountId = 'cmguxmqey0001ajd8mgpk1fli'; // paunelul account
  const userId = 'cmgu62osr0000h3o72lnncdgk';

  // Check steam account settings
  const steamAccount = await prisma.steamAccount.findUnique({ 
    where: { id: steamAccountId },
    select: { 
      id: true,
      userId: true,
      appearOnline: true,
      customInGameTitle: true
    }
  });
  console.log('Steam account settings:', steamAccount);

  // Check subscription
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: { in: ['ACTIVE', 'APPROVAL_PENDING', 'TRIAL'] } },
    include: { plan: true },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Active subscription:', subscription);

  if (subscription?.plan) {
    console.log('Plan features raw:', subscription.plan.featuresJson);
    try {
      const features = JSON.parse(subscription.plan.featuresJson || '{}');
      console.log('Plan features parsed:', features);
      console.log('appearOnline feature:', features.appearOnline);
    } catch (e) {
      console.error('Failed to parse features:', e);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);