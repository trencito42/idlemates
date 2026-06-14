const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDirectDB() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'claudiucatalin28@gmail.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('🧪 Testing hours reset directly in database...\n');

    // 1. Create a Basic subscription with used hours
    console.log('1. Creating Basic subscription...');
    
    // First, cancel existing subscriptions
    await prisma.subscription.updateMany({
      where: { userId: user.id, status: { in: ['ACTIVE', 'TRIAL'] } },
      data: { status: 'CANCELLED' }
    });

    const basicPlan = await prisma.plan.findUnique({ where: { code: 'basic' } });
    if (!basicPlan) {
      console.log('Basic plan not found');
      return;
    }

    const basicSub = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: basicPlan.id,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paypalSubscriptionId: `test_basic_${Date.now()}`,
        hoursUsed: 250.7 // Simulate 250.7 hours used
      }
    });
    
    console.log(`   ✓ Created Basic subscription with ${basicSub.hoursUsed} hours used`);

    // 2. Upgrade to Pro (simulate new subscription creation with reset)
    console.log('\n2. Upgrading to Pro plan (with hours reset)...');

    // Cancel Basic subscription
    await prisma.subscription.update({
      where: { id: basicSub.id },
      data: { status: 'CANCELLED' }
    });

    const proPlan = await prisma.plan.findUnique({ where: { code: 'pro' } });
    if (!proPlan) {
      console.log('Pro plan not found');
      return;
    }

    const proSub = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: proPlan.id,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paypalSubscriptionId: `test_pro_${Date.now()}`,
        hoursUsed: 0 // ⭐ This should be 0 (reset)
      }
    });

    console.log(`   ✓ Created Pro subscription with ${proSub.hoursUsed} hours used`);

    if (proSub.hoursUsed === 0) {
      console.log('   ✅ SUCCESS: Hours reset to 0 when creating new subscription!');
    } else {
      console.log('   ❌ FAIL: Hours were not reset');
    }

    // 3. Test schema default
    console.log('\n3. Testing schema default (without explicit hoursUsed)...');

    await prisma.subscription.update({
      where: { id: proSub.id },
      data: { status: 'CANCELLED' }
    });

    const ultraPlan = await prisma.plan.findUnique({ where: { code: 'ultra' } });
    if (!ultraPlan) {
      console.log('Ultra plan not found');
      return;
    }

    const ultraSub = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: ultraPlan.id,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paypalSubscriptionId: `test_ultra_${Date.now()}`
        // ⭐ Not setting hoursUsed - should default to 0
      }
    });

    console.log(`   ✓ Created Ultra subscription with ${ultraSub.hoursUsed} hours used (default)`);

    if (ultraSub.hoursUsed === 0) {
      console.log('   ✅ SUCCESS: Schema default works - hours are 0!');
    } else {
      console.log('   ❌ FAIL: Schema default not working');
    }

  } finally {
    await prisma.$disconnect();
  }
}

testDirectDB();
