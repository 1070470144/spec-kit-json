import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, unauthorized } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

export async function GET(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined
  const where: any = {}
  if (status && ['pending','approved','rejected'].includes(status)) where.status = status
  const apps = await prisma.storytellerApplication.findMany({ where, orderBy: { createdAt: 'desc' }, include: { user: { select: { email: true, nickname: true } } } })
  const items = apps.map(a => ({
    id: a.id,
    status: a.status,
    level: a.level,
    createdAt: a.createdAt,
    user: { email: a.user?.email || '', nickname: a.user?.nickname || null },
    imageUrl: `/api/files?path=${encodeURIComponent(a.imagePath)}`,
    approve1: `/api/admin/storytellers/approve?level=1&id=${a.id}`,
    approve2: `/api/admin/storytellers/approve?level=2&id=${a.id}`
  }))
  return ok({ items })
}


