import crypto from 'crypto'
import { cookies } from 'next/headers'

const SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret'
const ALG = 'sha256'
const COOKIE_NAME = 'admin_session'

export type AdminSessionPayload = { userId: string; email: string; role: 'admin'; exp: number }

export function signAdminSession(payload: Omit<AdminSessionPayload, 'exp'>, ttlSeconds = 7 * 24 * 3600): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url')
  const sig = crypto.createHmac(ALG, SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}
export function verifyAdminSessionToken(token: string | undefined): AdminSessionPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts
  const expected = crypto.createHmac(ALG, SECRET).update(body).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as AdminSessionPayload
  if (payload.exp < Math.floor(Date.now() / 1000)) return null
  return payload
}
export async function setAdminSessionCookie(token: string) {
  (await cookies()).set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 3600 })
}
export async function clearAdminSessionCookie() { (await cookies()).set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 }) }
export async function getAdminSession(): Promise<AdminSessionPayload | null> { const token = (await cookies()).get(COOKIE_NAME)?.value; return verifyAdminSessionToken(token) }
