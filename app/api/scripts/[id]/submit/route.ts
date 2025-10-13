import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, notFound, badRequest } from '@/src/api/http'
import { invalidateCache } from '@/src/cache/api-cache'
import { revalidatePath } from 'next/cache'

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const found = await prisma.script.findUnique({ where: { id }, select: { id: true, state: true } })
  if (!found) return notFound()
  if (found.state !== 'rejected') {
    return badRequest('INVALID_STATE')
  }
  const updated = await prisma.script.update({ where: { id }, data: { state: 'pending' }, select: { id: true, state: true } })
  
  // 清除所有相关缓存（rejected -> pending）
  invalidateCache('scripts-pending')
  invalidateCache('scripts-rejected')
  invalidateCache('scripts-all')
  invalidateCache(`script-${id}`)
  
  // 刷新服务端渲染页面缓存
  revalidatePath('/admin/review')
  revalidatePath('/admin/scripts')
  revalidatePath('/my/uploads')
  
  console.log(`[SUBMIT] Script ${id} resubmitted (rejected -> pending), cache invalidated`)
  
  return ok(updated)
}
