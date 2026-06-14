const { getRedis } = require('./lib/redis.ts');

async function main() {
  const redis = getRedis();
  
  console.log('Stopping session...');
  await redis.lpush('bull:sessionQueue:waiting', JSON.stringify({
    id: Date.now(),
    data: {
      action: 'stop',
      userId: 'cmgu62osr0000h3o72lnncdgk',
      steamAccountId: 'cmguxmqey0001ajd8mgpk1fli'
    }
  }));
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('Starting session with new logs...');
  await redis.lpush('bull:sessionQueue:waiting', JSON.stringify({
    id: Date.now() + 1,
    data: {
      action: 'start',
      userId: 'cmgu62osr0000h3o72lnncdgk',
      steamAccountId: 'cmguxmqey0001ajd8mgpk1fli'
    }
  }));
  
  console.log('Session restart queued');
  redis.disconnect();
}

main().catch(console.error);