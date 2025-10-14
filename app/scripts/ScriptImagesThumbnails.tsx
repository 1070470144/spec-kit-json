"use client"

import { useEffect, useState } from 'react'
import SvgImage from './SvgImage'

type ScriptImage = { id: string; url: string }

export default function ScriptImagesThumbnails({ id, max = 6 }: { id: string; max?: number }) {
  const [images, setImages] = useState<ScriptImage[]>([])

  useEffect(() => {
    let aborted = false
    async function load() {
      try {
        const res = await fetch(`/api/scripts/${id}`, { cache: 'no-store' })
        const j = await res.json()
        const imgs = (j?.data?.images ?? j?.images ?? []) as ScriptImage[]
        if (!aborted) setImages(imgs)
      } catch {
        // ignore
      }
    }
    load()
    return () => { aborted = true }
  }, [id])

  if (!images.length) {
    return (
      <div className="aspect-video w-full bg-slate-100 rounded-t-xl flex items-center justify-center text-sm text-slate-400">
        无图片
      </div>
    )
  }

  const show = images.slice(0, max)
  const hasMore = images.length > max

  return (
    <div className="p-3">
      <div className="grid grid-cols-3 gap-2">
        {show.map(img => (
          <SvgImage key={img.id} src={img.url} alt="thumb" className="h-20 w-full object-cover rounded border bg-white" />
        ))}
      </div>
      {hasMore && (
        <div className="mt-2 text-xs text-[var(--m3-muted)]">还有 {images.length - max} 张图片</div>
      )}
    </div>
  )
}


