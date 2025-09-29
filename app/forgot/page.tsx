'use client'
import { useState } from 'react'

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/auth/password/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    if (!res.ok) { const d = await res.json().catch(()=>({})); setMsg(d?.error?.message || '发送失败'); return }
    setMsg('如果邮箱存在，重置链接已发送（请查看控制台链接）')
  }

  return (
    <div className="container-page section">
      <h1 className="text-2xl font-semibold">忘记密码</h1>
      <form onSubmit={onSubmit} className="space-y-3 max-w-md">
        <input className="input" placeholder="邮箱" value={email} onChange={e=>setEmail(e.target.value)} />
        <div className="flex gap-2">
          <button className="btn btn-primary" type="submit">发送重置邮件</button>
          <a className="btn btn-outline" href="/login">返回登录</a>
        </div>
      </form>
      {msg && <div className="muted">{msg}</div>}
    </div>
  )
}
