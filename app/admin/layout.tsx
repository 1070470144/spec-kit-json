'use client'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import AdminSidebar from './_components/AdminSidebar'
import AdminUserMenu from './_components/AdminUserMenu'
import { useMediaQuery } from '@/src/hooks/useMediaQuery'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/admin/login'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 1023px)') // < lg
  if (isLogin) {
    return (
      <div className="auth-hero">
        <div className="w-full max-w-md glass-card">
          <div className="p-8">
            <h1 className="text-display-small font-semibold text-surface-on mb-2 text-center">
              管理员后台
            </h1>
            {children}
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr] bg-[var(--m3-bg)]">
      {/* 移动端遮罩层 */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* 侧边栏 - 桌面端固定，移动端抽屉 */}
      <aside className={`
        border-r border-[var(--m3-border)] bg-white
        lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto
        fixed inset-y-0 left-0 z-50 w-64 h-screen overflow-y-auto
        transform transition-transform duration-300 ease-in-out
        ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
      `}>
        <div className="p-4 border-b border-[var(--m3-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-on text-sm font-bold">管</span>
              </div>
              <div>
                <div className="text-title-medium font-semibold text-surface-on">管理后台</div>
                <div className="text-body-small text-surface-on-variant">Admin Panel</div>
              </div>
            </div>
            {/* 移动端关闭按钮 */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="min-w-touch min-h-touch p-2 text-gray-500 hover:text-gray-700"
                aria-label="关闭菜单"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="p-3">
          <AdminSidebar />
        </div>
      </aside>
      
      <section className="p-0 min-h-screen" data-admin="true">
        <div className="sticky top-0 z-10 bg-white border-b border-[var(--m3-border)] px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            {/* 移动端菜单按钮 */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="min-w-touch min-h-touch p-2 text-gray-700 hover:text-sky-600 -ml-2"
                aria-label="打开菜单"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <div className="text-lg sm:text-xl lg:text-headline-small font-semibold text-surface-on flex-1">
              控制台
            </div>
            <AdminUserMenu />
          </div>
        </div>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {children}
        </div>
      </section>
    </div>
  )
}
