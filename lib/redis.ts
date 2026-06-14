import Redis from 'ioredis'

let redis: Redis | null = null
let queueRedis: Redis | null = null

function redisUrl() {
  return process.env.REDIS_URL || 'redis://127.0.0.1:6379'
}

export function getRedis() {
  if (!redis) {
    const hasRedisUrl = Boolean(process.env.REDIS_URL)
    redis = new Redis(redisUrl(), {
      lazyConnect: !hasRedisUrl,
      connectTimeout: hasRedisUrl ? 5000 : 1000,
      maxRetriesPerRequest: hasRedisUrl ? 3 : 1,
      enableReadyCheck: hasRedisUrl,
      enableOfflineQueue: hasRedisUrl,
      retryStrategy: hasRedisUrl ? (times) => Math.min(times * 200, 3000) : () => null,
    })

    redis.on('error', () => {
      // Redis is optional for public page rendering and auth fallbacks.
    })
  }

  return redis
}

/** BullMQ workers require maxRetriesPerRequest: null on the Redis connection. */
export function getQueueRedis() {
  if (!queueRedis) {
    queueRedis = new Redis(redisUrl(), {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })

    queueRedis.on('error', () => {})
  }

  return queueRedis
}
