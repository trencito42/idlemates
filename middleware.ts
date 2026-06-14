import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

function getIp(req: NextRequest) {
  const fwd = req.headers.get('x-forwarded-for') || ''
  const ip = fwd.split(',')[0]?.trim() || req.headers.get('x-real-ip') || ''
  return ip
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.sub) return res
  
  // Persist deviceId in cookie so API can use for ping logic
  if (!req.cookies.get('did')?.value) {
    const deviceId = crypto.randomUUID()
    res.cookies.set('did', deviceId, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 60 * 60 * 24 * 365 })
  }
  return res
}

export const config = {
  matcher: [
    '/app/:path*',
    '/api/:path*'
  ]
}
