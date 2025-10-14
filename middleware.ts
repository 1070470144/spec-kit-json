import { NextResponse, NextRequest } from 'next/server'

// Edge Runtime 兼容的 session payload 解析（不验证签名）
// 真正的安全验证在 API 层使用完整的 verifySessionToken
function parseSessionToken(token: string | undefined): { role?: string } | null {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null
    const [body] = parts
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
    // 检查是否过期
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/admin')) {
    // 允许未登录访问登录页，避免自我重定向
    if (pathname === '/admin/login') {
      const token = req.cookies.get('admin_session')?.value
      const session = parseSessionToken(token)
      // 如果已登录且是管理员，重定向到后台首页
      if (session && session.role === 'admin') {
        const url = req.nextUrl.clone()
        url.pathname = '/admin/review'
        return NextResponse.redirect(url)
      }
      return NextResponse.next()
    }
    
    // 检查 admin_session cookie，验证是否为管理员
    const token = req.cookies.get('admin_session')?.value
    const session = parseSessionToken(token)
    
    if (!session || session.role !== 'admin') {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
