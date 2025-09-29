'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SiteHeader() {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null
  return (
    <header className="border-b bg-white/90 backdrop-blur">
      <nav className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-5 text-sm">
        <Link className="font-medium text-gray-900 hover:text-blue-700" href="/">首页</Link>
        <Link className="text-gray-700 hover:text-blue-700" href="/scripts">剧本列表</Link>
        <Link className="text-gray-700 hover:text-blue-700" href="/upload">上传</Link>
        <span className="ml-auto flex items-center gap-4">
          <Link className="text-gray-700 hover:text-blue-700" href="/login">登录</Link>
          <Link className="text-gray-700 hover:text-blue-700" href="/register">注册</Link>
        </span>
      </nav>
    </header>
  )
}
