import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Force dynamic for SSE
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 })
  }

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email } 
  })
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Create a readable stream for Server-Sent Events
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`retry: 5000\n`))
      controller.enqueue(encoder.encode(`event: connected\n`))
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`))
      
      // Poll for updates every 3 seconds
      const intervalId = setInterval(async () => {
        try {
          // Fetch latest session data
          const sessions = await prisma.boostSession.findMany({
            where: { userId: user.id },
            include: {
              games: {
                include: {
                  game: true
                }
              },
              steamAccount: true
            }
          })

          // Send update
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'update', 
              sessions 
            })}\n\n`)
          )
        } catch (error) {
          console.error('SSE error:', error)
        }
      }, 3000)

      // Heartbeat every 15 seconds to keep connections alive (especially behind proxies)
      const heartbeatId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: heartbeat\n`))
          controller.enqueue(encoder.encode(`data: {"ts": ${Date.now()}}\n\n`))
        } catch {}
      }, 15000)

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(intervalId)
        clearInterval(heartbeatId)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      // Allow same-origin and avoid buffering issues
      'X-Accel-Buffering': 'no'
    },
  })
}
