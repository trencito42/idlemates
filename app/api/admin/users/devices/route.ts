import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId') || ''
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  const p: any = prisma as any
  const devices = await p.deviceSession.findMany({ where: { userId }, orderBy: { lastSeenAt: 'desc' } })
  return NextResponse.json({ devices })
}

export async function DELETE(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const p: any = prisma as any
  const { id } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await p.deviceSession.delete({ where: { id } }).catch(() => null)
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const p: any = prisma as any
  const { id, trusted } = await req.json().catch(() => ({}))
  if (!id || typeof trusted !== 'boolean') return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  await p.deviceSession.update({ where: { id }, data: { trusted } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
