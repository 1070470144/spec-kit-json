import { headers, cookies } from 'next/headers'

async function createUser(base: string, cookieHeader: string, data: { email:string; password:string; nickname?:string; avatarUrl?:string|null; roleKeys:string[] }) {
  await fetch(`${base}/api/admin/users`, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie: cookieHeader }, body: JSON.stringify(data) })
}

export default async function AdminUserCreatePage() {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')

  return (
    <div className="container-page section">
      <div className="card max-w-2xl">
        <div className="card-title">创建用户</div>
        <form className="space-y-3" action={async (formData: FormData) => {
          'use server'
          const email = String(formData.get('email')||'')
          const password = String(formData.get('password')||'')
          const nickname = String(formData.get('nickname')||'') || undefined
          const avatarUrl = String(formData.get('avatarUrl')||'') || undefined
          const roles = Array.from(formData.getAll('roles')).map(String).filter(r=>r==='admin'||r==='user')
          await createUser(base, cookieHeader, { email, password, nickname, avatarUrl, roleKeys: roles })
        }}>
          <input className="input" name="email" placeholder="邮箱" />
          <input className="input" name="password" placeholder="初始密码" />
          <input className="input" name="nickname" placeholder="昵称（可选）" />
          <input className="input" name="avatarUrl" placeholder="头像URL（可选）" />
          <div>
            <div className="muted mb-1">角色（可多选）</div>
            <label className="mr-4 inline-flex items-center gap-1"><input type="checkbox" name="roles" value="admin" /> 管理员</label>
            <label className="mr-4 inline-flex items-center gap-1"><input type="checkbox" name="roles" value="user" defaultChecked /> 用户</label>
            <label className="inline-flex items-center gap-1 opacity-50 cursor-not-allowed"><input type="checkbox" disabled /> 超级管理员（不可分配）</label>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" type="submit">创建</button>
            <a className="btn btn-outline" href="/admin/users">返回列表</a>
          </div>
        </form>
      </div>
    </div>
  )
}
