'use client'
import { useEffect, useState } from 'react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [msg, setMsg] = useState('')
  const [code, setCode] = useState('')
  const [cooldownSec, setCooldownSec] = useState(0)
  const [hasRegistered, setHasRegistered] = useState(false)
  const [verified, setVerified] = useState(false)
  const [toast, setToast] = useState<null | { type: 'success' | 'error' | 'info'; text: string }>(null)
  const [closed, setClosed] = useState<boolean | null>(null)

  function showToast(text: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  function zh(code?: string, fallback?: string) {
    switch (code) {
      case 'REGISTER_CLOSED': return '注册已关闭，请联系管理员。'
      case 'EMAIL_EXISTS': return '该邮箱已注册，请直接登录。'
      case 'NO_PENDING': return '未找到待验证记录，请先发送验证码。'
      case 'INVALID_CODE': return '验证码错误，请检查后重新输入。'
      case 'CODE_EXPIRED': return '验证码已过期，请重新发送。'
      case 'USER_NOT_FOUND': return '用户不存在，请先注册发送验证码。'
      default: return fallback || '操作失败，请稍后重试。'
    }
  }

  useEffect(() => {
    let aborted = false
    async function check() {
      try {
        const res = await fetch('/api/admin/settings/system', { cache: 'no-store' })
        const j = await res.json().catch(()=>({}))
        if (!aborted) setClosed(String(j?.data?.openRegister) === 'false')
      } catch {}
    }
    check()
    return () => { aborted = true }
  }, [])

  async function onRegister() {
    setMsg('')
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, nickname }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data?.ok === false) { showToast(zh(data?.error?.code, data?.error?.message) || '注册失败', 'error'); return }
    setHasRegistered(true)
    showToast('验证码已发送至邮箱，请查收', 'success')
  }

  async function onVerify() {
    setMsg('')
    const res = await fetch('/api/auth/email/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) })
    const d = await res.json().catch(()=>({}))
    if (!res.ok || d?.ok === false) { showToast(zh(d?.code, d?.error?.message) || '验证码无效或已过期', 'error'); return }
    setVerified(true)
    showToast('验证成功，正在为你登录…', 'success')
    // 自动登录
    try {
      const loginRes = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const loginData = await loginRes.json().catch(()=>({}))
      if (!loginRes.ok) { showToast(zh(loginData?.error?.code, loginData?.error?.message) || '自动登录失败，请手动登录', 'error'); return }
      location.replace('/')
    } catch {
      showToast('自动登录失败，请手动登录', 'error')
    }
  }

  async function onResend() {
    setMsg('')
    const res = await fetch('/api/auth/email/resend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    const d = await res.json().catch(()=>({}))
    if (!res.ok) { showToast(zh(d?.error?.code, d?.error?.message) || '发送失败', 'error'); return }
    showToast('验证码已发送，请查收邮箱', 'success')
  }

  // 发送验证码（右侧按钮）：首次走注册发送，之后走重发；带 60s 冷却
  async function onSendCode() {
    if (cooldownSec > 0) return
    if (!email || password.length < 6) { setMsg('请先填写有效邮箱与≥6位密码'); return }
    if (!hasRegistered) {
      await onRegister()
    } else {
      await onResend()
    }
    setCooldownSec(60)
  }

  useEffect(() => {
    if (cooldownSec <= 0) return
    const t = setInterval(() => setCooldownSec(s => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [cooldownSec])

  return (
    <div className="auth-hero">
      <div className="glass-card w-full max-w-xl">
        <div className="p-6 space-y-6">
          {toast && (
            <div className={`rounded-sm border px-4 py-3 text-body-small ${
              toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              {toast.text}
            </div>
          )}
          <div>
            <h1 className="text-display-small text-surface-on mb-2">创建账户</h1>
            <p className="text-body-medium text-surface-on-variant">输入邮箱与密码，提交后输入邮箱验证码完成验证。</p>
          </div>
          {closed && (
            <div className="rounded-sm border border-yellow-200 bg-yellow-50 text-yellow-800 px-4 py-3 text-body-small">
              注册已关闭，请联系管理员开启。
            </div>
          )}
          <div className="space-y-5">
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
              />
              <p className="text-body-small text-surface-on-variant mt-1.5">我们会向该邮箱发送 6 位验证码。</p>
            </div>
            <div>
              <label htmlFor="password" className="block text-body-medium font-medium text-surface-on mb-2">密码</label>
              <input 
                id="password"
                className="input" 
                type="password" 
                placeholder="至少 6 位" 
                value={password} 
                onChange={e=>setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="nickname" className="block text-body-medium font-medium text-surface-on mb-2">昵称（可选）</label>
              <input 
                id="nickname"
                className="input" 
                placeholder="你的昵称" 
                value={nickname} 
                onChange={e=>setNickname(e.target.value)}
                autoComplete="nickname"
              />
            </div>
            <div>
              <label htmlFor="code" className="block text-body-medium font-medium text-surface-on mb-2">验证码</label>
              <div className="flex gap-2">
                <input 
                  id="code"
                  className="input flex-1" 
                  placeholder="6 位数字" 
                  value={code} 
                  onChange={e=>setCode(e.target.value)}
                  maxLength={6}
                />
                {!verified ? (
                  <button className="m3-btn-outlined whitespace-nowrap" type="button" onClick={onSendCode} disabled={cooldownSec > 0 || !!closed}>
                    {cooldownSec > 0 ? `${cooldownSec}s` : '发送验证码'}
                  </button>
                ) : (
                  <span className="text-body-small text-surface-on-variant px-2 self-center">已验证</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button className="m3-btn-filled" type="button" onClick={onVerify} disabled={!email || code.length !== 6 || !!closed}>
              注册
            </button>
            <a className="m3-btn-text" href="/login">去登录</a>
          </div>
        </div>
      </div>
    </div>
  )
}
