import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const events = await prisma.webhookEvent.findMany({
    orderBy: { createdAt: 'desc' }
  })

  // Enrich webhook events with user information from event logs
  const enrichedEvents = await Promise.all(events.map(async (event) => {
    let userInfo = null
    
    try {
      // Look for related event logs that might contain userId
      const eventLog = await prisma.eventLog.findFirst({
        where: {
          type: { contains: event.source }
        }
      })
      
      if (eventLog?.userId) {
        const user = await prisma.user.findUnique({
          where: { id: eventLog.userId },
          select: {
            id: true,
            email: true
          }
        })
        
        if (user) {
          userInfo = {
            id: user.id,
            email: user.email
          }
        }
      }
    } catch (e) {
      // Ignore errors in enrichment
    }
    
    return {
      ...event,
      userInfo
    }
  }))

  return NextResponse.json({ events: enrichedEvents })
}
