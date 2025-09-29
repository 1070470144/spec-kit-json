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
  // roles
  const [rSuper, rAdmin, rUser] = await Promise.all([
    prisma.role.upsert({ where: { key: 'superuser' }, update: {}, create: { key: 'superuser', name: '超级用户', permissionsJson: '{}' } }),
    prisma.role.upsert({ where: { key: 'admin' }, update: {}, create: { key: 'admin', name: '管理员', permissionsJson: '{}' } }),
    prisma.role.upsert({ where: { key: 'user' }, update: {}, create: { key: 'user', name: '用户', permissionsJson: '{}' } }),
  ])

  // 设置一个更复杂的超级管理员账号
  const adminEmail = 'admin@xueran.local'
  const adminPassword = 'A1d$Min_2025!xr9S'
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { status: 'active' },
    create: { email: adminEmail, passwordHash: hashPassword(adminPassword), status: 'active' }
  })
  // bind roles to admin
  await prisma.user.update({
    where: { id: admin.id },
    data: {
      roles: { set: [{ id: rSuper.id }, { id: rAdmin.id }, { id: rUser.id }] }
    }
  })

  // 默认系统配置：发送邮箱
  const mailDefaults = [
    { key: 'smtp.host', value: 'smtp.qq.com' },
    { key: 'smtp.port', value: '465' },
    { key: 'smtp.user', value: '1070470144@qq.com' },
    { key: 'smtp.pass', value: 'ttcrvmnndyiqbdig' },
    { key: 'mail.from', value: '1070470144@qq.com' },
  ]
  for (const m of mailDefaults) {
    await prisma.systemConfig.upsert({
      where: { key: m.key },
      update: { value: m.value },
      create: { key: m.key, value: m.value },
    })
  }

  const contentStr = JSON.stringify({ name: 'botc-demo' })
  await prisma.script.create({
    data: {
      title: 'demo-script',
      authorName: 'seed',
      versions: { create: { content: contentStr, contentHash: String(contentStr.length), schemaValid: true, version: 1 } }
    }
  })

  console.log('Seed done:', { admin: admin.email, password: adminPassword, roles: ['superuser','admin','user'], mailDefaults })
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
