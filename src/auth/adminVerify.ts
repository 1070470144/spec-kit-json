import crypto from 'crypto'

const SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret'
const ALG = 'sha256'

export type AdminSessionPayload = { userId: string; email: string; role: 'admin'; exp: number }

export function verifyAdminSessionToken(token: string | undefined): AdminSessionPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts
  const expected = crypto.createHmac(ALG, SECRET).update(body).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as AdminSessionPayload
  if (payload.exp < Math.floor(Date.now() / 1000)) return null
  if (payload.role !== 'admin') return null
  return payload
}
