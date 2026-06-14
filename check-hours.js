const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'claudiucatalin28@gmail.com' },
      include: {
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'TRIAL'] } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User:', user.email);
    console.log('Active subscription:', user.subscriptions[0] ? {
      id: user.subscriptions[0].id,
      planCode: user.subscriptions[0].planCode,
      hoursUsed: user.subscriptions[0].hoursUsed,
      status: user.subscriptions[0].status
    } : 'None');
    
    // Check sessions and accumulated hours
    const sessions = await prisma.boostSession.findMany({
      where: { userId: user.id },
      include: { 
        games: { include: { game: true } }
      }
    });
    
    let totalSeconds = 0;
    sessions.forEach(s => {
      console.log(`Session ${s.id}: ${s.status}`);
      s.games.forEach(g => {
        console.log(`  - ${g.game?.name || 'Unknown'} (appId: ${g.appId}): ${g.secondsAccumulated} seconds = ${(g.secondsAccumulated / 3600).toFixed(2)} hours`);
        totalSeconds += g.secondsAccumulated || 0;
      });
    });
    
    console.log(`\nTotal accumulated seconds: ${totalSeconds}`);
    console.log(`Total accumulated hours: ${(totalSeconds / 3600).toFixed(2)}`);
    
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
