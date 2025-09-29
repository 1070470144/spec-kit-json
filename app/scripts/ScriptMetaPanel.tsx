"use client"

import { useEffect, useState } from 'react'

type Meta = { id: string; title: string; author?: string | null; state?: string | null; images?: { id: string }[] }

export default function ScriptMetaPanel({ id }: { id: string }) {
  const [meta, setMeta] = useState<Meta | null>(null)

  useEffect(() => {
    let aborted = false
    async function load() {
      try {
        const res = await fetch(`/api/scripts/${id}`, { cache: 'no-store' })
        const j = await res.json()
        const d = (j?.data ?? j) as Meta
        if (!aborted) setMeta(d)
      } catch {
        // ignore
      }
    }
    load()
    return () => { aborted = true }
  }, [id])

  if (!meta) return null
  const count = meta.images?.length ?? 0

  return (
    <div className="mt-2 text-sm text-[var(--m3-muted)] flex flex-wrap items-center gap-x-4 gap-y-1">
      <div>图片：{count} 张</div>
      {meta.state ? <div>状态：{meta.state}</div> : null}
      <div className="truncate">作者：{meta.author || '-'}</div>
    </div>
  )
}


