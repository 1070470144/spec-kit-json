'use client'
import { useState } from 'react'

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/password/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      if (!res.ok) { 
        const d = await res.json().catch(()=>({})); 
        setMsg(d?.error?.message || '发送失败')
        return 
      }
      setMsg('如果邮箱存在，重置链接已发送（请查看控制台链接）')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-hero">
      <div className="glass-card w-full max-w-xl">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-headline-small text-surface-on mb-2">忘记密码</h1>
            <p className="text-body-medium text-surface-on-variant">输入注册邮箱，我们将发送重置密码链接。</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-5 max-w-md">
            <div>
              <label htmlFor="email" className="block text-body-medium font-medium text-surface-on mb-2">邮箱</label>
              <input 
                id="email"
                className="input" 
                type="email"
                placeholder="name@example.com" 
                value={email} 
                onChange={e=>setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button className="m3-btn-filled" type="submit" disabled={!email || loading}>
                {loading ? '发送中…' : '发送重置邮件'}
              </button>
              <a className="m3-btn-text" href="/login">返回登录</a>
            </div>
          </form>
          {msg && (
            <div className={`rounded-sm border px-4 py-3 text-body-small ${
              msg.includes('已发送') 
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
