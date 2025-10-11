'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { downloadImage } from '@/src/utils/image-converter'

type Img = { id: string; url: string; alt?: string }

export default function Gallery({ images, title }: { images: Img[]; title?: string }) {
  const [current, setCurrent] = useState(0)
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const wrapRef = useRef<HTMLDivElement|null>(null)

  const prev = useCallback(() => {
    wrapRef.current?.scrollBy({ left: -320, behavior: 'smooth' })
  }, [])
  const next = useCallback(() => {
    wrapRef.current?.scrollBy({ left: 320, behavior: 'smooth' })
  }, [])

  const openLightbox = (idx: number) => { setCurrent(idx); setOpen(true) }
  const closeLightbox = () => setOpen(false)
  const step = (delta: number) => {
    setCurrent(i => {
      if (images.length === 0) return 0
      const n = (i + delta + images.length) % images.length
      return n
    })
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeLightbox() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1) }
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!images || images.length === 0) {
    return <div className="muted">暂无图片</div>
  }

  return (
    <div className="relative">
      <div ref={wrapRef} className="flex gap-3 overflow-x-auto py-1">
        {images.map((img, idx) => (
          <img
            key={img.id}
            src={img.url}
            alt={img.alt || title || ''}
            onClick={() => openLightbox(idx)}
            className={`h-40 w-auto object-contain rounded border bg-white flex-shrink-0 cursor-zoom-in ${idx===current ? 'ring-2 ring-blue-500' : ''}`}
          />
        ))}
      </div>
      <button type="button" onClick={prev} className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 translate-x-[-50%] h-9 w-9 rounded-full shadow bg-white/90 hover:bg-white items-center justify-center border">‹</button>
      <button type="button" onClick={next} className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-[50%] h-9 w-9 rounded-full shadow bg-white/90 hover:bg-white items-center justify-center border">›</button>

      {open && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={closeLightbox}>
          <button type="button" className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl" onClick={closeLightbox}>×</button>
          <button type="button" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-3xl" onClick={(e)=>{ e.stopPropagation(); step(-1) }}>‹</button>
          <img src={images[current]?.url} alt={title||''} className="max-h-[90vh] max-w-[90vw] object-contain rounded" onClick={(e)=>e.stopPropagation()} />
          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-3xl" onClick={(e)=>{ e.stopPropagation(); step(1) }}>›</button>
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation()
              if (downloading) return
              
              try {
                setDownloading(true)
                const filename = title ? `${title}-${current + 1}` : `image-${current + 1}`
                await downloadImage(images[current]?.url, filename)
              } catch (error) {
                console.error('图片下载失败:', error)
                alert('图片下载失败，请重试')
              } finally {
                setDownloading(false)
              }
            }}
            disabled={downloading}
            className="absolute bottom-4 right-4 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? '转换中...' : '下载图片'}
          </button>
        </div>
      )}
    </div>
  )
}


