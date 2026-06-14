import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ensureRecent2FA } from '@/lib/2faGuard'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        steamAccounts: true,
        sessions: {
          where: {
            status: 'running'
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Require recent 2FA verification for destructive action
    const ok2fa = await ensureRecent2FA(user.id)
    if (!ok2fa) {
      return NextResponse.json({ error: 'Two-factor authentication required', require2FA: true }, { status: 403 })
    }

    // Stop any running sessions first
    const runningBoostSessions = user.sessions
    if (runningBoostSessions.length > 0) {
      await prisma.boostSession.updateMany({
        where: {
          userId: user.id,
          status: 'running'
        },
        data: {
          status: 'stopped',
          pausedAt: new Date()
        }
      })
    }

    // Delete related records in correct order to handle foreign key constraints
    await prisma.$transaction([
      // Delete chat messages first (references steam accounts)
      prisma.chatMessage.deleteMany({
        where: {
          steamAccount: {
            userId: user.id
          }
        }
      }),

      // Delete free plan balance
      prisma.freePlanBalance.deleteMany({
        where: { userId: user.id }
      }),

      // Delete password reset tokens
      prisma.passwordResetToken.deleteMany({
        where: { userId: user.id }
      }),

      // Delete auth accounts (OAuth/Social logins)
      prisma.account.deleteMany({
        where: { userId: user.id }
      }),

      // Delete session games
      prisma.boostSessionGame.deleteMany({
        where: {
          session: {
            userId: user.id
          }
        }
      }),

      // Delete boost sessions
      prisma.boostSession.deleteMany({
        where: { userId: user.id }
      }),

      // Delete steam accounts
      prisma.steamAccount.deleteMany({
        where: { userId: user.id }
      }),

      // Delete all sessions
      prisma.session.deleteMany({
        where: { userId: user.id }
      }),

      // Delete payments
      prisma.payment.deleteMany({
        where: { userId: user.id }
      }),

      // Delete subscriptions 
      prisma.subscription.deleteMany({
        where: { userId: user.id }
      }),

      // Delete event logs
      prisma.eventLog.deleteMany({
        where: { userId: user.id }
      }),

      // Delete payments
      prisma.payment.deleteMany({
        where: { userId: user.id }
      }),

      // Delete subscriptions
      prisma.subscription.deleteMany({
        where: { userId: user.id }
      }),

      // Finally delete the user
      prisma.user.delete({
        where: { id: user.id }
      })
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account. Please try again or contact support.' },
      { status: 500 }
    )
  }
}
