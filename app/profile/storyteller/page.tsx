'use client'
import { useEffect, useRef, useState } from 'react'

export default function StorytellerApplyPage() {
  const [status, setStatus] = useState<'none'|'pending'|'approved'|'rejected'>('none')
  const [level, setLevel] = useState<number>(0)
  const [reason, setReason] = useState<string>('')
  const [img, setImg] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement|null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/storyteller/apply', { cache: 'no-store' })
        const j = await res.json().catch(()=>({}))
        const d = j?.data || j || {}
        if (d.status) setStatus(d.status)
        if (d.level) setLevel(d.level)
        if (d.reason) setReason(d.reason)
      } catch {}
    })()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    if (!img) { setMsg('请选择认证图片'); return }
    const fd = new FormData(); fd.set('file', img)
    const res = await fetch('/api/storyteller/apply', { method: 'POST', body: fd })
    const j = await res.json().catch(()=>({}))
    if (!res.ok) { setMsg(j?.error?.message || '提交失败'); return }
    setMsg('已提交审核')
    setStatus('pending')
  }

  return (
    <div className="container-page section">
      <div className="card max-w-xl">
        <div className="card-body">
          <div className="card-title">说书人认证</div>
          <div className="muted mb-2">当前状态：{status}{level>0?`（${level}★）`:''}</div>
          {status==='rejected' && !!reason && (
            <div className="text-xs text-red-600 mb-2">拒绝原因：{reason}</div>
          )}
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="flex items-center gap-3">
              <button type="button" className="btn btn-outline" onClick={()=>inputRef.current?.click()}>选择认证图片</button>
              <input ref={inputRef} className="hidden" type="file" accept="image/*" onChange={e=>{
                const f = e.target.files?.[0] || null
                setImg(f)
                if (preview) { try { URL.revokeObjectURL(preview) } catch {} }
                setPreview(f ? URL.createObjectURL(f) : null)
              }} />
            </div>
            {!!preview && <img src={preview} alt="预览" className="w-40 h-40 object-contain rounded border" />}
            <div className="flex items-center gap-2">
              <button className="btn btn-primary" type="submit">提交认证</button>
              {msg && <div className="muted">{msg}</div>}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


