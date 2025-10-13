import { prisma } from '@/src/db/client'
import { ok, unauthorized } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'
import { invalidateCache } from '@/src/cache/api-cache'
import { revalidatePath } from 'next/cache'

export async function POST() {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')

  const pendings = await prisma.script.findMany({ where: { state: 'pending' }, select: { id: true } })
  if (!pendings.length) return ok({ updated: 0 })

  const ids = pendings.map(p => p.id)
  await prisma.$transaction(async (tx) => {
    for (const id of ids) {
      await tx.review.create({ data: { scriptId: id, reviewerId: admin.userId, decision: 'approved' } as any })
      await tx.script.update({ where: { id }, data: { state: 'published', publishedAt: new Date() } })
    }
  })
  
  // 清除所有相关缓存（清除所有状态以确保一致性）
  invalidateCache('scripts-pending')   // 清除待审核列表缓存
  invalidateCache('scripts-published') // 清除已发布列表缓存
  invalidateCache('scripts-rejected')  // 清除已拒绝列表缓存
  invalidateCache('scripts-abandoned') // 清除已废弃列表缓存
  invalidateCache('scripts-all')       // 清除全部列表缓存
  
  // 重新验证页面缓存
  revalidatePath('/admin/review')
  revalidatePath('/admin/scripts')
  revalidatePath('/scripts')
  
  console.log(`[APPROVE ALL] Approved ${ids.length} scripts, cache invalidated`)
  
  return ok({ updated: ids.length })
}


