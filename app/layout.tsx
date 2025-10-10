import './globals.css'
import type { Metadata, Viewport } from 'next'
import SiteHeader from './_components/SiteHeader'
import Footer from './_components/SiteFooter'
import Toaster from './_components/Toaster'
import RegisterServiceWorker from './_components/RegisterServiceWorker'
import InstallPrompt from './_components/InstallPrompt'
import NotificationPrompt from './_components/NotificationPrompt'
import OfflineSyncManager from './_components/OfflineSyncManager'
import OnlineStatusIndicator from './_components/OnlineStatusIndicator'

export const metadata: Metadata = {
  title: '血染钟楼资源平台',
  description: 'Blood on the Clocktower 剧本分享与管理平台 - 汇聚全球优质剧本',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '血染钟楼',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0EA5E9',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
        <OnlineStatusIndicator />
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 sm:px-6 py-3 sm:py-4 w-full flex-1">{children}</main>
        <Toaster />
        <Footer />
        <RegisterServiceWorker />
        <InstallPrompt />
        <NotificationPrompt />
        <OfflineSyncManager />
      </body>
    </html>
  );
}
