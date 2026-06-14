import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

type PlanCode = 'basic' | 'pro' | 'ultra'

export async function POST() {
  return NextResponse.json({ error: 'Deprecated. Use /api/billing/stripe/create-checkout-session' }, { status: 410 })
}
