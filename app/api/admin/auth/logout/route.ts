import { NextResponse } from 'next/server'
import { clearAdminSessionCookie } from '@/src/auth/adminSession'

export async function POST() {
  await clearAdminSessionCookie()
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 })
  return res
}
