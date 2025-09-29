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

  function showToast(text: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  async function onRegister() {
    setMsg('')
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, nickname }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { showToast(data?.error?.message || data?.error?.code || '注册失败', 'error'); return }
    setHasRegistered(true)
    showToast('验证码已发送至邮箱', 'success')
  }

  async function onVerify() {
    setMsg('')
    const res = await fetch('/api/auth/email/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) })
    const d = await res.json().catch(()=>({}))
    if (!res.ok || d?.ok === false) { showToast(d?.error?.message || '验证码无效或已过期', 'error'); return }
    setVerified(true)
    showToast('验证成功，请前往登录', 'success')
  }

  async function onResend() {
    setMsg('')
    const res = await fetch('/api/auth/email/resend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    const d = await res.json().catch(()=>({}))
    if (!res.ok) { showToast(d?.error?.message || '发送失败', 'error'); return }
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
        <div className="card-body space-y-7">
          {toast && (
            <div className={`rounded-lg border px-3 py-2 text-sm ${
              toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              {toast.text}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-semibold">创建账户</h1>
            <p className="subtitle mt-1">输入邮箱与密码，提交后输入邮箱验证码完成验证。</p>
          </div>
          <div className="space-y-4">
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
            <div>
              <label className="block text-sm font-medium mb-1">验证码</label>
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="6 位数字" value={code} onChange={e=>setCode(e.target.value)} />
                {!verified ? (
                  <button className="btn btn-outline" type="button" onClick={onSendCode} disabled={cooldownSec > 0}>
                    {cooldownSec > 0 ? `${cooldownSec}s` : '发送验证码'}
                  </button>
                ) : (
                  <span className="muted px-2 self-center">已验证</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button className="btn btn-primary" type="button" onClick={onVerify} disabled={!email || code.length !== 6}>注册</button>
            <a className="btn" href="/login">去登录</a>
          </div>
        </div>
      </div>
      {/* 统一使用顶部 Toast 提示，移除页面底部提示 */}
    </div>
  )
}
