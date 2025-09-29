'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminSidebar() {
  const pathname = usePathname()
  const items = [
    { href: '/admin/users', label: '用户管理' },
    { href: '/admin/scripts', label: '剧本列表管理' },
    { href: '/admin/review', label: '审核' },
  ]
  return (
    <nav className="flex flex-col">
      {items.map(it => {
        const active = pathname === it.href || pathname?.startsWith(it.href + '/')
        return (
          <Link key={it.href} href={it.href} className={`px-3 py-2 rounded hover:bg-gray-50 ${active ? 'bg-gray-100 text-gray-900 font-medium' : ''}`}>
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}
