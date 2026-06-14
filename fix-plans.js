const { prisma } = require('./lib/db.ts');

async function main() {
  // Fix Basic plan - remove unlimited hours
  const basicFeatures = {
    autoRenew: true,
    aes256Security: true,
    realtimeDashboard: true,
    prioritySupport: true,
    smartPause: true,
    cancelAnytime: true,
    chatHistory: true,
    customStatusMessages: true,
    appearOnline: true,
    autoRestart: true,
    autoAcceptFriends: true
    // Note: NO unlimitedHours for Basic (only 500h/month)
  };

  // Pro plan features - includes Basic + more
  const proFeatures = {
    ...basicFeatures,
    unlimitedHours: true,
    advancedAnalytics: true,
    apiWebhook: true,
    prioritySessions: true,
    priorityQueue: true
  };

  // Ultra plan features - includes Pro + premium features
  const ultraFeatures = {
    ...proFeatures,
    uptimeSla99: true,
    dedicatedProxyPool: true,
    dedicated247Support: true
  };

  console.log('Updating Basic plan...');
  await prisma.plan.update({
    where: { code: 'basic' },
    data: {
      featuresJson: JSON.stringify(basicFeatures)
    }
  });

  console.log('Updating Pro plan...');
  const proPlan = await prisma.plan.upsert({
    where: { code: 'pro' },
    update: {
      featuresJson: JSON.stringify(proFeatures)
    },
    create: {
      code: 'pro',
      name: 'Pro',
      price: 999,
      maxConcurrentGames: 12,
      hourlyCap: 1000,
      featuresJson: JSON.stringify(proFeatures)
    }
  });

  console.log('Updating Ultra plan...');
  const ultraPlan = await prisma.plan.upsert({
    where: { code: 'ultra' },
    update: {
      featuresJson: JSON.stringify(ultraFeatures)
    },
    create: {
      code: 'ultra',
      name: 'Ultra',
      price: 1499,
      maxConcurrentGames: 24,
      hourlyCap: 2000,
      featuresJson: JSON.stringify(ultraFeatures)
    }
  });

  console.log('Plans updated successfully!');
  console.log('Basic features:', basicFeatures);
  console.log('Pro features:', proFeatures);
  console.log('Ultra features:', ultraFeatures);
  
  await prisma.$disconnect();
}

main().catch(console.error);