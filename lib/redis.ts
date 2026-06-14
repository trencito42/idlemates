import Redis from 'ioredis'

let redis: Redis | null = null as unknown as Redis

export function getRedis() {
  if (!redis) {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
    redis = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    })
  }
  return redis
}
