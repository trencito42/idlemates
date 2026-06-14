const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSubscriptionAPI() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'claudiucatalin28@gmail.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User ID:', user.id);

    // Check free plan balance
    const freeBalance = await prisma.freePlanBalance.findUnique({ 
      where: { userId: user.id } 
    });
    console.log('Free balance:', freeBalance);

    // Check free plan config
    const freePlan = await prisma.plan.findUnique({ 
      where: { code: 'free' } 
    });
    console.log('Free plan config:', freePlan);

    // Check all subscriptions
    const allSubs = await prisma.subscription.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
    console.log('All subscriptions:', allSubs.map(s => ({
      id: s.id,
      status: s.status,
      planCode: s.planCode,
      hoursUsed: s.hoursUsed,
      currentPeriodEnd: s.currentPeriodEnd,
      createdAt: s.createdAt
    })));

    // Check sessions with accumulated hours
    const sessions = await prisma.boostSession.findMany({
      where: { userId: user.id },
      include: { 
        games: { include: { game: true } }
      }
    });

    console.log('\nSessions:');
    let totalSeconds = 0;
    sessions.forEach(s => {
      console.log(`Session ${s.id}: ${s.status} - ${s.games.length} games`);
      s.games.forEach(g => {
        const hours = (g.secondsAccumulated / 3600).toFixed(2);
        console.log(`  - ${g.game?.name || 'Unknown'}: ${g.secondsAccumulated}s (${hours}h)`);
        totalSeconds += g.secondsAccumulated || 0;
      });
    });

    console.log(`\nTotal: ${totalSeconds}s = ${(totalSeconds / 3600).toFixed(2)}h`);
    console.log(`Dashboard shows: ${Math.floor(totalSeconds / 3600)}:${Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')}`);

  } finally {
    await prisma.$disconnect();
  }
}

checkSubscriptionAPI();
