'use client'
import { useState } from 'react'

export default function ResetPage(props: any) {
  const params = props?.params as { token: string }
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/auth/password/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: params.token, password }) })
    const d = await res.json().catch(()=>({}))
    if (!res.ok) { setMsg(d?.error?.message || '重置失败'); return }
    setMsg('重置成功，请前往登录')
  }

  return (
    <div className="container-page section">
      <h1 className="text-2xl font-semibold">重置密码</h1>
      <form onSubmit={onSubmit} className="space-y-3 max-w-md">
        <input className="input" type="password" placeholder="新密码（≥6位）" value={password} onChange={e=>setPassword(e.target.value)} />
        <div className="flex gap-2">
          <button className="btn btn-primary" type="submit">重置</button>
          <a className="btn btn-outline" href="/login">去登录</a>
        </div>
      </form>
      {msg && <div className="muted">{msg}</div>}
    </div>
  )
}
