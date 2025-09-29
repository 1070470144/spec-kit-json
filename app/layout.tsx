import './globals.css'
import Link from 'next/link'

export const metadata = { title: '血染钟楼资源平台', description: '聚合与索引剧本 JSON 与图片' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white/90 backdrop-blur">
          <nav className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-5 text-sm">
            <Link className="font-medium text-gray-900 hover:text-blue-700" href="/">首页</Link>
            <Link className="text-gray-700 hover:text-blue-700" href="/scripts">剧本列表</Link>
            <Link className="text-gray-700 hover:text-blue-700" href="/upload">上传</Link>
            <span className="ml-auto flex items-center gap-4">
              <Link className="text-gray-700 hover:text-blue-700" href="/login">登录</Link>
              <Link className="text-gray-700 hover:text-blue-700" href="/register">注册</Link>
              <Link className="text-gray-700 hover:text-blue-700" href="/admin/login">管理员登录</Link>
            </span>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl p-6">{children}</main>
      </body>
    </html>
  );
}
