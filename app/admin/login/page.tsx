'use client'
import { useState } from 'react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const err = (data && data.error) || {}
        const text = err.message || err.code || '登录失败'
        setMsg(`失败：${text}`)
        setLoading(false)
        return
      }
      setMsg('登录成功，正在跳转...')
      setTimeout(() => location.replace('/admin/review'), 500)
    } catch (error: any) {
      setMsg(`失败：${error?.message || '网络错误'}`)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-surface-on-variant text-center">
        请使用管理员账号登录后台
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-body-medium font-medium text-surface-on mb-2">
            邮箱地址
          </label>
          <input 
            id="email"
            className="input" 
            type="email"
            placeholder="admin@xueran.local" 
            value={email} 
            onChange={e=>setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-body-medium font-medium text-surface-on mb-2">
            密码
          </label>
          <input 
            id="password"
            className="input" 
            type="password" 
            placeholder="请输入密码" 
            value={password} 
            onChange={e=>setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <button 
          className="m3-btn-filled w-full" 
          type="submit"
          disabled={loading}
        >
          {loading ? '登录中...' : '登录后台'}
        </button>
      </form>
      {msg && (
        <div className={`rounded-sm border px-4 py-3 text-body-small text-center ${
          msg.includes('成功') 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {msg}
        </div>
      )}
    </div>
  )
}
