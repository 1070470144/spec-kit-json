import { prisma } from '@/src/db/client'
import { ok, unauthorized } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  const items = await prisma.script.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      state: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { versions: true, images: true } }
    }
  })
  const data = items.map(it => ({
    id: it.id,
    title: it.title,
    state: it.state,
    versions: it._count.versions,
    images: it._count.images,
    createdAt: it.createdAt,
    updatedAt: it.updatedAt
  }))
  return ok({ items: data })
}


