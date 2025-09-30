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
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-display-small text-surface-on mb-2">登录</h1>
            <p className="text-body-medium text-surface-on-variant">输入邮箱与密码登录系统。</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-5 max-w-md">
            <div>
              <label htmlFor="email" className="block text-body-medium font-medium text-surface-on mb-2">邮箱</label>
              <input 
                id="email"
                className="input" 
                type="email"
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-body-medium font-medium text-surface-on mb-2">密码</label>
              <input 
                id="password"
                className="input" 
                type="password" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                placeholder="至少 6 位"
                autoComplete="current-password"
              />
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button className="m3-btn-filled" type="submit" disabled={!email || password.length < 6 || loading}>
                {loading ? '登录中…' : '登录'}
              </button>
              <a className="m3-btn-outlined" href="/forgot">忘记密码</a>
              <a className="m3-btn-text" href="/register">去注册</a>
            </div>
          </form>
          {msg && (
            <div className={`rounded-sm border px-4 py-3 text-body-small ${
              msg.includes('成功') 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
