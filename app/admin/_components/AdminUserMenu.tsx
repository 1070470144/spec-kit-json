'use client'
import { useEffect, useState } from 'react'

type Me = { id: string; email: string; nickname?: string | null; avatarUrl?: string | null }

export default function AdminUserMenu() {
  const [me, setMe] = useState<Me | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let aborted = false
    async function load() {
      try {
        const res = await fetch('/api/admin/auth/me', { cache: 'no-store' })
        if (!res.ok) return
        const j = await res.json()
        const d = j?.data ?? j
        if (!aborted) setMe(d as Me)
      } catch {}
    }
    load()
    return () => { aborted = true }
  }, [])

  const name = me?.nickname || me?.email || '管理员'
  const avatar = me?.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=0D8ABC&color=fff&size=64'

  async function logout() {
    try { await fetch('/api/admin/auth/logout', { method: 'POST' }) } catch {}
    location.replace('/admin/login')
  }

  return (
    <div className="ml-auto flex items-center gap-2">
      <span className="text-sm text-gray-700 max-w-[12rem] truncate">{name}</span>
      <div className="relative">
        <button type="button" onClick={() => setOpen(o=>!o)} className="flex items-center px-2 py-1 rounded-full hover:bg-slate-50">
          <img src={avatar} alt={name} className="h-8 w-8 rounded-full border" />
        </button>
        {open && (
          <div className="absolute top-full right-0 mt-2 w-40 bg-white border rounded-lg shadow-md p-1 z-20">
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded" onClick={logout}>退出登录</button>
          </div>
        )}
      </div>
    </div>
  )
}


