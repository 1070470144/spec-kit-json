import { prisma } from '@/src/db/client'
import { ok } from '@/src/api/http'

export async function GET() {
  const keys = ['site.version','site.icp','site.contact']
  const rows = await (prisma as any)["systemConfig"].findMany({ where: { key: { in: keys } } })
  const data: Record<string, string> = {}
  for (const r of rows) data[r.key] = r.value
  return ok(data)
}


