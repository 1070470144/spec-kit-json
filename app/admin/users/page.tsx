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
    <div className="space-y-6">
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-headline-medium font-semibold text-surface-on">用户管理</h1>
              <p className="text-body-small text-surface-on-variant mt-1">
                管理系统用户，查看用户信息和角色
              </p>
            </div>
            <a className="m3-btn-filled" href="/admin/users/new">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建用户
            </a>
          </div>

          <form className="mb-6" action="/admin/users">
            <div className="relative max-w-md">
              <input 
                className="input w-full pl-10" 
                name="q" 
                defaultValue={q} 
                placeholder="搜索邮箱或昵称"
                aria-label="搜索用户"
              />
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-surface-on-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          {!items?.length && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-title-medium font-medium text-surface-on mb-1">
                {q ? '未找到匹配用户' : '暂无用户'}
              </div>
              <div className="text-body-small text-surface-on-variant">
                {q ? '尝试使用其他关键词搜索' : '还没有注册用户'}
              </div>
            </div>
          )}

          {!!items?.length && (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="table-admin">
                <thead>
                  <tr>
                    <th className="px-3 py-3 text-body-small font-medium text-surface-on-variant">头像</th>
                    <th className="px-3 py-3 text-body-small font-medium text-surface-on-variant">邮箱</th>
                    <th className="px-3 py-3 text-body-small font-medium text-surface-on-variant">昵称</th>
                    <th className="px-3 py-3 text-body-small font-medium text-surface-on-variant">状态</th>
                    <th className="px-3 py-3 text-body-small font-medium text-surface-on-variant">角色</th>
                    <th className="px-3 py-3 text-body-small font-medium text-surface-on-variant text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(u => {
                    const roleKeys = (u.roles||[]).map(r=>r.key)
                    const isSuper = roleKeys.includes('superuser')
                    const roleText = (((u.roles||[]).map(r => r.name || r.key).filter(Boolean)).join(', ')) || '用户'
                    return (
                      <tr key={u.id}>
                        <td className="px-3 py-3">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.nickname || u.email} className="w-10 h-10 rounded-full border-2 border-outline object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center">
                              <span className="text-body-medium font-medium text-surface-on-variant">
                                {(u.nickname || u.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-body-medium text-surface-on">{u.email}</td>
                        <td className="px-3 py-3 text-body-medium text-surface-on">{u.nickname || <span className="text-surface-on-variant">-</span>}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-body-small font-medium ${
                            u.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
                            u.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                            'bg-gray-50 text-gray-700 border border-gray-200'
                          }`}>
                            {u.status || 'active'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-body-small font-medium">
                            {roleText}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a className="m3-btn-outlined text-body-small px-3 py-1.5" href={`/admin/users/${u.id}`}>
                              编辑
                            </a>
                            <form className="inline" action={async () => {
                              'use server'
                              if (isSuper) return
                              await removeUser(base, cookieHeader, u.id)
                              revalidatePath('/admin/users')
                            }}>
                              <button 
                                className={`btn-danger text-body-small px-3 py-1.5 ${isSuper ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                disabled={isSuper} 
                                type="submit"
                                title={isSuper ? '超级用户不能删除' : '删除用户'}
                              >
                                删除
                              </button>
                            </form>
                          </div>
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
