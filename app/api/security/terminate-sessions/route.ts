import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { token } = await req.json()
    
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }
    
    // For simplicity, we'll use a basic approach here since the token is temporary
    // In a production setup, you'd want to use proper envelope encryption
    let tokenData
    try {
      // For now, just use base64 decode (in production, use proper encryption)
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      tokenData = JSON.parse(decoded)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }
    
    const { userId, timestamp } = tokenData
    
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized to terminate this user\'s sessions' }, { status: 403 })
    }
    
    // Check if token is not too old (24 hours max)
    if (!userId || !timestamp || (Date.now() - timestamp) > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Token expired or invalid' }, { status: 400 })
    }
    
    // Terminate all sessions for this user
    const deletedSessions = await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId } }),
      prisma.deviceSession.deleteMany({ where: { userId } })
    ])
    
    // Log the security action
    await prisma.eventLog.create({
      data: {
        userId,
        type: 'security.sessions.terminated_via_email',
        json: {
          method: 'not_me_email_link',
          deletedSessions: deletedSessions[0].count,
          deletedDeviceSessions: deletedSessions[1].count,
          timestamp: new Date().toISOString()
        } as any
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'All sessions terminated successfully',
      deletedSessions: deletedSessions[0].count + deletedSessions[1].count
    })
    
  } catch (error) {
    console.error('Session termination error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
