'use client'
import { useEffect, useRef, useState } from 'react'

export default function AdminBatchUploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 })
  const inputRef = useRef<HTMLInputElement|null>(null)

  // 让文件选择器支持目录选择（递归）
  useEffect(() => {
    if (inputRef.current) {
      try {
        inputRef.current.setAttribute('webkitdirectory', '')
        inputRef.current.setAttribute('directory', '')
      } catch {}
    }
  }, [])

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files || [])
    // 仅保留 .json 文件（大小写不敏感）
    const jsons = list.filter(f => /\.json$/i.test(f.name))
    setFiles(jsons)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    if (!files.length) { setMsg('请选择包含 JSON 的文件夹或 JSON 文件'); return }
    setLoading(true)
    setProgress({ done: 0, total: files.length })
    try {
      for (const f of files) {
        const text = await f.text()
        let obj: unknown
        try { obj = JSON.parse(text) } catch { setMsg(`文件 ${f.name} 不是合法 JSON`); setLoading(false); return }
        const title = (f.name || 'untitled').replace(/\.json$/i, '')
        const res = await fetch('/api/scripts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, json: obj }) })
        if (!res.ok) { const d = await res.json().catch(()=>({})); setMsg(`上传 ${f.name} 失败：${d?.error?.message||res.status}`); setLoading(false); return }
        setProgress(p => ({ done: p.done + 1, total: p.total }))
      }
      setMsg('全部上传完成')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-page section" data-admin>
      <div className="card max-w-3xl">
        <div className="card-body space-y-4">
          <div className="card-title">批量上传剧本（选择文件夹，递归上传 JSON）</div>
          <form onSubmit={onSubmit} className="space-y-3">
            <input ref={inputRef} className="input" type="file" multiple onChange={onPick} />
            {files.length > 0 && (
              <div className="muted">已选 JSON 文件：{files.length} 个</div>
            )}
            <div className="flex gap-2">
              <button className="btn btn-primary" type="submit" disabled={!files.length || loading}>{loading ? '上传中…' : '开始上传'}</button>
              <a className="btn btn-outline" href="/admin/scripts">返回列表</a>
            </div>
          </form>
          {(progress.total > 0) && (
            <div className="muted">进度：{progress.done}/{progress.total}</div>
          )}
          {msg && <div className="muted">{msg}</div>}
        </div>
      </div>
    </div>
  )
}


