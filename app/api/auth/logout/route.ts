import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/src/auth/session'

export async function POST() {
  clearSessionCookie()
  const res = NextResponse.json({ ok: true })
  res.cookies.set('session', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 })
  return res
}
