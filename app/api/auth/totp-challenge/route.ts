import { NextResponse } from 'next/server'
import { getRedis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const email = (url.searchParams.get('email') || '').trim().toLowerCase()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
    const redis = getRedis()
    const challenge = await redis.get(`2fa:challengeByEmail:${email}`)
    if (!challenge) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ challenge })
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
