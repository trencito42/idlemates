import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      select: {
        code: true,
        name: true,
        price: true,
        maxConcurrentGames: true,
        hourlyCap: true,
        featuresJson: true,
        discountAmount: true,
        discountUntil: true,
      },
      orderBy: { price: 'asc' },
    })
    return NextResponse.json({ plans })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load plans' }, { status: 500 })
  }
}
