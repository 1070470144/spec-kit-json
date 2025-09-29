'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function AdminSidebar() {
  const pathname = usePathname()

  type NavItem = { href: string, label: string }
  type NavSection = { label: string, href?: string, children?: NavItem[] }

  const sections: NavSection[] = [
    {
      label: '用户管理',
      children: [
        { href: '/admin/users', label: '用户列表' },
        { href: '/admin/users/new', label: '新建用户' },
      ],
    },
    {
      label: '剧本管理',
      children: [
        { href: '/admin/scripts', label: '剧本列表' },
        { href: '/admin/scripts/series', label: '系列管理' },
        { href: '/admin/review', label: '剧本审核' },
      ],
    },
    {
      label: '系统配置',
      children: [
        { href: '/admin/settings/email', label: '发送邮箱配置' },
      ],
    },
  ]

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const isActive = (href: string | undefined) => {
    if (!href) return false
    // 使用精确匹配，避免 '/admin/users/new' 时同时高亮 '/admin/users'
    return pathname === href
  }

  const hasActiveChild = (children: NavItem[] | undefined) => {
    if (!children) return false
    return children.some(ch => isActive(ch.href))
  }

  return (
    <nav className="flex flex-col space-y-1">
      {sections.map(section => {
        if (section.href && !section.children) {
          const active = isActive(section.href)
          return (
            <Link
              key={section.label}
              href={section.href}
              className={`relative px-3 py-2 rounded-lg transition-colors hover:bg-blue-50/60 focus:outline-none focus:ring-2 focus:ring-blue-200 ${active ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'}`}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-[var(--m3-primary)] rounded-r" />}
              {section.label}
            </Link>
          )
        }

        const activeChild = hasActiveChild(section.children)
        const open = openSections[section.label] ?? activeChild

        return (
          <div key={section.label} className="">
            <button
              type="button"
              onClick={() => setOpenSections(s => ({ ...s, [section.label]: !open }))}
              className={`relative w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-blue-50/60 focus:outline-none focus:ring-2 focus:ring-blue-200 flex items-center justify-between ${activeChild ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'}`}
            >
              {activeChild && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-[var(--m3-primary)] rounded-r" />}
              <span>{section.label}</span>
              <span className="ml-2 text-gray-500">{open ? '▾' : '▸'}</span>
            </button>
            {open && (
              <div className="ml-2 mt-1 flex flex-col space-y-1 border-l border-[var(--m3-border)] pl-2">
                {section.children?.map(child => {
                  const childActive = isActive(child.href)
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`relative px-3 py-2 rounded-lg transition-colors hover:bg-blue-50/60 focus:outline-none focus:ring-2 focus:ring-blue-200 ${childActive ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'}`}
                    >
                      {childActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 bg-[var(--m3-primary)] rounded-r" />}
                      {child.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
