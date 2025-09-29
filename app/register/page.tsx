'use client'
import { useState } from 'react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [msg, setMsg] = useState('')
  const [code, setCode] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, nickname }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setMsg(data?.error?.message || data?.error?.code || '注册失败'); return }
    setMsg('注册成功，验证码已发送至邮箱')
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/auth/email/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) })
    const d = await res.json().catch(()=>({}))
    if (!res.ok || d?.ok === false) { setMsg(d?.error?.message || '验证码无效或已过期'); return }
    setMsg('验证成功，请前往登录')
  }

  async function onResend() {
    setMsg('')
    const res = await fetch('/api/auth/email/resend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    const d = await res.json().catch(()=>({}))
    if (!res.ok) { setMsg(d?.error?.message || '发送失败'); return }
    setMsg('验证码已发送，请查收邮箱')
  }

  return (
    <div className="auth-hero">
      <div className="glass-card w-full max-w-xl">
        <div className="card-body space-y-7">
          <div>
            <h1 className="text-3xl font-semibold">创建账户</h1>
            <p className="subtitle mt-1">输入邮箱与密码，提交后输入邮箱验证码完成验证。</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">邮箱</label>
              <input className="input" placeholder="name@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
              <p className="subtitle mt-1">我们会向该邮箱发送 6 位验证码。</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">密码</label>
              <input className="input" type="password" placeholder="至少 6 位" value={password} onChange={e=>setPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">昵称（可选）</label>
              <input className="input" placeholder="你的昵称" value={nickname} onChange={e=>setNickname(e.target.value)} />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button className="btn btn-primary sm:w-auto w-full" type="submit" disabled={!email || password.length < 6}>注册并发送验证码</button>
              <a className="btn sm:w-auto w-full" href="/login">已有账号？登录</a>
            </div>
          </form>

          <div className="h-px bg-[var(--m3-border)]" />

          <form onSubmit={onVerify} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">验证码</label>
              <input className="input" placeholder="6 位数字" value={code} onChange={e=>setCode(e.target.value)} />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button className="btn btn-primary sm:w-auto w-full" type="submit" disabled={!email || code.length !== 6}>验证</button>
              <button className="btn btn-outline sm:w-auto w-full" type="button" onClick={onResend} disabled={!email}>重发验证码</button>
            </div>
          </form>
        </div>
      </div>
      {msg && <div className="muted mt-3 text-center">{msg}</div>}
    </div>
  )
}
