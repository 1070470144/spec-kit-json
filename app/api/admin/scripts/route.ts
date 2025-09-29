import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, unauthorized, forbidden } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

export async function DELETE(_req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  // 仅超级用户可执行
  const u = await prisma.user.findUnique({ where: { id: admin.userId }, select: { roles: { select: { key: true } } } })
  const isSuper = (u?.roles || []).some(r=>r.key==='superuser')
  if (!isSuper) return forbidden('SUPERUSER_ONLY')

  await prisma.$transaction(async (tx) => {
    await tx.imageAsset.deleteMany({})
    await tx.scriptJSON.deleteMany({})
    await tx.review.deleteMany({})
    await tx.downloadEvent.deleteMany({})
    await (tx as any)["likeEvent"].deleteMany({}).catch(()=>{})
    await (tx as any)["favorite"].deleteMany({}).catch(()=>{})
    await tx.comment.deleteMany({})
    await tx.script.deleteMany({})
  })
  return ok({ ok: true })
}


