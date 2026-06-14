const { getRedis } = require('./lib/redis.ts');

async function main() {
  const redis = getRedis();
  
  console.log('Triggering session restart...');
  
  // Add job to refresh the session with new plan settings
  await redis.lpush('bull:sessionQueue:waiting', JSON.stringify({
    id: Date.now(),
    data: {
      action: 'refresh',
      userId: 'cmgu62osr0000h3o72lnncdgk',
      steamAccountId: 'cmguxmqey0001ajd8mgpk1fli'
    },
    opts: {
      removeOnComplete: true,
      removeOnFail: true,
      attempts: 3
    }
  }));
  
  console.log('Refresh job queued successfully');
  
  redis.disconnect();
}

main().catch(console.error);