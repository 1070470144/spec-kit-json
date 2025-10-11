import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, notFound, unauthorized, badRequest } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'
import { invalidateCache } from '@/src/cache/api-cache'

/**
 * 管理员恢复已废弃的剧本
 * POST /api/admin/scripts/:id/restore
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')

  const { id } = await context.params
  const body = await req.json().catch(() => ({}))
  const { newState = 'published', transferOwnership = true } = body

  // 验证新状态
  const validStates = ['published', 'pending', 'rejected']
  if (!validStates.includes(newState)) {
    return badRequest('INVALID_STATE')
  }

  // 查找剧本
  const script = await prisma.script.findUnique({
    where: { id },
    select: { id: true, state: true, createdById: true, title: true }
  })

  if (!script) return notFound()

  // 检查当前状态
  if (script.state !== 'abandoned') {
    return badRequest('SCRIPT_NOT_ABANDONED')
  }

  // 恢复剧本并转移所有权
  const updateData: any = {
    state: newState,
    publishedAt: newState === 'published' ? new Date() : null
  }

  if (transferOwnership) {
    updateData.systemOwned = true
    updateData.originalOwnerId = script.createdById
    updateData.transferredAt = new Date()
  }

  await prisma.script.update({
    where: { id },
    data: updateData
  })

  // 清除所有剧本列表缓存
  invalidateCache('scripts-')

  console.log(
    '[Restore] Script restored:',
    id,
    script.title,
    'New state:',
    newState,
    'Transferred:',
    transferOwnership
  )

  return ok({
    success: true,
    scriptId: id,
    title: script.title,
    newState,
    systemOwned: transferOwnership
  })
}

