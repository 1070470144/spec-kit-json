'use client'
import { useState } from 'react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    try {
      const res = await fetch('/api/admin/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const err = (data && data.error) || {}
        const text = err.message || err.code || '登录失败'
        setMsg(`失败：${text}`)
        return
      }
      setMsg('登录成功')
      location.replace('/admin/review')
    } catch (error: any) {
      setMsg(`失败：${error?.message || '网络错误'}`)
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input" placeholder="邮箱（例如：admin@xueran.local）" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="密码（例如：A1d$Min_2025!xr9S）" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn btn-primary w-full" type="submit">登录</button>
      </form>
      {msg && <div className="muted">{msg}</div>}
    </div>
  )
}
