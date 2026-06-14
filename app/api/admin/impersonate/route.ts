import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const me = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const targetUserId = body.userId as string
  if (!targetUserId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    // Log the impersonation for audit purposes (TODO: implement audit logging)
  console.log(`Admin ${session.user.id} impersonating user ${targetUserId}`)

  return NextResponse.json({ ok: true })
}
