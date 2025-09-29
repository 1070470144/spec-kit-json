import { headers, cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function fetchUsers(q?: string) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
  const url = q ? `${base}/api/admin/users?q=${encodeURIComponent(q)}` : `${base}/api/admin/users`
  const res = await fetch(url, { cache: 'no-store', headers: { cookie: cookieHeader } })
  const j = await res.json().catch(()=>({}))
  const items = (j?.data?.items ?? j?.items ?? []) as { id:string; email:string; nickname:string|null; status:string; createdAt:string; lastLoginAt:string|null; avatarUrl?:string|null; roles:{key:string;name:string}[] }[]
  return { items, base, cookieHeader }
}

async function removeUser(base: string, cookieHeader: string, id: string) {
  await fetch(`${base}/api/admin/users?id=${id}`, { method: 'DELETE', headers: { cookie: cookieHeader } })
}

export default async function AdminUsersPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const sp = searchParams ? await searchParams : undefined
  const q = sp?.q || ''
  const { items, base, cookieHeader } = await fetchUsers(q)
  return (
    <div className="container-page section space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="text-xl font-semibold">用户管理</div>
        <form className="flex-1 max-w-md" action="/admin/users">
          <input className="input w-full" name="q" defaultValue={q} placeholder="搜索邮箱或昵称" />
        </form>
        <a className="btn btn-primary" href="/admin/users/new">新建用户</a>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="card-title">用户列表</div>
        {!items?.length && <div className="muted">暂无用户</div>}
        {!!items?.length && (
          <div className="overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="px-2 py-2">头像</th>
                  <th className="px-2 py-2">邮箱</th>
                  <th className="px-2 py-2">昵称</th>
                  <th className="px-2 py-2">状态</th>
                  <th className="px-2 py-2">角色</th>
                  <th className="px-2 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map(u => {
                  const roleKeys = (u.roles||[]).map(r=>r.key)
                  const isSuper = roleKeys.includes('superuser') || u.email === 'admin@example.com'
                  const roleText = (((u.roles||[]).map(r => r.name || r.key).filter(Boolean)).join(', ')) || '用户'
                  return (
                    <tr key={u.id} className="border-t">
                      <td className="px-2 py-2">{u.avatarUrl ? <img src={u.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full border" /> : '-'}</td>
                      <td className="px-2 py-2">{u.email}</td>
                      <td className="px-2 py-2">{u.nickname ?? '-'}</td>
                      <td className="px-2 py-2">{u.status || 'active'}</td>
                      <td className="px-2 py-2">{roleText}</td>
                      <td className="px-2 py-2">
                        <form className="inline" action={async () => {
                          'use server'
                          if (isSuper) return
                          await removeUser(base, cookieHeader, u.id)
                          revalidatePath('/admin/users')
                        }}>
                          <button className={`btn btn-danger ${isSuper ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isSuper} type="submit">删除</button>
                        </form>
                        <a className="btn btn-outline ml-2" href={`/admin/users/${u.id}`}>编辑</a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
