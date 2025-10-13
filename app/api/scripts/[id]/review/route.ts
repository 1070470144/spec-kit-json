import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { parseJson } from '@/src/api/validate'
import { ok, notFound, badRequest, unauthorized } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'
import { invalidateCache } from '@/src/cache/api-cache'
import { revalidatePath } from 'next/cache'

const schema = z.object({ decision: z.enum(['approved','rejected']), reason: z.string().min(1).optional() })

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = await parseJson(req, schema)
  if (!parsed.ok) return parsed.res
  const { decision, reason } = parsed.data

  // 权限与身份
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  if (decision === 'rejected' && !reason) return badRequest('REASON_REQUIRED')

  // 防止重置数据库后旧的会话指向不存在的用户，导致外键报错
  const adminUser = await prisma.user.findUnique({ where: { id: admin.userId }, select: { id: true } })
  if (!adminUser) return unauthorized('STALE_SESSION')

  const { id } = await context.params
  const s = await prisma.script.findUnique({ where: { id } })
  if (!s) return notFound()
  if (s.state !== 'pending') return badRequest('INVALID_STATE')

  const updated = await prisma.$transaction(async (tx) => {
    await tx.review.create({ data: { scriptId: s.id, reviewerId: admin.userId, decision, reason } })
    return tx.script.update({
      where: { id: s.id },
      data: { state: decision === 'approved' ? 'published' : 'rejected', publishedAt: decision === 'approved' ? new Date() : null },
      select: { id: true, state: true }
    })
  })
  
  // 清除所有相关缓存
  invalidateCache('scripts-pending')   // 清除待审核列表缓存
  invalidateCache('scripts-published') // 清除已发布列表缓存
  invalidateCache('scripts-rejected')  // 清除已拒绝列表缓存
  invalidateCache('scripts-all')       // 清除全部列表缓存
  invalidateCache(`script-${id}`)      // 清除剧本详情缓存
  
  // 重新验证页面缓存
  revalidatePath('/admin/review')
  revalidatePath('/admin/scripts')
  revalidatePath('/scripts')
  revalidatePath(`/scripts/${id}`)
  
  console.log(`[REVIEW] Script ${id} ${decision}, cache invalidated`)
  
  return ok(updated)
}
