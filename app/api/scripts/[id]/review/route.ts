import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { parseJson } from '@/src/api/validate'
import { ok, notFound, badRequest } from '@/src/api/http'

const schema = z.object({ decision: z.enum(['approved','rejected']), reason: z.string().optional() })

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const parsed = await parseJson(req, schema)
  if (!parsed.ok) return parsed.res
  const { decision, reason } = parsed.data

  const s = await prisma.script.findUnique({ where: { id: params.id } })
  if (!s) return notFound()
  if (s.state !== 'pending') return badRequest('INVALID_STATE')

  const updated = await prisma.$transaction(async (tx) => {
    await tx.review.create({ data: { scriptId: s.id, reviewerId: 'TODO', decision, reason } })
    return tx.script.update({
      where: { id: s.id },
      data: { state: decision === 'approved' ? 'published' : 'rejected', publishedAt: decision === 'approved' ? new Date() : null },
      select: { id: true, state: true }
    })
  })
  return ok(updated)
}
