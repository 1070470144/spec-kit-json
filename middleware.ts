import { NextResponse, NextRequest } from 'next/server'
import { verifyAdminSessionToken } from './src/auth/adminVerify'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('admin_session')?.value
    const payload = verifyAdminSessionToken(token)
    if (!payload) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
