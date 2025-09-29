import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { parseJson } from '@/src/api/validate'
import { ok, notFound, badRequest, unauthorized } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

const schema = z.object({ decision: z.enum(['approved','rejected']), reason: z.string().min(1).optional() })

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = await parseJson(req, schema)
  if (!parsed.ok) return parsed.res
  const { decision, reason } = parsed.data

  // 权限与身份
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  if (decision === 'rejected' && !reason) return badRequest('REASON_REQUIRED')

  const { id } = await context.params
  const s = await prisma.script.findUnique({ where: { id } })
  if (!s) return notFound()
  if (s.state !== 'pending') return badRequest('INVALID_STATE')

  const updated = await prisma.$transaction(async (tx) => {
    await tx.review.create({ data: { scriptId: s.id, reviewerId: admin.userId, decision, reason } })
    return tx.script.update({
      where: { id: s.id },
      data: { state: decision === 'approved' ? 'published' : 'rejected', publishedAt: decision === 'approved' ? new Date() : null },
      select: { id: true, state: true }
    })
  })
  return ok(updated)
}
