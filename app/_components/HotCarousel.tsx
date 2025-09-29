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
    <div className="relative overflow-hidden rounded-xl border bg-white">
      <div className="relative aspect-[16/6] w-full">
        <span className="absolute top-2 right-2 z-10 inline-flex items-center rounded-full bg-blue-600/90 px-2 py-1 text-[10px] md:text-xs font-medium text-white shadow">
          近7天热度
        </span>
        {data.map((it, i) => (
          <a
            key={it.scriptId}
            href={`/scripts/${it.scriptId}`}
            className={`absolute inset-0 block transition-opacity duration-700 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
          >
            {it.cover ? (
              <img src={it.cover} alt={it.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-200 to-slate-100 grid place-items-center text-slate-500 text-sm">
                暂无封面
              </div>
            )}
            <div className="absolute inset-x-0 top-0 p-4 md:p-6 bg-gradient-to-b from-black/60 to-transparent text-white">
              <div className="text-lg md:text-xl font-semibold truncate">{it.title}</div>
              <div className="text-xs md:text-sm opacity-90">下载：{it.downloads}</div>
            </div>
          </a>
        ))}
      </div>
      {data.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1">
          {data.map((_, i) => (
            <button key={i} aria-label={`goto ${i+1}`} onClick={()=>setIdx(i)} className={`h-1.5 w-1.5 rounded-full ${i===idx?'bg-white':'bg-white/60'}`} />
          ))}
        </div>
      )}
      {data.length > 1 && (
        <>
          <button aria-label="prev" onClick={()=>setIdx(i=> (i+data.length-1)%data.length)} className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-white/90 hover:bg-white shadow">‹</button>
          <button aria-label="next" onClick={()=>setIdx(i=> (i+1)%data.length)} className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-white/90 hover:bg-white shadow">›</button>
        </>
      )}
    </div>
  )
}


