const { prisma } = require('./lib/db.ts');

async function main() {
  // Update the basic plan to include all proper features
  const basicFeatures = {
    unlimitedHours: true,
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
  };

  const updated = await prisma.plan.update({
    where: { code: 'basic' },
    data: {
      featuresJson: JSON.stringify(basicFeatures)
    }
  });

  console.log('Updated basic plan:', updated);
  
  await prisma.$disconnect();
}

main().catch(console.error);