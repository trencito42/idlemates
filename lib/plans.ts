import { prisma } from './db'

export type PlanInfo = {
  code: 'free' | 'basic' | 'pro' | 'ultra'
  maxConcurrentGames: number
  hourlyCap: number
  features: Record<string, any>
}

const DEFAULTS: Record<PlanInfo['code'], Omit<PlanInfo, 'code'>> = {
  free: { 
    maxConcurrentGames: 1, 
    hourlyCap: 100, 
    features: { 
      manualRenewal: true,
      aes256Security: true,
      fullDashboard: true,
      emailSupport: true,
      chatHistory: true
    } 
  },
  basic: { 
    maxConcurrentGames: 6, 
    hourlyCap: 500, 
    features: { 
      unlimitedHours: true,
      autoRenew: true,
      aes256Security: true,
      realtimeDashboard: true,
      prioritySupport: true,
      smartPause: true,
      cancelAnytime: true,
      chatHistory: true,
      customStatusMessages: true,
      appearOnline: true,
      autoRestart: true,
      autoAcceptFriends: true
    } 
  },
  pro: { 
    maxConcurrentGames: 12, 
    hourlyCap: 1000, 
    features: { 
      unlimitedHours: true,
      autoRenew: true,
      aes256Security: true,
      realtimeDashboard: true,
      priority247Support: true,
      smartPause: true,
      cancelAnytime: true,
      advancedAnalytics: true,
      apiWebhook: true,
      chatHistory: true,
      customStatusMessages: true,
      priorityQueue: true,
      appearOnline: true,
      autoRestart: true,
      autoAcceptFriends: true
    } 
  },
  ultra: { 
    maxConcurrentGames: 24, 
    hourlyCap: 2000, 
    features: { 
      unlimitedHours: true,
      autoRenew: true,
      aes256Security: true,
      realtimeDashboard: true,
      dedicated247Support: true,
      smartPause: true,
      cancelAnytime: true,
      advancedAnalytics: true,
      apiWebhook: true,
      prioritySessions: true,
      uptimeSla99: true,
      chatHistory: true,
      customStatusMessages: true,
      dedicatedProxyPool: true,
      appearOnline: true,
      autoRestart: true,
      priorityQueue: true,
      autoAcceptFriends: true
    } 
  },
}

export async function resolvePlanForUser(userId: string): Promise<PlanInfo> {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: { in: ['ACTIVE', 'APPROVAL_PENDING', 'TRIAL'] } },
    select: {
      plan: {
        select: {
          code: true,
          maxConcurrentGames: true,
          hourlyCap: true,
          featuresJson: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!sub || !sub.plan) return { code: 'free', ...DEFAULTS.free }
  const code = (sub.plan.code as PlanInfo['code']) || 'free'
  const max = sub.plan.maxConcurrentGames ?? DEFAULTS[code].maxConcurrentGames
  const hourlyCap = sub.plan.hourlyCap ?? DEFAULTS[code].hourlyCap
  let features: Record<string, any> = DEFAULTS[code].features
  try {
    if (sub.plan.featuresJson) {
      features = JSON.parse(sub.plan.featuresJson)
    }
  } catch {}
  return { code, maxConcurrentGames: max, hourlyCap, features }
}
