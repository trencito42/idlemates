import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

const querySchema = z.object({
  steamAccountId: z.string(),
  fromSteamId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  before: z.coerce.number().optional() // Unix timestamp
})

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      include: {
        steamAccounts: true
      }
    })
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params
    const url = new URL(req.url)
    const params = Object.fromEntries(url.searchParams)
    const query = querySchema.safeParse(params)
    if (!query.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // Verify steam account belongs to user
    const steamAccount = user.steamAccounts.find(acc => acc.id === query.data.steamAccountId)
    if (!steamAccount) {
      return NextResponse.json({ error: 'Steam account not found' }, { status: 404 })
    }

    // Build query
    const where = {
      steamAccountId: query.data.steamAccountId,
      ...(query.data.fromSteamId ? { fromSteamId: query.data.fromSteamId } : {}),
      ...(query.data.before ? { timestamp: { lt: new Date(query.data.before * 1000) } } : {})
    }

    // Get messages
    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: query.data.limit,
      select: {
        id: true,
        fromSteamId: true,
        toSteamId: true,
        message: true,
        isOutbound: true,
        timestamp: true
      }
    })

    // Get unique Steam IDs - for outbound messages use toSteamId, for inbound use fromSteamId
    const steamIds = [...new Set(messages.map((m: { fromSteamId: string, toSteamId: string | null, isOutbound: boolean }) => 
      m.isOutbound ? m.toSteamId : m.fromSteamId
    ).filter(Boolean))]
    
    return NextResponse.json({
      messages: messages.map((m: { timestamp: Date, [key: string]: any }) => ({
        ...m,
        timestamp: Math.floor(m.timestamp.getTime() / 1000),
        // Add conversation partner ID for easier grouping
        conversationPartnerId: m.isOutbound ? m.toSteamId : m.fromSteamId
      })),
      steamIds
    })

  } catch (error) {
    console.error('Error fetching chat history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}