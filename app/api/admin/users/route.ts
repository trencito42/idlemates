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

  const usersRaw: any = await (prisma as any).user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      twoFactorEnabled: true,
      totpSecretEnc: true,
      last2FAAt: true,
      subscriptions: {
        where: {
          status: { in: ['ACTIVE', 'TRIAL'] }
        },
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          currentPeriodEnd: true,
          plan: {
            select: {
              code: true
            }
          }
        }
      },
      _count: {
        select: {
          sessions: true,
          payments: true,
        }
      }
    }
  })
  // Augment with deviceSessions count (separate query to avoid type friction)
  const users = await Promise.all((usersRaw as any[]).map(async (u) => {
    const dc = await (prisma as any).deviceSession.count({ where: { userId: u.id } })
    return { ...u, _count: { ...u._count, deviceSessions: dc } }
  }))

  // Transform the data
  const transformedUsers = users.map((user: any) => {
    const subscription = user.subscriptions[0]
    // Derive 2FA enabled from secret presence to avoid stale flag mismatches
    const twoFactorEnabled = Boolean(user.twoFactorEnabled || user.totpSecretEnc)
    const out = {
      ...user,
      twoFactorEnabled,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        planCode: subscription.plan.code,
        currentPeriodEnd: subscription.currentPeriodEnd
      } : undefined,
      subscriptions: undefined,
      totpSecretEnc: undefined,
    }
    return out
  })

  return NextResponse.json({ users: transformedUsers })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { userId, role, email, banned, banReason } = await req.json()
  const data: any = {}
  if (role) data.role = role
  if (email) data.email = email
  if (typeof banned === 'boolean') data.banned = banned
  if (typeof banReason === 'string') data.banReason = banReason || null

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: userId },
    data
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { userId } = await req.json()
  
  await prisma.user.delete({ where: { id: userId } })

  return NextResponse.json({ success: true })
}
