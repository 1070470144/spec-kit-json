import './globals.css'
import Link from 'next/link'

export const metadata = { title: '血染钟楼资源平台', description: '聚合与索引剧本 JSON 与图片' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <nav className="mx-auto max-w-5xl p-4 flex gap-4">
            <Link href="/">首页</Link>
            <Link href="/scripts">剧本列表</Link>
            <Link href="/upload">上传</Link>
            <Link href="/admin/review">审核</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl p-6">{children}</main>
      </body>
    </html>
  );
}
