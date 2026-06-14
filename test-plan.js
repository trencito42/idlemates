const { resolvePlanForUser } = require('./lib/plans.ts');

async function main() {
  const userId = 'cmgu62osr0000h3o72lnncdgk';
  
  const plan = await resolvePlanForUser(userId);
  console.log('Plan resolved for user:', plan);
  console.log('appearOnline feature:', plan.features.appearOnline);
  
  process.exit(0);
}

main().catch(console.error);