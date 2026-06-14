import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function POST() {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const me = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Log the end of impersonation (TODO: implement audit logging)
  console.log(`Admin ${session.user.id} stopped impersonating`)

  return NextResponse.json({ ok: true })
}
