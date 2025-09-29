'use client'
import { useState } from 'react'

export default function VerifyByCodePage() {
  const initEmail = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('email') || '') : ''
  const [email, setEmail] = useState(initEmail)
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/email/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) })
      const d = await res.json().catch(()=>({}))
      if (!res.ok || d?.ok === false) { setMsg(d?.error?.message || '验证码无效或已过期'); return }
      setMsg('验证成功，请前往登录')
    } finally {
      setLoading(false)
    }
  }

  async function onResend() {
    setMsg('')
    if (!email) { setMsg('请先填写邮箱'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/email/resend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const d = await res.json().catch(()=>({}))
      if (!res.ok) { setMsg(d?.error?.message || '发送失败'); return }
      setMsg('验证码已发送，请查收邮箱')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-page section">
      <h1 className="text-2xl font-semibold">邮箱验证</h1>
      <form onSubmit={onSubmit} className="space-y-3 max-w-md">
        <input className="input" type="email" placeholder="邮箱" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" type="text" placeholder="六位验证码" value={code} onChange={e=>setCode(e.target.value)} />
        <div className="flex gap-2">
          <button className="btn btn-primary" type="submit" disabled={loading}>验证</button>
          <button className="btn btn-outline" type="button" onClick={onResend} disabled={loading}>重发验证码</button>
          <a className="btn" href="/login">去登录</a>
        </div>
      </form>
      {msg && <div className="muted">{msg}</div>}
    </div>
  )
}


