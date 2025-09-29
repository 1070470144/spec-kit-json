async function fetchUsers() {
  const res = await fetch('http://localhost:3000/api/admin/users', { cache: 'no-store' })
  const j = await res.json().catch(()=>({}))
  const items = (j?.data?.items ?? j?.items ?? []) as { id:string; email:string; nickname:string|null; status:string; createdAt:string; lastLoginAt:string|null; roles:{key:string;name:string}[] }[]
  return { items }
}

export default async function AdminUsersPage() {
  const { items } = await fetchUsers()
  return (
    <div className="container-page section">
      <div className="card">
        <div className="card-title">用户管理</div>
        {!items?.length && <div className="muted">暂无用户</div>}
        {!!items?.length && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="px-2 py-2">邮箱</th>
                  <th className="px-2 py-2">昵称</th>
                  <th className="px-2 py-2">状态</th>
                  <th className="px-2 py-2">角色</th>
                  <th className="px-2 py-2">创建时间</th>
                  <th className="px-2 py-2">最近登录</th>
                </tr>
              </thead>
              <tbody>
                {items.map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="px-2 py-2">{u.email}</td>
                    <td className="px-2 py-2">{u.nickname ?? '-'}</td>
                    <td className="px-2 py-2">{u.status}</td>
                    <td className="px-2 py-2">{(u.roles||[]).map(r=>r.name).join(', ') || '-'}</td>
                    <td className="px-2 py-2">{new Date(u.createdAt).toLocaleString()}</td>
                    <td className="px-2 py-2">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
