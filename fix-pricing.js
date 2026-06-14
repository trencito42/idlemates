const { prisma } = require('./lib/db.ts');

async function main() {
  console.log('Fixing plan pricing...');

  // Fix Basic plan: €4.99 with €2 discount = €2.99 final price
  await prisma.plan.update({
    where: { code: 'basic' },
    data: {
      price: 499, // €4.99
      discountAmount: 200, // €2.00 discount
      discountUntil: new Date('2025-10-31T23:59:59Z')
    }
  });

  // Fix Pro plan: €9.99 (no discount)
  await prisma.plan.update({
    where: { code: 'pro' },
    data: {
      price: 999, // €9.99
      discountAmount: null,
      discountUntil: null
    }
  });

  // Fix Ultra plan: €14.99 (no discount)
  await prisma.plan.update({
    where: { code: 'ultra' },
    data: {
      price: 1499, // €14.99
      discountAmount: null,
      discountUntil: null
    }
  });

  console.log('✅ Pricing fixed!');

  // Verify new pricing
  const plans = await prisma.plan.findMany({
    where: { code: { in: ['basic', 'pro', 'ultra'] } },
    select: { code: true, price: true, discountAmount: true, discountUntil: true }
  });

  console.log('\nNew pricing:');
  plans.forEach(plan => {
    const originalEuro = (plan.price / 100).toFixed(2);
    const discountEuro = plan.discountAmount ? (plan.discountAmount / 100).toFixed(2) : '0.00';
    const finalPrice = plan.price - (plan.discountAmount || 0);
    const finalEuro = (finalPrice / 100).toFixed(2);
    
    console.log(`${plan.code}: €${originalEuro} - €${discountEuro} = €${finalEuro}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);