import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, unauthorized, badRequest, notFound } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

export async function GET(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || undefined
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') || '20')))
  const skip = (page - 1) * pageSize
  const where: any = {}
  if (q) where.content = { contains: q }
  const [items, total] = await Promise.all([
    prisma.comment.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize, select: { id: true, content: true, createdAt: true, script: { select: { id: true, title: true } }, author: { select: { email: true, nickname: true } } } }),
    prisma.comment.count({ where })
  ])
  const out = items.map(c => ({ id: c.id, content: c.content, createdAt: c.createdAt, scriptId: c.script.id, scriptTitle: c.script.title, author: c.author?.nickname || c.author?.email || '匿名' }))
  return ok({ items: out, total, page, pageSize })
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') || ''
  if (!id) return badRequest('MISSING_ID')
  const exist = await prisma.comment.findUnique({ where: { id }, select: { id: true } })
  if (!exist) return notFound()
  await prisma.comment.delete({ where: { id } })
  return ok({ id })
}


