import { prisma } from '@/lib/db'
import { getRedis } from '@/lib/redis'

export async function ensureRecent2FA(userId: string, maxAgeSec = 300) {
  const redis = getRedis()
  const key = `2fa:recent:${userId}`
  const mark = await redis.get(key)
  if (mark === '1') return true
  // Fallback: check last2FAAt within maxAgeSec
  const user = (await prisma.user.findUnique({ where: { id: userId } })) as any
  if (!user?.last2FAAt) return false
  const age = (Date.now() - new Date(user.last2FAAt).getTime()) / 1000
  return age <= maxAgeSec
}
