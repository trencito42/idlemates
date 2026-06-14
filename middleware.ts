import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

function needsAuth(pathname: string) {
  return pathname.startsWith('/app/') || pathname === '/app' || pathname.startsWith('/admin')
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (needsAuth(pathname)) {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.sub) {
      const login = new URL('/auth/login', req.url)
      login.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(login)
    }
  }

  const res = NextResponse.next()
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET })
  if (token?.sub && !req.cookies.get('did')?.value) {
    const deviceId = crypto.randomUUID()
    res.cookies.set('did', deviceId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
  }
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)',
  ],
}
