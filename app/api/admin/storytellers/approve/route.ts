import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, badRequest, unauthorized } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const level = Number(searchParams.get('level') || '0')
  if (!id || (level !== 1 && level !== 2)) return badRequest('INVALID_PARAMS')
  const app = await prisma.storytellerApplication.findUnique({ where: { id }, select: { id: true, userId: true } })
  if (!app) return badRequest('NOT_FOUND')
  await prisma.$transaction(async (tx) => {
    await tx.storytellerApplication.update({ where: { id }, data: { status: 'approved', level } })
    await tx.user.update({ where: { id: app.userId }, data: { storytellerLevel: level } })
  })
  return ok({ id, level })
}


