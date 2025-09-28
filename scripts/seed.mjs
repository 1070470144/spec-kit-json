import { PrismaClient } from '@prisma/client'
import crypto from 'node:crypto'

function hashPassword(password) {
  const ITERATIONS = 100_000
  const KEYLEN = 32
  const DIGEST = 'sha256'
  const salt = crypto.randomBytes(16)
  const derived = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST)
  return `${ITERATIONS}.${salt.toString('hex')}.${derived.toString('hex')}`
}

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@example.com'
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash: hashPassword('admin123'), status: 'active' }
  })

  const contentStr = JSON.stringify({ name: 'botc-demo' })
  await prisma.script.create({
    data: {
      title: 'demo-script',
      authorName: 'seed',
      versions: { create: { content: contentStr, contentHash: String(contentStr.length), schemaValid: true, version: 1 } }
    }
  })

  console.log('Seed done:', { admin: admin.email })
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
