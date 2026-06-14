import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const p: any = prisma as any
  const devices = await p.deviceSession.findMany({
    where: { userId: session.user.id },
    orderBy: { lastSeenAt: 'desc' },
    select: { id: true, deviceId: true, userAgent: true, ip: true, country: true, asn: true, trusted: true, createdAt: true, lastSeenAt: true }
  })
  return NextResponse.json({ devices })
}

export async function DELETE(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const p: any = prisma as any
  await p.deviceSession.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, trusted } = await req.json().catch(() => ({}))
  if (!id || typeof trusted !== 'boolean') return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  const p: any = prisma as any
  await p.deviceSession.updateMany({ where: { id, userId: session.user.id }, data: { trusted } })
  return NextResponse.json({ ok: true })
}
