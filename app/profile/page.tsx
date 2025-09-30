'use client'
import { useEffect, useRef, useState } from 'react'

type Profile = { id: string; email: string; nickname?: string|null; avatarUrl?: string|null }

export default function ProfilePage() {
  const [me, setMe] = useState<Profile|null>(null)
  const [form, setForm] = useState({ nickname: '', avatarUrl: '' })
  const [msg, setMsg] = useState('')
  const [pwd, setPwd] = useState({ oldPassword: '', newPassword: '' })
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement|null>(null)
  const initialFormRef = useRef<{ nickname: string; avatarUrl: string } | null>(null)
  const [avatarFileName, setAvatarFileName] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/profile', { cache: 'no-store' })
      const j = await res.json().catch(()=>({}))
      const d = j?.data || null
      setMe(d)
      const init = { nickname: d?.nickname || '', avatarUrl: d?.avatarUrl || '' }
      initialFormRef.current = init
      setForm(init)
    })()
  }, [])

  const set = (k: 'nickname'|'avatarUrl', v: string) => setForm(p=>({ ...p, [k]: v }))

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setSaving(true)
    try {
      let avatarUrl = form.avatarUrl
      if (avatarFile) {
        const fd = new FormData(); fd.set('file', avatarFile)
        const up = await fetch('/api/profile/avatar', { method: 'POST', body: fd })
        const uj = await up.json().catch(()=>({}))
        if (!up.ok) { setMsg(uj?.error?.message || '头像上传失败'); setSaving(false); return }
        avatarUrl = uj?.data?.url || uj?.url || avatarUrl
      }
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname: form.nickname, avatarUrl }) })
      const j = await res.json().catch(()=>({}))
      if (!res.ok) { setMsg(j?.error?.message || '保存失败'); setSaving(false); return }
      setForm(p=>({ ...p, avatarUrl }))
      setMsg('已保存')
      window.dispatchEvent(new Event('profile-updated'))
      setAvatarFile(null)
      setAvatarFileName('')
      if (avatarPreview) { try { URL.revokeObjectURL(avatarPreview) } catch {} }
      setAvatarPreview(null)
    } finally {
      setSaving(false)
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/profile/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pwd) })
    const j = await res.json().catch(()=>({}))
    if (!res.ok) { setMsg(j?.error?.message || '修改失败'); return }
    setMsg('密码已修改')
    setPwd({ oldPassword: '', newPassword: '' })
  }

  if (!me) {
    return (
      <div className="container-page section">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="text-title-medium font-medium text-surface-on mb-1">请先登录</div>
          <div className="text-body-small text-surface-on-variant">登录后即可查看和编辑个人资料</div>
          <a className="m3-btn-filled inline-flex mt-4" href="/login">前往登录</a>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page section space-y-6">
      <div>
        <h1 className="text-headline-medium font-semibold text-surface-on">我的资料</h1>
        <p className="text-body-small text-surface-on-variant mt-1">
          管理您的个人信息和账户设置
        </p>
      </div>

      <div className="card max-w-3xl">
        <div className="card-body">
          <div className="mb-6">
            <h2 className="text-title-large font-semibold text-surface-on mb-1">基本信息</h2>
            <p className="text-body-small text-surface-on-variant">
              更新个人昵称与头像，保存后立即生效
            </p>
          </div>
          <form className="space-y-6" onSubmit={onSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nickname" className="block text-body-medium font-medium text-surface-on mb-2">
                  昵称
                </label>
                <input 
                  id="nickname"
                  className="input" 
                  value={form.nickname} 
                  onChange={e=>set('nickname', e.target.value)} 
                  placeholder="请输入昵称" 
                />
              </div>
              <div>
                <label htmlFor="avatarUrl" className="block text-body-medium font-medium text-surface-on mb-2">
                  头像 URL（可选）
                </label>
                <input 
                  id="avatarUrl"
                  className="input" 
                  value={form.avatarUrl} 
                  onChange={e=>set('avatarUrl', e.target.value)} 
                  placeholder="https://..." 
                />
              </div>
            </div>
            <div>
              <label className="block text-body-medium font-medium text-surface-on mb-2">
                头像
              </label>
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-full border-2 border-outline overflow-hidden bg-gray-50 flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar preview" className="w-full h-full object-cover" />
                  ) : form.avatarUrl ? (
                    <img src={form.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    className="m3-btn-outlined mb-2"
                    onClick={()=>fileInputRef.current?.click()}
                    disabled={saving}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    选择头像
                  </button>
                  <p className="text-body-small text-surface-on-variant">
                    支持 JPG/PNG/WebP，≤5MB
                  </p>
                  {avatarFileName && (
                    <p className="text-body-small text-surface-on mt-1">
                      已选择：{avatarFileName}
                    </p>
                  )}
                  {(avatarPreview || avatarFile) && (
                    <button
                      type="button"
                      className="m3-btn-text text-body-small mt-1"
                      onClick={()=>{
                        setAvatarFile(null); setAvatarFileName('')
                        if (avatarPreview) { try { URL.revokeObjectURL(avatarPreview) } catch {} }
                        setAvatarPreview(null)
                      }}
                    >
                      清除
                    </button>
                  )}
                </div>
              </div>
              <input ref={fileInputRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{
                const file = e.target.files?.[0] || null
                setMsg('')
                setAvatarFile(file)
                if (avatarPreview) { try { URL.revokeObjectURL(avatarPreview) } catch {} }
                const url = file ? URL.createObjectURL(file) : null
                setAvatarPreview(url)
                setAvatarFileName(file ? file.name : '')
              }} />
              {!!avatarPreview && (
                <p className="text-body-small text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2 mt-2">
                  已选择新的头像，点击保存按钮后生效
                </p>
              )}
            </div>
            <div className="border-t border-outline pt-4 flex gap-3 items-center">
              <button className="m3-btn-filled" type="submit" disabled={saving}>
                {saving ? '保存中…' : '保存'}
              </button>
              <button
                type="button"
                className="m3-btn-outlined"
                onClick={()=>{
                  const init = initialFormRef.current || { nickname: '', avatarUrl: '' }
                  setForm(init)
                  setMsg('')
                  if (avatarPreview) { try { URL.revokeObjectURL(avatarPreview) } catch {} }
                  setAvatarPreview(null)
                  setAvatarFile(null)
                  setAvatarFileName('')
                }}
              >
                取消
              </button>
              {msg && (
                <div className={`rounded-sm border px-3 py-2 text-body-small ${
                  msg.includes('成功') || msg.includes('已保存') || msg.includes('已修改')
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {msg}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="card max-w-3xl">
        <div className="card-body">
          <div className="mb-6">
            <h2 className="text-title-large font-semibold text-surface-on mb-1">修改密码</h2>
            <p className="text-body-small text-surface-on-variant">
              更新您的登录密码，建议使用强密码
            </p>
          </div>
          <form className="space-y-4" onSubmit={onChangePassword}>
            <div>
              <label htmlFor="oldPassword" className="block text-body-medium font-medium text-surface-on mb-2">
                当前密码
              </label>
              <input 
                id="oldPassword"
                className="input" 
                type="password" 
                value={pwd.oldPassword} 
                onChange={e=>setPwd(p=>({ ...p, oldPassword: e.target.value }))}
                placeholder="请输入当前密码"
                required
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-body-medium font-medium text-surface-on mb-2">
                新密码
              </label>
              <input 
                id="newPassword"
                className="input" 
                type="password" 
                value={pwd.newPassword} 
                onChange={e=>setPwd(p=>({ ...p, newPassword: e.target.value }))}
                placeholder="请输入新密码（至少6位）"
                required
                minLength={6}
              />
              <p className="text-body-small text-surface-on-variant mt-1">
                密码长度至少6位，建议包含字母、数字和符号
              </p>
            </div>
            <div>
              <button className="m3-btn-filled" type="submit">
                修改密码
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


