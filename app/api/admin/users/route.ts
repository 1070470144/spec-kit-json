import { prisma } from '@/src/db/client'
import { ok, unauthorized, badRequest, forbidden, notFound } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

async function ensureRoles(keys: string[]) {
  const needed = Array.from(new Set(keys.filter(k => k === 'admin' || k === 'user')))
  if (!needed.length) return
  const existing = await prisma.role.findMany({ where: { key: { in: needed } }, select: { key: true } })
  const existingSet = new Set(existing.map(r => r.key))
  const missing = needed.filter(k => !existingSet.has(k))
  if (!missing.length) return
  await Promise.all(missing.map(key => prisma.role.create({
    data: { key, name: key === 'admin' ? '管理员' : '用户', permissionsJson: '{}' }
  })))
}

export async function GET(req: Request) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('Admin session required')
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const where = q ? { OR: [ { email: { contains: q } }, { nickname: { contains: q } } ] } : {}
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: ({ id: true, email: true, nickname: true, status: true, createdAt: true, lastLoginAt: true, avatarUrl: true, roles: { select: { key: true, name: true } } } as any),
    take: 500,
  })
  return ok({ items: users })
}

export async function POST(req: Request) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('Admin session required')
  const body = await req.json().catch(() => null) as { email?: string; password?: string; nickname?: string; avatarUrl?: string|null; roleKeys?: string[] } | null
  if (!body?.email || !body?.password) return badRequest('email/password required')
  if (body.roleKeys?.includes('superuser')) return forbidden('SUPERUSER_ROLE_LOCKED')
  const { hashPassword } = await import('@/src/auth/password')
  const pwd = hashPassword(body.password)
  const user = await prisma.user.create({ data: ({ email: body.email, passwordHash: pwd, nickname: body.nickname ?? null, avatarUrl: body.avatarUrl ?? null, status: 'active' } as any) })
  if (body.roleKeys?.length) {
    const normalized = Array.from(new Set(body.roleKeys.filter(k => k === 'admin' || k === 'user')))
    const keys = normalized.length ? normalized : ['user']
    await ensureRoles(keys)
    const roles = await prisma.role.findMany({ where: { key: { in: keys } }, select: { id: true } })
    await prisma.user.update({ where: { id: user.id }, data: { roles: { set: roles.map(r => ({ id: r.id })) } } })
  } else {
    await ensureRoles(['user'])
    const roles = await prisma.role.findMany({ where: { key: { in: ['user'] } }, select: { id: true } })
    await prisma.user.update({ where: { id: user.id }, data: { roles: { set: roles.map(r => ({ id: r.id })) } } })
  }
  return ok({ id: user.id })
}

export async function PUT(req: Request) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('Admin session required')
  const body = await req.json().catch(() => null) as { id?: string; nickname?: string|null; status?: string; avatarUrl?: string|null; password?: string|null; roleKeys?: string[] } | null
  if (!body?.id) return badRequest('id required')
  const user = await prisma.user.findUnique({ where: { id: body.id }, select: { id: true, email: true, roles: { select: { key: true } } } })
  if (!user) return notFound('user not found')
  const isSuper = user.roles.some(r => r.key === 'superuser')
  if (isSuper) return forbidden('SUPERUSER_IMMUTABLE')
  const data: any = { nickname: body.nickname ?? null, status: body.status ?? 'active', avatarUrl: body.avatarUrl ?? null }
  if (body.password) {
    const { hashPassword } = await import('@/src/auth/password')
    data.passwordHash = hashPassword(body.password)
  }
  await prisma.user.update({ where: { id: user.id }, data })
  if (body.roleKeys) {
    if (body.roleKeys.includes('superuser')) return forbidden('SUPERUSER_ROLE_LOCKED')
    const normalized = Array.from(new Set(body.roleKeys.filter(k => k === 'admin' || k === 'user')))
    const keys = normalized.length ? normalized : ['user']
    await ensureRoles(keys)
    const roles = await prisma.role.findMany({ where: { key: { in: keys } }, select: { id: true } })
    await prisma.user.update({ where: { id: user.id }, data: { roles: { set: roles.map(r => ({ id: r.id })) } } })
  }
  return ok({ id: user.id })
}

export async function DELETE(req: Request) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('Admin session required')
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') || undefined
  if (!id) return badRequest('id required')
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, roles: { select: { key: true } } } })
  if (!user) return notFound('user not found')
  const isSuper = user.roles.some(r => r.key === 'superuser')
  if (isSuper) return forbidden('SUPERUSER_IMMUTABLE')
  await prisma.user.delete({ where: { id } })
  return ok({ id })
}
