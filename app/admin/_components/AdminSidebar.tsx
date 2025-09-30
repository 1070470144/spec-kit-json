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
        { href: '/admin/scripts/batch', label: '批量上传' },
        { href: '/admin/review', label: '剧本审核' },
      ],
    },
    {
      label: '数据分析',
      children: [
        { href: '/admin/analytics/users', label: '用户分析' },
        { href: '/admin/analytics/scripts', label: '剧本分析' },
      ],
    },
    {
      label: '评论管理',
      children: [
        { href: '/admin/comments', label: '评论管理' },
        { href: '/admin/settings/sensitive-words', label: '敏感词设置' },
      ],
    },
    {
      label: '系统配置',
      children: [
        { href: '/admin/settings/email', label: '发送邮箱配置' },
        { href: '/admin/settings/portal', label: '门户配置' },
        { href: '/admin/settings/system', label: '系统控制' },
      ],
    },
    {
      label: '说书人认证',
      children: [
        { href: '/admin/storytellers', label: '说书人认证' },
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
    <nav className="flex flex-col space-y-1" role="navigation" aria-label="管理员导航">
      {sections.map(section => {
        if (section.href && !section.children) {
          const active = isActive(section.href)
          return (
            <Link
              key={section.label}
              href={section.href}
              className={`relative px-3 py-2.5 rounded-lg text-body-medium transition-all duration-200 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-primary/20 ${active ? 'bg-sky-100 text-sky-800 font-semibold shadow-sm' : 'text-surface-on hover:text-primary'}`}
              aria-current={active ? 'page' : undefined}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r" />}
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
              className={`relative w-full text-left px-3 py-2.5 rounded-lg text-body-medium transition-all duration-200 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center justify-between ${activeChild ? 'bg-sky-100 text-sky-800 font-semibold shadow-sm' : 'text-surface-on hover:text-primary'}`}
              aria-expanded={open}
              aria-label={`${section.label} 菜单`}
            >
              {activeChild && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r" />}
              <span className="font-medium">{section.label}</span>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {open && (
              <div className="ml-3 mt-1 flex flex-col space-y-0.5 border-l-2 border-sky-100 pl-3">
                {section.children?.map(child => {
                  const childActive = isActive(child.href)
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`relative px-3 py-2 rounded-lg text-body-small transition-all duration-200 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-primary/20 ${childActive ? 'bg-sky-100 text-sky-800 font-semibold' : 'text-surface-on-variant hover:text-primary'}`}
                      aria-current={childActive ? 'page' : undefined}
                    >
                      {childActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-primary rounded-r" />}
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
