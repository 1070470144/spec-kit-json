'use client'
import { usePathname } from 'next/navigation'
import AdminSidebar from './_components/AdminSidebar'
import AdminUserMenu from './_components/AdminUserMenu'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/admin/login'
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
    <div className="min-h-screen grid md:grid-cols-[260px_1fr] bg-[var(--m3-bg)]">
      <aside className="border-r border-[var(--m3-border)] bg-white sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-[var(--m3-border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-on text-sm font-bold">管</span>
            </div>
            <div>
              <div className="text-title-medium font-semibold text-surface-on">管理后台</div>
              <div className="text-body-small text-surface-on-variant">Admin Panel</div>
            </div>
          </div>
        </div>
        <div className="p-3">
          <AdminSidebar />
        </div>
      </aside>
      <section className="p-0" data-admin="true">
        <div className="sticky top-0 z-10 bg-white border-b border-[var(--m3-border)] px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-headline-small font-semibold text-surface-on">控制台</div>
            <AdminUserMenu />
          </div>
        </div>
        <div className="p-6 space-y-6">
          {children}
        </div>
      </section>
    </div>
  )
}
