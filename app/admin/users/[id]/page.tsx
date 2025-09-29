import { headers, cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function fetchUser(base: string, cookieHeader: string, id: string) {
  const res = await fetch(`${base}/api/admin/users?q=`, { headers: { cookie: cookieHeader } })
  const j = await res.json().catch(()=>({})) as any
  const items = (j?.data?.items ?? j?.items ?? []) as any[]
  return items.find(u => u.id === id)
}

async function updateUser(base: string, cookieHeader: string, data: { id:string; nickname?:string|null; avatarUrl?:string|null; status?:string; password?:string|null; roleKeys?:string[] }) {
  await fetch(`${base}/api/admin/users`, { method: 'PUT', headers: { 'Content-Type': 'application/json', cookie: cookieHeader }, body: JSON.stringify(data) })
}

export default async function AdminUserEditPage({ params }: { params: { id: string } }) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')

  const u = await fetchUser(base, cookieHeader, params.id)
  const roleKeys = (u?.roles||[]).map((r:any)=>r.key)
  const isSuper = roleKeys.includes('superuser') || u?.email === 'admin@example.com'
  const currentRole: 'admin' | 'user' = roleKeys.includes('admin') ? 'admin' : 'user'

  return (
    <div className="container-page section">
      <div className="card max-w-2xl">
        <div className="card-title">编辑用户</div>
        {!u && <div className="muted">用户不存在</div>}
        {u && (
          <form className="space-y-3" action={async (formData: FormData) => {
            'use server'
            if (!u) return
            const nickname = String(formData.get('nickname')||'') || null
            const avatarUrl = String(formData.get('avatarUrl')||'') || null
            const status = String(formData.get('status')||'active')
            const password = String(formData.get('password')||'') || null
            let selectedRole = String(formData.get('role')||'')
            let roles: string[] = selectedRole ? [selectedRole] : [currentRole]
            if (isSuper) roles = roleKeys
            await updateUser(base, cookieHeader, { id: u.id, nickname, avatarUrl, status, password, roleKeys: roles })
            revalidatePath('/admin/users')
            redirect('/admin/users')
          }}>
            <div className="muted">邮箱：{u.email}</div>
            <input className="input" name="nickname" defaultValue={u.nickname||''} placeholder="昵称" />
            <input className="input" name="avatarUrl" defaultValue={u.avatarUrl||''} placeholder="头像URL" />
            <select className="input" name="status" defaultValue={u.status||'active'}>
              <option value="active">active</option>
              <option value="disabled">disabled</option>
            </select>
            <input className="input" name="password" placeholder="重置密码（留空表示不修改）" />
            <div>
              <div className="muted mb-1">角色（单选，管理员包含用户的全部权限）</div>
              <label className={`mr-6 inline-flex items-center gap-1 ${isSuper ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input type="radio" name="role" value="admin" defaultChecked={currentRole==='admin'} disabled={isSuper} /> 管理员
              </label>
              <label className={`mr-6 inline-flex items-center gap-1 ${isSuper ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input type="radio" name="role" value="user" defaultChecked={currentRole==='user'} disabled={isSuper} /> 用户
              </label>
              <label className="inline-flex items-center gap-1 opacity-50 cursor-not-allowed"><input type="checkbox" disabled defaultChecked={roleKeys.includes('superuser')} /> 超级管理员（不可修改）</label>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" type="submit">保存</button>
              <a className="btn btn-outline" href="/admin/users">返回列表</a>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
