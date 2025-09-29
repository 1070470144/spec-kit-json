import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, unauthorized } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  const apps = await prisma.storytellerApplication.findMany({ orderBy: { createdAt: 'desc' }, include: { user: { select: { email: true } } } })
  const items = apps.map(a => ({ id: a.id, user: a.user, imageUrl: `/api/files?path=${encodeURIComponent(a.imagePath)}`, approve1: `/api/admin/storytellers/approve?level=1&id=${a.id}`, approve2: `/api/admin/storytellers/approve?level=2&id=${a.id}` }))
  return ok({ items })
}


