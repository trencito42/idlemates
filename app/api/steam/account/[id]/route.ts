import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enqueueJob } from '@/lib/queue'

export const dynamic = 'force-dynamic'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accountId = params.id
    const steamAccount = await prisma.steamAccount.findUnique({
      where: { id: accountId }
    })

    if (!steamAccount || steamAccount.userId !== session.user.id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Stop any active boost sessions for this account first
    await prisma.boostSession.updateMany({
      where: { steamAccountId: accountId, status: 'running' },
      data: { status: 'stopped', pausedAt: new Date() }
    })

    // Signal the worker to stop the session if it's running
    try {
      await enqueueJob('stop', { 
        userId: session.user.id, 
        steamAccountId: accountId 
      })
    } catch (e) {
      console.error('Failed to enqueue stop job during deletion:', e)
    }

    // Delete related data first
    await prisma.$transaction([
      prisma.chatMessage.deleteMany({ where: { steamAccountId: accountId } }),
      prisma.boostSessionGame.deleteMany({
        where: { session: { steamAccountId: accountId } }
      }),
      prisma.boostSession.deleteMany({ where: { steamAccountId: accountId } }),
      prisma.eventLog.deleteMany({ where: { steamAccountId: accountId } }),
      prisma.steamAccount.delete({ where: { id: accountId } })
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting steam account:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accountId = params.id
    const body = await req.json().catch(() => ({}))
    
    // Validate that the account belongs to the user
    const steamAccount = await prisma.steamAccount.findUnique({
      where: { id: accountId }
    })

    if (!steamAccount || steamAccount.userId !== session.user.id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Update settings
    const updated = await prisma.steamAccount.update({
      where: { id: accountId },
      data: {
        appearOnline: body.appearOnline,
        hideRecentActivity: body.hideRecentActivity,
        autoRestart: body.autoRestart,
        autoAcceptFriends: body.autoAcceptFriends,
        chatHistory: body.chatHistory,
        customAwayMessage: body.customAwayMessage,
        customInGameTitle: body.customInGameTitle
      }
    })

    // If the account has an active session, signal the worker to reload settings
    const activeSession = await prisma.boostSession.findFirst({
      where: { steamAccountId: accountId, status: 'running' }
    })

    if (activeSession) {
      await enqueueJob('reload_settings', {
        userId: session.user.id,
        steamAccountId: accountId
      })
    }

    return NextResponse.json({ ok: true, account: updated })
  } catch (error) {
    console.error('Error updating steam account settings:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

