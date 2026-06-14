import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { enqueueJob } from '@/lib/queue'

// Force dynamic
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { steamAccountId } = await req.json()

    if (!steamAccountId) {
      return NextResponse.json({ error: 'Missing steamAccountId' }, { status: 400 })
    }

    // Verify ownership
    const steamAccount = await prisma.steamAccount.findFirst({
      where: {
        id: steamAccountId,
        userId: user.id
      }
    })

    if (!steamAccount) {
      return NextResponse.json({ error: 'Steam account not found' }, { status: 404 })
    }

    // Get the running session
    const runningSession = await prisma.boostSession.findFirst({
      where: {
        userId: user.id,
        steamAccountId,
        status: 'running'
      }
    })

    if (!runningSession) {
      return NextResponse.json({ 
        message: 'No running session to reload. Settings will apply on next start.' 
      })
    }

    // Queue a reload job
    await enqueueJob('reload_settings', {
      userId: user.id,
      steamAccountId
    })

    return NextResponse.json({ 
      ok: true,
      message: 'Settings reload queued. Changes will apply within a few seconds.' 
    })

  } catch (error) {
    console.error('Error reloading settings:', error)
    return NextResponse.json(
      { error: 'Failed to reload settings' },
      { status: 500 }
    )
  }
}
