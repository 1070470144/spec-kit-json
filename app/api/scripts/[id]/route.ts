import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, notFound } from '@/src/api/http'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await prisma.script.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      versions: { orderBy: { createdAt: 'desc' }, take: 1 },
      author: { select: { nickname: true, email: true } }
    }
  })
  if (!s) return notFound()
  const images = s.images.map(i => ({ id: i.id, url: `/api/files?path=${encodeURIComponent(i.path)}`, isCover: i.isCover }))
  let json: unknown = null
  try { json = s.versions[0] ? JSON.parse(s.versions[0].content) : null } catch { json = null }
  const author = s.authorName || s.author?.nickname || s.author?.email || null
  return ok({ id: s.id, title: s.title, author, state: s.state, images, json })
}
