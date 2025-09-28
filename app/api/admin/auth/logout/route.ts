import { NextResponse } from 'next/server'
import { clearAdminSessionCookie } from '@/src/auth/adminSession'

export async function POST() {
  clearAdminSessionCookie()
  return NextResponse.json({ ok: true })
}
