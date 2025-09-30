'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function ResetPage() {
  const params = useParams<{ token: string }>()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    
    if (password.length < 6) {
      setMsg('密码至少需要 6 位')
      return
    }
    
    if (password !== confirmPassword) {
      setMsg('两次输入的密码不一致')
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch('/api/auth/password/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: params.token, password }) })
      const d = await res.json().catch(()=>({}))
      if (!res.ok) { 
        setMsg(d?.error?.message || '重置失败')
        return 
      }
      setMsg('重置成功，请前往登录')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-hero">
      <div className="glass-card w-full max-w-xl">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-headline-small text-surface-on mb-2">重置密码</h1>
            <p className="text-body-medium text-surface-on-variant">请输入新密码，至少 6 位字符。</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-5 max-w-md">
            <div>
              <label htmlFor="password" className="block text-body-medium font-medium text-surface-on mb-2">新密码</label>
              <input 
                id="password"
                className="input" 
                type="password" 
                placeholder="至少 6 位" 
                value={password} 
                onChange={e=>setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-body-medium font-medium text-surface-on mb-2">确认密码</label>
              <input 
                id="confirm-password"
                className="input" 
                type="password" 
                placeholder="再次输入密码" 
                value={confirmPassword} 
                onChange={e=>setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button className="m3-btn-filled" type="submit" disabled={!password || password.length < 6 || loading}>
                {loading ? '重置中…' : '重置密码'}
              </button>
              <a className="m3-btn-text" href="/login">去登录</a>
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
