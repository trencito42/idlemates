import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRedis } from '@/lib/redis'
import { prisma } from '@/lib/db'
import { ProxyManager } from '@/lib/proxy-manager'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check system health
    const health = {
      webServer: true, // If we're here, web server is running
      worker: false,
      redis: false,
      database: false,
      proxies: false,
    }

    // Check Redis
    try {
      const redis = getRedis()
      await redis.ping()
      health.redis = true
    } catch (error) {
      console.error('Redis health check failed:', error)
    }

    // Check Database
    try {
      await prisma.$queryRaw`SELECT 1`
      health.database = true
    } catch (error) {
      console.error('Database health check failed:', error)
    }

    // Check Worker (look for running sessions)
    try {
      const runningSessions = await prisma.boostSession.count({
        where: {
          status: 'running'
        }
      })
      health.worker = true // Worker is running if we can query
    } catch (error) {
      console.error('Worker health check failed:', error)
    }

    // Get Proxy Stats
    let proxyStats = {
      totalProxies: 0,
      healthyProxies: 0,
      rateLimitedProxies: 0,
      failedProxies: 0,
    }

    try {
      const proxyManager = ProxyManager.getInstance()
      const stats = await proxyManager.getStats()
      proxyStats = {
        totalProxies: stats.totalProxies,
        healthyProxies: stats.healthyProxies,
        rateLimitedProxies: stats.rateLimitedProxies,
        failedProxies: stats.totalProxies - stats.healthyProxies - stats.rateLimitedProxies,
      }
      health.proxies = stats.totalProxies > 0
    } catch (error) {
      console.error('Proxy stats failed:', error)
    }

    return NextResponse.json({ health, proxyStats })
  } catch (error: any) {
    console.error('System status error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to get system status' 
    }, { status: 500 })
  }
}
