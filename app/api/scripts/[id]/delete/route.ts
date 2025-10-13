import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, notFound, unauthorized } from '@/src/api/http'
import { getSession } from '@/src/auth/session'
import { getAdminSession } from '@/src/auth/adminSession'
import { invalidateCache } from '@/src/cache/api-cache'
import { revalidatePath } from 'next/cache'

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
    
    // 清除所有相关缓存（硬删除清除所有状态）
    invalidateCache('scripts-pending')
    invalidateCache('scripts-published')
    invalidateCache('scripts-rejected')
    invalidateCache('scripts-abandoned')
    invalidateCache('scripts-all')
    invalidateCache(`script-${id}`)
    
    // 刷新服务端渲染页面缓存
    revalidatePath('/admin/review')
    revalidatePath('/admin/scripts')
    revalidatePath('/scripts')
    
    console.log(`[Delete] Hard delete script: ${id}, cache invalidated`)
    
    return ok({ hardDeleted: true })
  }

  const session = await getSession()
  if (!session) return unauthorized()
  const mine = await prisma.script.findFirst({ where: { id, createdById: session.userId }, select: { id: true, state: true } })
  if (!mine) return unauthorized()
  
  const oldState = mine.state
  await prisma.script.update({ where: { id }, data: { state: 'abandoned' } })
  
  // 清除所有相关缓存（清除所有状态以确保一致性）
  invalidateCache('scripts-pending')
  invalidateCache('scripts-published')
  invalidateCache('scripts-rejected')
  invalidateCache('scripts-abandoned')
  invalidateCache('scripts-all')
  invalidateCache(`script-${id}`)
  
  // 刷新服务端渲染页面缓存
  revalidatePath('/admin/review')
  revalidatePath('/admin/scripts')
  revalidatePath('/scripts')
  revalidatePath('/my/uploads')
  
  console.log(`[Delete] Soft delete - ${oldState} -> abandoned, script: ${id}, cache invalidated`)
  
  return ok({ softDeleted: true })
}


