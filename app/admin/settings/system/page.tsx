'use client'
import { useEffect, useState } from 'react'

export default function SystemControlPage() {
  const [openRegister, setOpenRegister] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let aborted = false
    async function load() {
      try {
        const res = await fetch('/api/admin/settings/system', { cache: 'no-store' })
        const j = await res.json().catch(()=>({}))
        if (!aborted) setOpenRegister(Boolean(j?.data?.openRegister === 'true'))
      } catch {}
    }
    load()
    return () => { aborted = true }
  }, [])

  async function save() {
    if (openRegister === null) return
    setSaving(true); setMsg('')
    try {
      const res = await fetch('/api/admin/settings/system', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ openRegister }) })
      const j = await res.json().catch(()=>({}))
      if (!res.ok) { setMsg(j?.error?.message || '保存失败'); return }
      setMsg('保存成功')
    } finally { setSaving(false) }
  }

  return (
    <div className="container-page section">
      <div className="card">
        <div className="card-body">
          <div className="card-title">系统控制</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">是否开放注册</div>
              <div className="muted">关闭后，前台注册接口不可用</div>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!openRegister} onChange={e=>setOpenRegister(e.target.checked)} />
              <span>{openRegister ? '已开放' : '已关闭'}</span>
            </label>
          </div>
          <div className="mt-4">
            <button className="btn btn-primary" onClick={save} disabled={saving || openRegister===null}>保存</button>
          </div>
          {msg && <div className="muted mt-2">{msg}</div>}
        </div>
      </div>
    </div>
  )
}


