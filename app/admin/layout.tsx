'use client'
import { usePathname } from 'next/navigation'
import AdminSidebar from './_components/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/admin/login'
  if (isLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </div>
    )
  }
  return (
    <div className="min-h-screen grid md:grid-cols-[240px_1fr]">
      <aside className="border-r bg-white p-3 md:sticky md:top-0 md:h-screen">
        <div className="text-lg font-semibold mb-3">管理员面板</div>
        <AdminSidebar />
      </aside>
      <section className="p-6">
        {children}
      </section>
    </div>
  )
}
