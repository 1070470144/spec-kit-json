'use client'
import { useState } from 'react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [msg, setMsg] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, nickname }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setMsg(data?.error?.message || data?.error?.code || '注册失败'); return }
    setMsg('注册成功，请查收验证邮件')
  }

  return (
    <div className="container-page section">
      <h1 className="text-2xl font-semibold">注册</h1>
      <form onSubmit={onSubmit} className="space-y-3 max-w-md">
        <input className="input" placeholder="邮箱" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" placeholder="昵称（可选）" value={nickname} onChange={e=>setNickname(e.target.value)} />
        <input className="input" type="password" placeholder="密码（≥6位）" value={password} onChange={e=>setPassword(e.target.value)} />
        <div className="flex gap-2">
          <button className="btn btn-primary" type="submit">注册</button>
          <a className="btn btn-outline" href="/login">已有账号？登录</a>
        </div>
      </form>
      {msg && <div className="muted">{msg}</div>}
    </div>
  )
}
