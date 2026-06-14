import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const adminId = (session.user as any).id
    const result = await (prisma as any).newsPost.updateMany({
      data: { authorId: adminId },
    })
    return NextResponse.json({ updated: result.count })
  } catch (e: any) {
    console.error('POST /api/admin/news/backfill-authors error', e)
    return NextResponse.json({ error: 'Failed to backfill' }, { status: 500 })
  }
}
