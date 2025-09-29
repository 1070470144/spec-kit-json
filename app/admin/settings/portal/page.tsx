'use client'
import { useEffect, useState } from 'react'

export default function AdminPortalSettingsPage() {
  const [form, setForm] = useState({ version: '', icp: '', contact: '' })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/admin/settings/portal', { cache: 'no-store' })
      const d = await res.json().catch(()=>({}))
      if (res.ok && d?.data) {
        setForm({
          version: d.data['site.version'] || '',
          icp: d.data['site.icp'] || '',
          contact: d.data['site.contact'] || ''
        })
      }
    })()
  }, [])

  function set<K extends keyof typeof form>(k: K, v: string) { setForm(prev => ({ ...prev, [k]: v })) }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const payload = { 'site.version': form.version, 'site.icp': form.icp, 'site.contact': form.contact }
    const res = await fetch('/api/admin/settings/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const d = await res.json().catch(()=>({}))
    if (!res.ok) { setMsg(d?.error?.message || '保存失败'); return }
    setMsg('保存成功（仅超级用户可修改）')
  }

  return (
    <div className="container-page section">
      <div className="card max-w-xl">
        <div className="card-body">
          <div className="card-title">门户配置（仅超级用户可修改）</div>
          <form onSubmit={onSubmit} className="space-y-3">
            <input className="input" placeholder="网站版本号，如 v1.0.0" value={form.version} onChange={e=>set('version', e.target.value)} />
            <input className="input" placeholder="备案号，例如：粤ICP备xxxx号" value={form.icp} onChange={e=>set('icp', e.target.value)} />
            <input className="input" placeholder="联系信息，例如邮箱/微信/QQ群" value={form.contact} onChange={e=>set('contact', e.target.value)} />
            <button className="btn btn-primary" type="submit">保存</button>
          </form>
          {msg && <div className="muted">{msg}</div>}
        </div>
      </div>
    </div>
  )
}


