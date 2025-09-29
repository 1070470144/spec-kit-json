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

  if (!me) return <div className="container-page section"><div className="muted">请先登录</div></div>

  return (
    <div className="container-page section">
      <div className="card max-w-2xl">
        <div className="card-body">
          <div className="card-title">我的资料</div>
          <div className="subtitle mb-3">更新个人昵称与头像，保存后立即生效。</div>
          <form className="space-y-3" onSubmit={onSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <div className="muted mb-1">昵称</div>
                <input className="input" value={form.nickname} onChange={e=>set('nickname', e.target.value)} placeholder="昵称" />
              </label>
              <label className="block">
                <div className="muted mb-1">头像 URL</div>
                <input className="input" value={form.avatarUrl} onChange={e=>set('avatarUrl', e.target.value)} placeholder="https://..." />
              </label>
            </div>
            <div>
              <div className="muted mb-1">头像</div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border bg-white overflow-hidden grid place-items-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar preview" className="w-full h-full object-cover" />
                  ) : form.avatarUrl ? (
                    <img src={form.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-sm text-gray-500">无头像</div>
                  )}
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
                  onClick={()=>fileInputRef.current?.click()}
                  disabled={saving}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M9 3a1 1 0 0 0-.894.553L7.382 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2.382l-.724-1.447A1 1 0 0 0 15 3H9zm3 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                  </svg>
                  选择头像
                </button>
                <div className="flex flex-col">
                  <span className="muted">支持 JPG/PNG/WebP，≤5MB</span>
                  {avatarFileName && <span className="text-xs text-gray-500 mt-1">已选择：{avatarFileName}</span>}
                </div>
                {(avatarPreview || avatarFile) && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={()=>{
                      setAvatarFile(null); setAvatarFileName('')
                      if (avatarPreview) { try { URL.revokeObjectURL(avatarPreview) } catch {} }
                      setAvatarPreview(null)
                    }}
                  >清除选择</button>
                )}
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
                <div className="muted mt-1">已选择新的头像，点击保存后生效</div>
              )}
            </div>
            <div className="border-t pt-3 flex gap-2 items-center">
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? '保存中…' : '保存'}</button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={()=>{
                  const init = initialFormRef.current || { nickname: '', avatarUrl: '' }
                  setForm(init)
                  setMsg('')
                  if (avatarPreview) { try { URL.revokeObjectURL(avatarPreview) } catch {} }
                  setAvatarPreview(null)
                  setAvatarFile(null)
                  setAvatarFileName('')
                }}
              >取消</button>
              {msg && <div className="muted">{msg}</div>}
            </div>
          </form>
        </div>
      </div>

      <div className="card max-w-2xl">
        <div className="card-body">
          <div className="card-title">修改密码</div>
          <form className="space-y-3" onSubmit={onChangePassword}>
            <label className="block">
              <div className="muted mb-1">当前密码</div>
              <input className="input" type="password" value={pwd.oldPassword} onChange={e=>setPwd(p=>({ ...p, oldPassword: e.target.value }))} />
            </label>
            <label className="block">
              <div className="muted mb-1">新密码</div>
              <input className="input" type="password" value={pwd.newPassword} onChange={e=>setPwd(p=>({ ...p, newPassword: e.target.value }))} />
            </label>
            <div className="flex gap-2 items-center">
              <button className="btn btn-primary" type="submit">修改密码</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


