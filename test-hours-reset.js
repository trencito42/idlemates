const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testHoursReset() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'claudiucatalin28@gmail.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('🧪 Testing hours reset functionality...\n');

    // 1. Grant Basic plan with some used hours
    console.log('1. Granting Basic plan...');
    await fetch('http://localhost:3699/api/admin/grant-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'claudiucatalin28@gmail.com', planCode: 'basic', duration: 30 })
    });

    // Manually set some used hours to simulate usage
    const basicSub = await prisma.subscription.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });

    if (basicSub) {
      await prisma.subscription.update({
        where: { id: basicSub.id },
        data: { hoursUsed: 150.5 } // Simulate 150.5 hours used
      });
      console.log(`   ✓ Set hoursUsed to 150.5 on Basic plan`);
    }

    // Check current state
    const afterBasic = await prisma.subscription.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { plan: true }
    });
    console.log(`   📊 Current: ${afterBasic.plan.name} plan with ${afterBasic.hoursUsed} hours used\n`);

    // 2. Upgrade to Pro plan (should reset hours)
    console.log('2. Upgrading to Pro plan...');
    await fetch('http://localhost:3699/api/admin/grant-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'claudiucatalin28@gmail.com', planCode: 'pro', duration: 30 })
    });

    // Check if hours were reset
    const afterPro = await prisma.subscription.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { plan: true }
    });
    console.log(`   📊 After upgrade: ${afterPro.plan.name} plan with ${afterPro.hoursUsed} hours used`);

    if (afterPro.hoursUsed === 0) {
      console.log('   ✅ SUCCESS: Hours were reset to 0 after upgrade!');
    } else {
      console.log('   ❌ FAIL: Hours were NOT reset after upgrade');
    }

    console.log('\n3. Upgrading to Ultra plan...');
    // Set some hours again
    await prisma.subscription.update({
      where: { id: afterPro.id },
      data: { hoursUsed: 87.3 }
    });
    console.log('   📝 Set 87.3 hours used on Pro plan');

    // Upgrade to Ultra
    await fetch('http://localhost:3699/api/admin/grant-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'claudiucatalin28@gmail.com', planCode: 'ultra', duration: 30 })
    });

    const afterUltra = await prisma.subscription.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { plan: true }
    });
    console.log(`   📊 After upgrade: ${afterUltra.plan.name} plan with ${afterUltra.hoursUsed} hours used`);

    if (afterUltra.hoursUsed === 0) {
      console.log('   ✅ SUCCESS: Hours were reset to 0 after upgrade to Ultra!');
    } else {
      console.log('   ❌ FAIL: Hours were NOT reset after upgrade to Ultra');
    }

  } finally {
    await prisma.$disconnect();
  }
}

testHoursReset();
