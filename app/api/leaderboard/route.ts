import { prisma } from '@/src/db/client'
import { ok } from '@/src/api/http'

export async function GET(req: Request) {
  const u = new URL(req.url)
  const tp = u.searchParams.get('type')
  const type = tp === 'favorites' ? 'favorites' : tp === 'downloads' ? 'downloads' : 'likes'
  const order = type === 'likes' ? { likes: { _count: 'desc' } } : type === 'favorites' ? { favorites: { _count: 'desc' } } : { downloads: { _count: 'desc' } }
  const selectCount = type === 'likes' ? { likes: true } : type === 'favorites' ? { favorites: true } : { downloads: true }
  const items = await prisma.script.findMany({
    orderBy: order as any,
    take: 50,
    select: { id: true, title: true, authorName: true, _count: { select: selectCount } }
  })
  const list = items.map(s => ({ id: s.id, title: s.title, authorName: s.authorName, count: type==='likes' ? (s._count as any).likes : type==='favorites' ? (s._count as any).favorites : (s._count as any).downloads }))
  return ok({ [type]: list })
}


