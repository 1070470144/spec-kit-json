'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    try {
      setLoading(true)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const err = (data && data.error) || {}
        const text = err.message || err.code || '登录失败'
        setMsg(text)
        return
      }
      setMsg('登录成功，正在跳转…')
      location.href = '/'
    } catch (error: any) {
      setMsg(error?.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-hero">
      <div className="glass-card w-full max-w-xl">
        <div className="card-body space-y-6">
          <div>
            <h1 className="text-3xl font-semibold">登录</h1>
            <p className="subtitle mt-1">输入邮箱与密码登录系统。</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">邮箱</label>
              <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">密码</label>
              <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="至少 6 位" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary" type="submit" disabled={!email || password.length < 6 || loading}>{loading ? '登录中…' : '登录'}</button>
              <a className="btn btn-outline" href="/forgot">忘记密码</a>
              <a className="btn" href="/register">去注册</a>
            </div>
          </form>
          {msg && <div className="muted">{msg}</div>}
        </div>
      </div>
    </div>
  )
}
