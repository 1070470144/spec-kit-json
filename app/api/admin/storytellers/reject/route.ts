import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, badRequest, unauthorized } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const reason = searchParams.get('reason') || ''
  if (!id) return badRequest('INVALID_PARAMS')
  await prisma.storytellerApplication.update({ where: { id }, data: { status: 'rejected', reason } })
  return ok({ id, reason })
}


