// Usage:
//   FROM_EMAIL="user@example.com" TO_EMAIL="admin@xueran.local" node scripts/transferOwnership.mjs
// If env not provided, will default to FROM_EMAIL='2712439942@qq.com', TO_EMAIL='admin@xueran.local'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const FROM_EMAIL = process.env.FROM_EMAIL || '2712439942@qq.com'
const TO_EMAIL = process.env.TO_EMAIL || 'admin@xueran.local'

try {
  const from = await prisma.user.findUnique({ where: { email: FROM_EMAIL }, select: { id: true, email: true } })
  const to = await prisma.user.findUnique({ where: { email: TO_EMAIL }, select: { id: true, email: true } })
  if (!from) {
    console.error(`[ERR] 源用户不存在: ${FROM_EMAIL}`)
    process.exit(1)
  }
  if (!to) {
    console.error(`[ERR] 目标用户不存在: ${TO_EMAIL}`)
    process.exit(1)
  }

  const res = await prisma.script.updateMany({ where: { createdById: from.id }, data: { createdById: to.id } })
  console.log(`[OK] 已移交剧本数: ${res.count}  从 ${FROM_EMAIL} → ${TO_EMAIL}`)
} catch (e) {
  console.error('[ERR] 运行失败:', e)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}


