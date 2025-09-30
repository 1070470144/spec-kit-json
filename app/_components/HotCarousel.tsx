'use client'
import { useEffect, useRef, useState } from 'react'

export type HotItem = { scriptId: string; title: string; cover?: string; downloads: number }

export default function HotCarousel({ items }: { items: HotItem[] }) {
  const data = (items || [])
  const [idx, setIdx] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!data.length) return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % data.length), 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [data.length])

  if (!data.length) return null

  return (
    <div className="relative overflow-hidden m3-card-elevated">
      <div className="relative aspect-[16/6] w-full">
        <span className="absolute top-4 right-4 z-10 inline-flex items-center rounded-full bg-primary/90 px-3 py-1.5 text-label-medium text-primary-on shadow-elevation-1">
          近7天热度
        </span>
        {data.map((it, i) => (
          <a
            key={it.scriptId}
            href={`/scripts/${it.scriptId}`}
            className={`absolute inset-0 block transition-opacity duration-slow ${i === idx ? 'opacity-100' : 'opacity-0'}`}
          >
            {it.cover ? (
              <img src={it.cover} alt={it.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-surface-variant to-surface grid place-items-center text-surface-on-variant text-body-medium">
                暂无封面
              </div>
            )}
            <div className="absolute inset-x-0 top-0 p-6 md:p-8 bg-gradient-to-b from-black/60 to-transparent text-white">
              <div className="text-title-large md:text-headline-small truncate">{it.title}</div>
              <div className="text-body-small md:text-body-medium opacity-90">下载：{it.downloads}</div>
            </div>
          </a>
        ))}
      </div>
      {data.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
          {data.map((_, i) => (
            <button 
              key={i} 
              aria-label={`跳转到第 ${i+1} 张`} 
              onClick={()=>setIdx(i)} 
              className={`h-2 w-2 rounded-full transition-all duration-fast ${i===idx?'bg-white w-6':'bg-white/60'}`}
            />
          ))}
        </div>
      )}
      {data.length > 1 && (
        <>
          <button 
            aria-label="上一张" 
            onClick={()=>setIdx(i=> (i+data.length-1)%data.length)} 
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 m3-icon-btn text-surface-on"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            aria-label="下一张" 
            onClick={()=>setIdx(i=> (i+1)%data.length)} 
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 m3-icon-btn text-surface-on"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}


