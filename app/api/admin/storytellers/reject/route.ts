import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, badRequest, unauthorized } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') || ''
  const reason = (searchParams.get('reason') || '').trim()
  if (!id || !reason) return badRequest('INVALID_PARAMS')
  const app = await prisma.storytellerApplication.findUnique({ where: { id }, select: { id: true, userId: true } })
  if (!app) return badRequest('NOT_FOUND')
  await prisma.$transaction(async (tx) => {
    await tx.storytellerApplication.update({ where: { id }, data: { status: 'rejected', reason, level: 0 } })
    await tx.user.update({ where: { id: app.userId }, data: { storytellerLevel: 0 } })
    // TODO: 可在此发送站内信/邮件通知 reason 给用户
  })
  return ok({ id, reason })
}


