'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null
  const [cfg, setCfg] = useState<{ version?: string; icp?: string; contact?: string }>({})
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/site-config', { cache: 'no-store' })
        const j = await res.json().catch(()=>({}))
        const d = j?.data || j || {}
        setCfg({ version: d['site.version'], icp: d['site.icp'], contact: d['site.contact'] })
      } catch {}
    })()
  }, [])
  return (
    <footer className="mt-auto border-t bg-white/80">
      <div className="mx-auto max-w-5xl px-4 py-2 text-xs text-gray-600 flex flex-col items-center gap-0.5">
        <span>版本：{cfg.version || '-'}</span>
        <span>备案号：{cfg.icp || '-'}</span>
        <span>联系：{cfg.contact || '-'}</span>
      </div>
    </footer>
  )
}


