'use client'
import { useEffect, useState } from 'react'

type Detail = { id: string; title: string; author?: string | null; images: { id: string; url: string }[]; json?: unknown }

export default function AdminScriptEditor({ id }: { id: string }) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [title, setTitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let aborted = false
    async function load() {
      const res = await fetch(`/api/scripts/${id}`, { cache: 'no-store' })
      const j = await res.json()
      const d = (j?.data ?? j) as Detail
      if (aborted) return
      setDetail(d)
      setTitle(d.title || '')
      setAuthorName((d.author as string) || '')
      setJsonText(JSON.stringify(d.json ?? {}, null, 2))
    }
    load()
    return () => { aborted = true }
  }, [id])

  async function saveAll() {
    setMessage('')
    setSaving(true)
    let obj: unknown | undefined = undefined
    try {
      // 允许空 JSON，不解析
      if (jsonText && jsonText.trim()) {
        obj = JSON.parse(jsonText)
      }
    } catch { setSaving(false); setMessage('JSON 无法解析'); return }
    try {
      const payload: any = { title, authorName }
      if (typeof obj !== 'undefined') payload.json = obj
      const res = await fetch(`/api/scripts/${id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const j = await res.json().catch(()=>({})); setMessage(j?.error?.message || '保存失败'); setSaving(false); return }
      setMessage('已保存')
    } catch { setMessage('保存失败') }
    finally { setSaving(false) }
  }

  async function addImages(files: FileList | null) {
    if (!files || files.length === 0) return
    const form = new FormData()
    for (const f of Array.from(files)) form.append('files', f)
    const res = await fetch(`/api/scripts/${id}/images`, { method: 'POST', body: form })
    const j = await res.json().catch(()=>({}))
    if (!res.ok) { setMessage(j?.error?.message || '上传失败'); return }
    // refresh detail
    const r = await fetch(`/api/scripts/${id}`, { cache: 'no-store' }); const jj = await r.json(); setDetail((jj?.data ?? jj) as Detail)
    setMessage('图片已添加')
  }

  async function removeImage(imageId: string) {
    const res = await fetch(`/api/scripts/${id}/images?imageId=${encodeURIComponent(imageId)}`, { method: 'DELETE' })
    const j = await res.json().catch(()=>({}))
    if (!res.ok) { setMessage(j?.error?.message || '删除失败'); return }
    const r = await fetch(`/api/scripts/${id}`, { cache: 'no-store' }); const jj = await r.json(); setDetail((jj?.data ?? jj) as Detail)
    setMessage('图片已删除')
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm">剧本名</div>
          <input className="input" value={title} onChange={e=>setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <div className="text-sm">作者名</div>
          <input className="input" value={authorName} onChange={e=>setAuthorName(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm">JSON 文件（粘贴内容保存为新版本）</div>
        <textarea className="textarea h-64" value={jsonText} onChange={e=>setJsonText(e.target.value)} />
      </div>

      <div className="space-y-2">
        <div className="text-sm">图片</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {detail?.images?.map(img => (
            <div key={img.id} className="relative">
              <img src={img.url} alt="img" className="rounded border bg-white" />
              <button className="btn btn-outline absolute top-1 right-1 px-2 py-1 text-xs" onClick={()=>removeImage(img.id)}>删除</button>
            </div>
          ))}
        </div>
        <div>
          <label className="btn btn-outline">
            <input type="file" accept="image/*" multiple onChange={e=>addImages(e.target.files)} className="hidden" />
            新增图片
          </label>
        </div>
      </div>

      {/* 底部统一保存按钮：一次提交标题/作者/JSON */}
      <div className="flex gap-2 pt-2 justify-end">
        <button className="btn btn-primary" onClick={saveAll} disabled={saving}>保存更改</button>
      </div>

      {message && <div className="muted">{message}</div>}
    </div>
  )
}


