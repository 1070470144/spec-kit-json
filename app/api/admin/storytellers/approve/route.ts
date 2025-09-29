import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, badRequest, unauthorized } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

// 统一的审批接口：level 可为 0（普通）、1（一星）、2（二星）
// 允许从一星再申请二星：总是以传入的 level 覆盖用户当前等级
export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') || ''
  const level = Number(searchParams.get('level') || '0')
  if (!id || ![0,1,2].includes(level)) return badRequest('INVALID_PARAMS')
  const app = await prisma.storytellerApplication.findUnique({ where: { id }, select: { id: true, userId: true } })
  if (!app) return badRequest('NOT_FOUND')
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: app.userId }, data: { storytellerLevel: level } })
    await tx.storytellerApplication.update({ where: { id: app.id }, data: { status: level > 0 ? 'approved' : 'rejected', level } })
  })
  return ok({ id, level })
}


