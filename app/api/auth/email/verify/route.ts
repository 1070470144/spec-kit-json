import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { parseJson } from '@/src/api/validate'
import { ok, badRequest } from '@/src/api/http'
import { hashPassword } from '@/src/auth/password'

const schema = z.object({ email: z.string().email(), code: z.string().length(6) })

export async function POST(req: Request) {
  const parsed = await parseJson(req, schema)
  if (!parsed.ok) return parsed.res
  const { email, code } = parsed.data
  // 读取待注册记录
  const pr = await (prisma as any)["pendingRegistration"].findUnique({ where: { email } })
  if (!pr) return badRequest('NO_PENDING')
  if (pr.code !== code) return badRequest('INVALID_CODE')
  if (pr.expiresAt < new Date()) return badRequest('CODE_EXPIRED')
  // 创建正式用户并清理 pending
  await prisma.$transaction(async (tx) => {
    await tx.user.create({ data: { email: pr.email, passwordHash: pr.passwordHash, nickname: pr.nickname ?? null, status: 'active', emailVerifiedAt: new Date() } as any })
    await (tx as any)["pendingRegistration"].delete({ where: { email: pr.email } })
  })
  return ok({ ok: true })
}
