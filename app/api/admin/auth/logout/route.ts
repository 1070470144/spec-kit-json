import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/src/auth/session'

export async function POST() {
  // 统一使用session，只需清除一个cookie
  await clearSessionCookie()
  
  return NextResponse.json({ ok: true })
}
