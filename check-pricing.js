const { prisma } = require('./lib/db.ts');

async function main() {
  const plans = await prisma.plan.findMany({
    where: { code: { in: ['basic', 'pro', 'ultra'] } },
    select: {
      code: true,
      name: true,
      price: true,
      discountAmount: true,
      discountUntil: true
    }
  });

  console.log('Current plan pricing:');
  plans.forEach(plan => {
    const originalEuro = (plan.price / 100).toFixed(2);
    const discountEuro = plan.discountAmount ? (plan.discountAmount / 100).toFixed(2) : '0.00';
    const finalPrice = plan.price - (plan.discountAmount || 0);
    const finalEuro = (finalPrice / 100).toFixed(2);
    
    console.log(`${plan.code}: €${originalEuro} - €${discountEuro} = €${finalEuro} (until ${plan.discountUntil})`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);