import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRedis } from '@/lib/redis'
import { sessionQueue } from '@/lib/queue'
import crypto from 'crypto'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  action: z.enum(['start', 'check', 'cancel']),
  sessionId: z.string().optional()
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { action, sessionId } = parsed.data
    const redis = getRedis()

    if (action === 'start') {
      const newSessionId = crypto.randomBytes(16).toString('hex')
      
      // Initialize QR session in Redis
      await redis.set(`qr:${newSessionId}`, JSON.stringify({
        status: 'starting',
        userId,
        createdAt: Date.now()
      }), 'EX', 300) // 5 minutes TTL

      // Enqueue job for worker to start QR process
      await sessionQueue.add('session', {
        userId,
        sessionId: newSessionId,
        action: 'qr-login'
      })

      return NextResponse.json({ sessionId: newSessionId })
    }

    if (action === 'check') {
      if (!sessionId) return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
      
      const data = await redis.get(`qr:${sessionId}`)
      if (!data) return NextResponse.json({ status: 'timeout' })
      
      return NextResponse.json(JSON.parse(data))
    }

    if (action === 'cancel') {
      if (sessionId) {
        await redis.del(`qr:${sessionId}`)
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in QR login API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
