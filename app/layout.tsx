import './globals.css'
import Link from 'next/link'
import SiteHeader from './_components/SiteHeader'
import { Inter } from 'next/font/google'
import Footer from './_components/SiteFooter'
import Toaster from './_components/Toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata = { title: '血染钟楼资源平台', description: '聚合与索引剧本 JSON 与图片' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-screen bg-gray-50 text-gray-900 flex flex-col`}>
        <SiteHeader />
        <main className="mx-auto max-w-5xl p-6 w-full flex-1">{children}</main>
        {/* client component */}
        <Toaster />
        <Footer />
      </body>
    </html>
  );
}
