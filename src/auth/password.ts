import crypto from 'node:crypto'

const ITERATIONS = 100_000
const KEYLEN = 32
const DIGEST = 'sha256'

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const derived = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST)
  return `${ITERATIONS}.${salt.toString('hex')}.${derived.toString('hex')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [iterStr, saltHex, hashHex] = stored.split('.')
  const iterations = Number(iterStr)
  const salt = Buffer.from(saltHex, 'hex')
  const expected = Buffer.from(hashHex, 'hex')
  const derived = crypto.pbkdf2Sync(password, salt, iterations, expected.length, DIGEST)
  return crypto.timingSafeEqual(derived, expected)
}
