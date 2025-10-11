'use client'
import { useEffect, useState } from 'react'
import { downloadImage } from '@/src/utils/image-converter'

type Img = { id: string; url: string; alt?: string }

export default function CenteredImagesWithLightbox({ images, title }: { images: Img[]; title?: string }) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(0)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'ArrowLeft') setCurrent(i => (i + images.length - 1) % images.length)
      if (e.key === 'ArrowRight') setCurrent(i => (i + 1) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, images.length])

  if (!images?.length) return <div className="muted">暂无图片</div>

  return (
    <div className="relative">
      <div className="flex flex-wrap justify-center gap-3 py-1">
        {images.map((img, idx) => (
          <img
            key={img.id}
            src={img.url}
            alt={img.alt || title || ''}
            className="h-44 w-auto object-contain rounded border bg-white cursor-zoom-in"
            onClick={() => { setCurrent(idx); setOpen(true) }}
          />
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <button type="button" className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl" onClick={() => setOpen(false)}>×</button>
          <button type="button" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-3xl" onClick={(e)=>{ e.stopPropagation(); setCurrent(i => (i + images.length - 1) % images.length) }}>‹</button>
          <img src={images[current]?.url} alt={title||''} className="max-h-[90vh] max-w-[90vw] object-contain rounded" onClick={(e)=>e.stopPropagation()} />
          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-3xl" onClick={(e)=>{ e.stopPropagation(); setCurrent(i => (i + 1) % images.length) }}>›</button>
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


