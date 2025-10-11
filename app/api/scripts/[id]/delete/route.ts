import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, notFound, unauthorized } from '@/src/api/http'
import { getSession } from '@/src/auth/session'
import { getAdminSession } from '@/src/auth/adminSession'
import { invalidateCache } from '@/src/cache/api-cache'

// 普通用户：软删除（标记 state = 'abandoned'），管理员：硬删除
export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  const admin = await getAdminSession()
  if (admin) {
    const exist = await prisma.script.findUnique({ where: { id }, select: { id: true } })
    if (!exist) return notFound()
    await prisma.$transaction(async (tx) => {
      await tx.imageAsset.deleteMany({ where: { scriptId: id } })
      await tx.scriptJSON.deleteMany({ where: { scriptId: id } })
      await tx.review.deleteMany({ where: { scriptId: id } })
      await tx.downloadEvent.deleteMany({ where: { scriptId: id } })
      await tx.like.deleteMany({ where: { scriptId: id } })
      await tx.favorite.deleteMany({ where: { scriptId: id } })
      await tx.script.delete({ where: { id } })
    })
    
    // 清除所有剧本列表缓存
    invalidateCache('scripts-')
    console.log('[Delete] Cache invalidated for hard delete')
    
    return ok({ hardDeleted: true })
  }

  const session = await getSession()
  if (!session) return unauthorized()
  const mine = await prisma.script.findFirst({ where: { id, createdById: session.userId }, select: { id: true } })
  if (!mine) return unauthorized()
  await prisma.script.update({ where: { id }, data: { state: 'abandoned' } })
  
  // 清除所有剧本列表缓存
  invalidateCache('scripts-')
  console.log('[Delete] Cache invalidated for soft delete, script:', id)
  
  return ok({ softDeleted: true })
}


