import { NextResponse, NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/admin')) {
    // 允许未登录访问登录页，避免自我重定向
    if (pathname === '/admin/login') {
      const token = req.cookies.get('admin_session')?.value
      if (token) {
        const url = req.nextUrl.clone()
        url.pathname = '/admin/review'
        return NextResponse.redirect(url)
      }
      return NextResponse.next()
    }
    const token = req.cookies.get('admin_session')?.value
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
