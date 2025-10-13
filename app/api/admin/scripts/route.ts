import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, unauthorized, forbidden } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'
import { apiCache } from '@/src/cache/api-cache'
import { revalidatePath } from 'next/cache'

export async function DELETE(_req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  // 仅超级用户可执行
  const u = await prisma.user.findUnique({ where: { id: admin.userId }, select: { roles: { select: { key: true } } } })
  const isSuper = (u?.roles || []).some(r=>r.key==='superuser')
  if (!isSuper) return forbidden('SUPERUSER_ONLY')

  await prisma.$transaction(async (tx) => {
    await (tx as any)["like"].deleteMany({})
    await (tx as any)["favorite"].deleteMany({})
    await (tx as any)["likeEvent"].deleteMany({}).catch(()=>{})
    await tx.imageAsset.deleteMany({})
    await tx.scriptJSON.deleteMany({})
    await tx.review.deleteMany({})
    await tx.downloadEvent.deleteMany({})
    await tx.comment.deleteMany({})
    await tx.script.deleteMany({})
  })
  
  // 清除所有缓存
  apiCache.clear()
  
  // 重新验证所有相关页面
  revalidatePath('/admin/scripts')
  revalidatePath('/admin/review')
  revalidatePath('/scripts')
  revalidatePath('/my/uploads')
  
  console.log('[DELETE ALL] All scripts deleted, all cache cleared')
  
  return ok({ ok: true })
}


