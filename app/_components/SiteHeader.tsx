'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function SiteHeader() {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null
  const [me, setMe] = useState<{ id:string; email:string; nickname?:string|null; avatarUrl?:string|null; storytellerLevel?: number }|null>(null)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement|null>(null)
  async function loadMe() {
    try {
      const res = await fetch('/api/me', { cache: 'no-store' })
      const j = await res.json().catch(()=>null)
      setMe(j?.data || null)
    } catch {}
  }
  useEffect(() => { loadMe() }, [])
  useEffect(() => {
    const onProfileUpdated = () => { loadMe() }
    window.addEventListener('profile-updated', onProfileUpdated as any)
    return () => window.removeEventListener('profile-updated', onProfileUpdated as any)
  }, [])
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])
  return (
    <header className="border-b bg-white/90 backdrop-blur">
      <nav className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-5 text-sm">
        <Link className="font-medium text-gray-900 hover:text-blue-700" href="/">首页</Link>
        <Link className="text-gray-700 hover:text-blue-700" href="/scripts">剧本列表</Link>
        {/* 单个入口：排行榜 */}
        <Link className="text-gray-700 hover:text-blue-700" href="/leaderboard">排行榜</Link>
        <Link className="text-gray-700 hover:text-blue-700" href="/upload">上传</Link>
        <span className="ml-auto flex items-center gap-4">
          {!me && (
            <>
              <Link className="text-gray-700 hover:text-blue-700" href="/login">登录</Link>
              <Link className="text-gray-700 hover:text-blue-700" href="/register">注册</Link>
            </>
          )}
          {me && (
            <div className="relative" ref={menuRef}>
              <div className="flex items-center gap-2">
                <span className="text-gray-800 select-none flex items-center gap-2">
                  {me.nickname || me.email}
                  {!!me?.storytellerLevel && me.storytellerLevel > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] rounded bg-yellow-100 text-yellow-800">说书人 {me.storytellerLevel}★</span>
                  )}
                </span>
                <button type="button" onClick={()=>setOpen(o=>!o)} className="px-0.5 py-0.5 rounded-full hover:ring-2 hover:ring-blue-200">
                  {me.avatarUrl ? (
                    <img src={me.avatarUrl} alt="avatar" className="w-7 h-7 rounded-full border" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white grid place-items-center text-xs">{(me.nickname||me.email||'')[0]?.toUpperCase()||'U'}</div>
                  )}
                </button>
              </div>
              {open && (
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-md py-1 z-50">
                  <Link href="/profile" className="block px-3 py-2 text-sm hover:bg-slate-50">我的资料</Link>
                  <Link href="/my/uploads" className="block px-3 py-2 text-sm hover:bg-slate-50">我的上传</Link>
                  <Link href="/profile/storyteller" className="block px-3 py-2 text-sm hover:bg-slate-50">认证说书人</Link>
                  <Link href="/my/favorites" className="block px-3 py-2 text-sm hover:bg-slate-50">我的收藏</Link>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50" onClick={async()=>{ try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}; location.replace('/') }}>退出登录</button>
                </div>
              )}
            </div>
          )}
        </span>
      </nav>
    </header>
  )
}
