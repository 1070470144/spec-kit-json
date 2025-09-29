'use client'
import { usePathname } from 'next/navigation'
import AdminSidebar from './_components/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/admin/login'
  if (isLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--m3-bg)]">
        <div className="w-full max-w-md card">
          <div className="card-body">
            <div className="card-title">管理员登录</div>
            {children}
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr]">
      <aside className="border-r bg-white sticky top-0 h-screen">
        <div className="p-4 border-b">
          <div className="text-base font-semibold tracking-wide text-gray-800">管理员面板</div>
        </div>
        <div className="p-3">
          <AdminSidebar />
        </div>
      </aside>
      <section className="p-6 space-y-4" data-admin="true">
        {children}
      </section>
    </div>
  )
}
