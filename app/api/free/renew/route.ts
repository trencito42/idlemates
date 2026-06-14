import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export async function POST() {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const bal = await prisma.freePlanBalance.findUnique({ where: { userId } })

  if (!bal) {
    // Initialize free balance
    const created = await prisma.freePlanBalance.create({ data: { userId, hoursLeft: 100 } })
    return NextResponse.json({ ok: true, hoursLeft: created.hoursLeft, renewed: true })
  }

  if (bal.hoursLeft > 0) {
    return NextResponse.json({ error: 'You can renew only when you have 0 hours left.' }, { status: 400 })
  }

  const updated = await prisma.freePlanBalance.update({ where: { userId }, data: { hoursLeft: 100 } })
  return NextResponse.json({ ok: true, hoursLeft: updated.hoursLeft, renewed: true })
}
