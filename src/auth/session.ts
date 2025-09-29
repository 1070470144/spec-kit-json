import crypto from 'node:crypto'
import { cookies } from 'next/headers'

const SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret'
const ALG = 'sha256'
const COOKIE_NAME = 'session'

export type SessionPayload = { userId: string; email: string; role: 'admin' | 'user'; exp: number }

export function signSession(payload: Omit<SessionPayload, 'exp'>, ttlSeconds = 7 * 24 * 3600): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url')
  const sig = crypto.createHmac(ALG, SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}
export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts
  const expected = crypto.createHmac(ALG, SECRET).update(body).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload
  if (payload.exp < Math.floor(Date.now() / 1000)) return null
  return payload
}
export async function setSessionCookie(token: string) {
  (await cookies()).set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 3600 })
}
export async function clearSessionCookie() { (await cookies()).set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 }) }
export async function getSession(): Promise<SessionPayload | null> { return verifySessionToken((await cookies()).get(COOKIE_NAME)?.value) }
