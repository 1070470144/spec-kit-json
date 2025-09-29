import { ok } from '@/src/api/http'
import { clearSessionCookie } from '@/src/auth/session'

export async function POST() {
  clearSessionCookie()
  return ok(true)
}


