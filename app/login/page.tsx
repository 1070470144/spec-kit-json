'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [msg, setMsg] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const err = (data && data.error) || {}
        const text = err.message || err.code || '登录失败'
        setMsg(`失败：${text}`)
        return
      }
      setMsg('登录成功')
      location.href = '/admin/review'
    } catch (error: any) {
      setMsg(`失败：${error?.message || '网络错误'}`)
    }
  }

  return (
    <div className="container-page section">
      <h1 className="text-2xl font-semibold">登录</h1>
      <form onSubmit={onSubmit} className="space-y-3 max-w-md">
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="邮箱" />
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="密码" />
        <div className="flex gap-2">
          <button className="btn btn-primary" type="submit">登录</button>
          <a className="btn btn-outline" href="/forgot">忘记密码</a>
        </div>
      </form>
      {msg && <div className="muted">{msg}</div>}
    </div>
  )
}
