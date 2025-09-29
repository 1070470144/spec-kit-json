import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, notFound, badRequest, unauthorized, forbidden } from '@/src/api/http'
import { getSession } from '@/src/auth/session'
import { getAdminSession } from '@/src/auth/adminSession'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') || '10')))
  const skip = (page - 1) * pageSize
  const { id } = await context.params
  const script = await prisma.script.findUnique({ where: { id }, select: { id: true } })
  if (!script) return notFound()
  const [items, total] = await Promise.all([
    prisma.comment.findMany({ where: { scriptId: id }, orderBy: { createdAt: 'desc' }, skip, take: pageSize, select: { id: true, content: true, createdAt: true, authorId: true, author: { select: { nickname: true, email: true } } } }),
    prisma.comment.count({ where: { scriptId: id } })
  ])
  const out = items.map(c => ({ id: c.id, content: c.content, createdAt: c.createdAt, author: c.author?.nickname || c.author?.email || '匿名', authorId: c.authorId }))
  return ok({ items: out, total, page, pageSize })
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getSession()
  if (!session) return unauthorized('PLEASE_LOGIN')
  const body = await req.json().catch(()=>null)
  const text = String(body?.content || '').trim()
  if (!text || text.length < 2) return badRequest('INVALID_CONTENT')
  const cfg = await (prisma as any)["systemConfig"].findUnique({ where: { key: 'system.sensitiveWords' } })
  const banned: string[] = cfg?.value ? String(cfg.value).split(',').map((s:string)=>s.trim()).filter(Boolean) : []
  if (banned.some(w => w && text.includes(w))) return badRequest('CONTENT_FORBIDDEN')
  const created = await prisma.comment.create({ data: { scriptId: id, authorId: session.userId, content: text }, select: { id: true, createdAt: true } })
  return ok({ id: created.id, createdAt: created.createdAt })
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const admin = await getAdminSession()
  if (!session && !admin) return unauthorized('PLEASE_LOGIN')
  const { searchParams } = new URL(req.url)
  const commentId = searchParams.get('commentId') || ''
  if (!commentId) return badRequest('MISSING_COMMENT_ID')
  const row = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, authorId: true } })
  if (!row) return notFound()
  if (!admin && row.authorId !== session?.userId) return forbidden('NOT_ALLOWED')
  await prisma.comment.delete({ where: { id: commentId } })
  return ok({ id: commentId })
}


