import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const db = prisma as any
    const post = await db.newsPost.update({ where: { id: params.id }, data: body })
    return NextResponse.json({ post })
  } catch (e: any) {
    console.error('PATCH /api/admin/news/:id error', e)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const db = prisma as any
    await db.newsPost.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('DELETE /api/admin/news/:id error', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
