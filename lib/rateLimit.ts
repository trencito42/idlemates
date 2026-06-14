import { RateLimiterRedis } from 'rate-limiter-flexible'
import { getRedis } from './redis'

let limiter: RateLimiterRedis | null = null

export function getLimiter(points = 5, duration = 60) {
  if (!limiter) {
    limiter = new RateLimiterRedis({
      storeClient: getRedis(),
      points,
      duration,
      keyPrefix: 'rl'
    })
  }
  return limiter
}
