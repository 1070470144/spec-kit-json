import { NextResponse } from 'next/server'
import { clearAdminSessionCookie } from '@/src/auth/adminSession'

export async function POST() {
  // 清除管理员专用会话cookie
  await clearAdminSessionCookie()
  
  return NextResponse.json({ ok: true })
}
