'use client'
import { useEffect, useState } from 'react'

export default function AdminEmailSettingsPage() {
  const [form, setForm] = useState({ host: '', port: '465', user: '', pass: '', from: '' })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/admin/settings/email', { cache: 'no-store' })
      const d = await res.json().catch(()=>({}))
      if (res.ok && d?.data) {
        setForm({
          host: d.data['smtp.host'] || '',
          port: d.data['smtp.port'] || '465',
          user: d.data['smtp.user'] || '',
          pass: d.data['smtp.pass'] || '',
          from: d.data['mail.from'] || ''
        })
      }
    })()
  }, [])

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const payload = { 'smtp.host': form.host, 'smtp.port': form.port, 'smtp.user': form.user, 'smtp.pass': form.pass, 'mail.from': form.from }
    const res = await fetch('/api/admin/settings/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const d = await res.json().catch(()=>({}))
    if (!res.ok) { setMsg(d?.error?.message || '保存失败'); return }
    setMsg('保存成功（仅超级用户可修改）')
  }

  return (
    <div className="container-page section">
      <div className="card max-w-xl">
        <div className="card-body">
          <div className="card-title">系统配置：发送邮箱（仅超级用户可修改）</div>
          <form onSubmit={onSubmit} className="space-y-3">
            <input className="input" placeholder="SMTP 主机，例如 smtp.qq.com" value={form.host} onChange={e=>set('host', e.target.value)} />
            <input className="input" placeholder="SMTP 端口，例如 465" value={form.port} onChange={e=>set('port', e.target.value)} />
            <input className="input" placeholder="SMTP 用户（邮箱地址）" value={form.user} onChange={e=>set('user', e.target.value)} />
            <input className="input" type="password" placeholder="SMTP 授权码/密码" value={form.pass} onChange={e=>set('pass', e.target.value)} />
            <input className="input" placeholder="发件人邮箱（可与用户相同）" value={form.from} onChange={e=>set('from', e.target.value)} />
            <button className="btn btn-primary" type="submit">保存</button>
          </form>
          {msg && <div className="muted">{msg}</div>}
        </div>
      </div>
    </div>
  )
}


