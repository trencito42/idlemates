import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    // With columns migrated, return full plan fields including discounts
    const plans = await (prisma as any).plan.findMany({
      select: { id: true, code: true, name: true, price: true, maxConcurrentGames: true, hourlyCap: true, featuresJson: true, discountAmount: true, discountUntil: true }
    })
    return NextResponse.json({ plans })
  } catch (e: any) {
    // Fallback: return default in-memory plans so the Admin UI remains usable
    const fallback = [
      { id: 'basic', code: 'basic', name: 'Basic', price: 499, maxConcurrentGames: 6, hourlyCap: 500, featuresJson: '[]', discountAmount: null, discountUntil: null },
      { id: 'pro', code: 'pro', name: 'Pro', price: 999, maxConcurrentGames: 12, hourlyCap: 1000, featuresJson: '[]', discountAmount: null, discountUntil: null },
      { id: 'ultra', code: 'ultra', name: 'Ultra', price: 1499, maxConcurrentGames: 24, hourlyCap: 2000, featuresJson: '[]', discountAmount: null, discountUntil: null },
    ]
    return NextResponse.json({ plans: fallback })
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const body = await req.json().catch(() => null)
  if (!body?.code) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  const { code, name, price, maxConcurrentGames, hourlyCap, features, discountAmount, discountUntil } = body
  try {
    const updated = await (prisma as any).plan.upsert({
      where: { code },
      update: {
        name: name ?? undefined,
        price: typeof price === 'number' ? price : undefined,
        maxConcurrentGames: typeof maxConcurrentGames === 'number' ? maxConcurrentGames : undefined,
        hourlyCap: typeof hourlyCap === 'number' ? hourlyCap : undefined,
        featuresJson: Array.isArray(features) ? JSON.stringify(features) : undefined,
        // discount fields (best effort; may fail if columns are missing)
        discountAmount: typeof discountAmount === 'number' ? discountAmount : undefined,
        discountUntil: discountUntil ? new Date(discountUntil) : undefined,
      },
      create: {
        code,
        name: name || code,
        price: typeof price === 'number' ? price : 0,
        maxConcurrentGames: typeof maxConcurrentGames === 'number' ? maxConcurrentGames : 1,
        hourlyCap: typeof hourlyCap === 'number' ? hourlyCap : 100,
        featuresJson: JSON.stringify(Array.isArray(features) ? features : []),
        discountAmount: typeof discountAmount === 'number' ? discountAmount : null,
        discountUntil: discountUntil ? new Date(discountUntil) : null,
      }
    })
    return NextResponse.json({ plan: updated })
  } catch (err: any) {
    // Retry without discount fields if schema lacks columns
    const updated = await (prisma as any).plan.upsert({
      where: { code },
      update: {
        name: name ?? undefined,
        price: typeof price === 'number' ? price : undefined,
        maxConcurrentGames: typeof maxConcurrentGames === 'number' ? maxConcurrentGames : undefined,
        hourlyCap: typeof hourlyCap === 'number' ? hourlyCap : undefined,
        featuresJson: Array.isArray(features) ? JSON.stringify(features) : undefined,
      },
      create: {
        code,
        name: name || code,
        price: typeof price === 'number' ? price : 0,
        maxConcurrentGames: typeof maxConcurrentGames === 'number' ? maxConcurrentGames : 1,
        hourlyCap: typeof hourlyCap === 'number' ? hourlyCap : 100,
        featuresJson: JSON.stringify(Array.isArray(features) ? features : []),
      }
    })
    return NextResponse.json({ plan: { ...updated, discountAmount: null, discountUntil: null } })
  }
}
