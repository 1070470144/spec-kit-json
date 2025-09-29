import { prisma } from '@/src/db/client'
import { ok, unauthorized } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

export async function POST() {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')

  const pendings = await prisma.script.findMany({ where: { state: 'pending' }, select: { id: true } })
  if (!pendings.length) return ok({ updated: 0 })

  const ids = pendings.map(p => p.id)
  await prisma.$transaction(async (tx) => {
    for (const id of ids) {
      await tx.review.create({ data: { scriptId: id, reviewerId: admin.userId, decision: 'approved' } as any })
      await tx.script.update({ where: { id }, data: { state: 'published', publishedAt: new Date() } })
    }
  })
  return ok({ updated: ids.length })
}


