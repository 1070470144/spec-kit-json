'use client'
import { useEffect, useState } from 'react'

type Detail = { id: string; title: string; author?: string | null; images: { id: string; url: string }[]; json?: unknown }

export default function AdminScriptViewModal({ id, open, onClose }: { id: string; open: boolean; onClose: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null)

  useEffect(() => {
    if (!open) return
    let aborted = false
    async function load() {
      try {
        const res = await fetch(`/api/scripts/${id}`, { cache: 'no-store' })
        const j = await res.json()
        const d = (j?.data ?? j) as Detail
        if (!aborted) setDetail(d)
      } catch {}
    }
    load()
    return () => { aborted = true }
  }, [id, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl" onClick={e=>e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="text-lg font-semibold">剧本详情</div>
          <button className="btn btn-outline" onClick={onClose}>关闭</button>
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-6 max-h-[70vh] overflow-auto">
          <div className="space-y-3">
            <div className="text-base font-medium">{detail?.title || '...'}</div>
            <div className="muted">作者：{detail?.author || '-'}</div>
            <div className="grid grid-cols-2 gap-2">
              {detail?.images?.map(img => (
                <img key={img.id} src={img.url} alt="img" className="rounded border bg-white" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">JSON</div>
            <pre className="text-xs bg-slate-50 border rounded p-3 overflow-auto max-h-64">{JSON.stringify(detail?.json, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}


