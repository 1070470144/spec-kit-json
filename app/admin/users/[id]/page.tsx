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

export default async function AdminUserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')

  const u = await fetchUser(base, cookieHeader, p.id)
  const roleKeys = (u?.roles||[]).map((r:any)=>r.key)
  const isSuper = roleKeys.includes('superuser')
  const currentRole: 'admin' | 'user' = roleKeys.includes('admin') ? 'admin' : 'user'

  return (
    <div className="space-y-6">
      <div className="card max-w-3xl mx-auto">
        <div className="card-body">
          <div className="mb-6">
            <h1 className="text-headline-medium font-semibold text-surface-on mb-1">编辑用户</h1>
            <p className="text-body-small text-surface-on-variant">
              修改用户信息、角色和状态
            </p>
          </div>

          {!u && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-title-medium font-medium text-surface-on">用户不存在</div>
            </div>
          )}

          {u && (
            <form className="space-y-6" action={async (formData: FormData) => {
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
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
                <div className="flex items-center gap-2 text-sky-800">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">邮箱：{u.email}</span>
                </div>
              </div>

              <div>
                <label htmlFor="nickname" className="block text-body-medium font-medium text-surface-on mb-2">
                  昵称
                </label>
                <input 
                  id="nickname"
                  className="input" 
                  name="nickname" 
                  defaultValue={u.nickname||''} 
                  placeholder="请输入昵称" 
                />
              </div>

              <div>
                <label htmlFor="avatarUrl" className="block text-body-medium font-medium text-surface-on mb-2">
                  头像 URL
                </label>
                <input 
                  id="avatarUrl"
                  className="input" 
                  name="avatarUrl" 
                  defaultValue={u.avatarUrl||''} 
                  placeholder="https://..." 
                />
                <p className="text-body-small text-surface-on-variant mt-1">
                  输入图片URL地址
                </p>
              </div>

              <div>
                <label htmlFor="status" className="block text-body-medium font-medium text-surface-on mb-2">
                  账户状态
                </label>
                <select id="status" className="input" name="status" defaultValue={u.status||'active'}>
                  <option value="active">激活</option>
                  <option value="pending">待验证</option>
                  <option value="disabled">已禁用</option>
                </select>
              </div>

              <div>
                <label htmlFor="password" className="block text-body-medium font-medium text-surface-on mb-2">
                  重置密码
                </label>
                <input 
                  id="password"
                  className="input" 
                  name="password" 
                  type="password"
                  placeholder="留空表示不修改密码" 
                />
                <p className="text-body-small text-surface-on-variant mt-1">
                  输入新密码以重置，留空则不修改
                </p>
              </div>

              <div className="border-t border-outline pt-6">
                <label className="block text-body-medium font-medium text-surface-on mb-3">
                  用户角色
                </label>
                <p className="text-body-small text-surface-on-variant mb-4">
                  管理员拥有用户的全部权限，超级管理员角色不可修改
                </p>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${isSuper ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-sky-300 hover:bg-sky-50/30'}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="admin" 
                      defaultChecked={currentRole==='admin'} 
                      disabled={isSuper}
                      className="w-5 h-5 text-sky-600"
                    />
                    <div>
                      <div className="font-semibold text-surface-on">管理员</div>
                      <div className="text-body-small text-surface-on-variant">可以管理用户、审核剧本、查看分析数据</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${isSuper ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-sky-300 hover:bg-sky-50/30'}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="user" 
                      defaultChecked={currentRole==='user'} 
                      disabled={isSuper}
                      className="w-5 h-5 text-sky-600"
                    />
                    <div>
                      <div className="font-semibold text-surface-on">普通用户</div>
                      <div className="text-body-small text-surface-on-variant">可以上传剧本、点赞收藏、发表评论</div>
                    </div>
                  </label>
                  {isSuper && (
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
                      <input 
                        type="checkbox" 
                        disabled 
                        defaultChecked={roleKeys.includes('superuser')}
                        className="w-5 h-5"
                      />
                      <div>
                        <div className="font-semibold text-amber-800">超级管理员</div>
                        <div className="text-body-small text-amber-700">最高权限，不可修改</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-outline pt-6 flex gap-3">
                <button className="m3-btn-filled" type="submit">
                  <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  保存修改
                </button>
                <a className="m3-btn-outlined" href="/admin/users">
                  <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  返回列表
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
