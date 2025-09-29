import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { parseJson } from '@/src/api/validate'
import { ok } from '@/src/api/http'

const schema = z.object({ email: z.string().email(), code: z.string().length(6) })

export async function POST(req: Request) {
  const parsed = await parseJson(req, schema)
  if (!parsed.ok) return parsed.res
  const { email, code } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return ok({})
  const vt = await (prisma as any)["verificationToken"].findUnique({ where: { token: code } })
  if (!vt || vt.userId !== user.id) return ok({ ok: false, code: 'INVALID_CODE' })
  if (vt.expiresAt < new Date()) return ok({ ok: false, code: 'EXPIRED' })
  await prisma.$transaction([
    prisma.user.update({ where: { id: vt.userId }, data: { emailVerifiedAt: new Date() as any } as any }),
    (prisma as any)["verificationToken"].delete({ where: { token: code } })
  ])
  return ok({ ok: true })
}
