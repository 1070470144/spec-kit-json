import { prisma } from '@/src/db/client'
import { ok, unauthorized } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

export async function GET() {
  const admin = getAdminSession()
  if (!admin) return unauthorized('Admin session required')
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      nickname: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      roles: { select: { key: true, name: true } },
    },
    take: 200,
  })
  return ok({ items: users })
}
