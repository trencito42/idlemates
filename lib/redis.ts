import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedis() {
  if (!redis) {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
    redis = new Redis(url, {
      lazyConnect: true,
      connectTimeout: 1000,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    })

    redis.on('error', () => {
      // Redis is optional for public page rendering and auth fallbacks.
    })
  }

  return redis
}
