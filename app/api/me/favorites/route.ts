import { prisma } from '@/src/db/client'
import { ok, unauthorized } from '@/src/api/http'
import { getSession } from '@/src/auth/session'

export async function GET() {
  const s = await getSession()
  if (!s) return unauthorized()
  const items = await prisma.favorite.findMany({
    where: { userId: s.userId },
    orderBy: { createdAt: 'desc' },
    select: { script: { select: { id: true, title: true, authorName: true } } }
  })
  return ok({ items: items.map(i => i.script) })
}


