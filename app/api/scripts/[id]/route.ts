import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, notFound, badRequest, unauthorized, forbidden } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const s = await prisma.script.findUnique({
    where: { id },
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

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  const { id } = await context.params
  const body = await req.json().catch(()=>null)
  if (!body || typeof body !== 'object') return badRequest('INVALID_JSON')
  const { title, authorName, json } = body as { title?: string; authorName?: string | null; json?: unknown }
  const s = await prisma.script.findUnique({ where: { id }, select: { id: true } })
  if (!s) return notFound()

  // 更新基础信息
  if (typeof title === 'string' || typeof authorName === 'string' || authorName === null) {
    await prisma.script.update({ where: { id }, data: { title: typeof title === 'string' ? title : undefined, authorName: authorName === undefined ? undefined : authorName } })
  }
  // 新增新版本 JSON（如提供）
  if (json !== undefined) {
    const contentStr = JSON.stringify(json)
    const hash = (await import('node:crypto')).createHash('sha256').update(contentStr).digest('hex')
    await prisma.scriptJSON.create({ data: { scriptId: id, content: contentStr, contentHash: hash, schemaValid: true, version: 1 } })
  }
  return ok({ id })
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  const { id } = await context.params
  const exist = await prisma.script.findUnique({ where: { id }, select: { id: true } })
  if (!exist) return notFound()
  // 事务删除关联资源
  await prisma.$transaction(async (tx) => {
    await tx.imageAsset.deleteMany({ where: { scriptId: id } })
    await tx.scriptJSON.deleteMany({ where: { scriptId: id } })
    await tx.review.deleteMany({ where: { scriptId: id } })
    await tx.downloadEvent.deleteMany({ where: { scriptId: id } })
    await tx.script.delete({ where: { id } })
  })
  return ok({ id })
}
