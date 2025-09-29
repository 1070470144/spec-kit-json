"use client"

import { useEffect, useState, useRef } from 'react'

type ScriptImage = { id: string; url: string; isCover?: boolean }

export default function ScriptImagesCarousel({ id }: { id: string }) {
  const [images, setImages] = useState<ScriptImage[]>([])
  const [index, setIndex] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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

  useEffect(() => {
    if (!images.length) return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIndex(prev => (prev + 1) % images.length)
    }, 3000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [images])

  if (!images.length) {
    return (
      <div className="aspect-video w-full bg-slate-100 rounded-t-xl flex items-center justify-center text-sm text-slate-400">
        无图片预览
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-t-xl">
      <div className="aspect-video w-full bg-black/5">
        {images.map((img, i) => (
          <img
            key={img.id}
            src={img.url}
            alt="preview"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${i === index ? 'opacity-100' : 'opacity-0'}`}
            draggable={false}
          />
        ))}
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
          {images.map((_, i) => (
            <button
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIndex(i) }}
              aria-label={`go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}


