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

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      subscription: {
        include: {
          user: { select: { email: true } },
          plan: { select: { name: true } }
        }
      }
    }
  })

  return NextResponse.json({ payments })
}
