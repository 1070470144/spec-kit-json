'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function Footer() {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null
  const [cfg, setCfg] = useState<{ version?: string; icp?: string; contact?: string }>({})
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/site-config', { cache: 'no-store' })
        const j = await res.json().catch(()=>({}))
        const d = j?.data || j || {}
        setCfg({ version: d['site.version'], icp: d['site.icp'], contact: d['site.contact'] })
      } catch {}
    })()
  }, [])
  return (
    <footer className="mt-auto border-t border-gray-200 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2 sm:py-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-2 sm:mb-3">
          {/* 品牌信息 */}
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">血</span>
              </div>
              <span className="text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-cyan-600">
                血染钟楼资源平台
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-tight">
              汇聚全球优质剧本，为玩家和说书人提供便捷的资源分享平台
            </p>
          </div>
          
          {/* 快捷链接 - 移动端隐藏 */}
          <div className="hidden sm:block">
            <h3 className="text-xs font-semibold text-gray-900 mb-1">快捷链接</h3>
            <div className="space-y-0.5">
              <Link href="/scripts" className="block text-xs text-gray-600 hover:text-sky-600 transition-colors py-0.5">剧本列表</Link>
              <Link href="/leaderboard" className="block text-xs text-gray-600 hover:text-sky-600 transition-colors py-0.5">排行榜</Link>
              <Link href="/upload" className="block text-xs text-gray-600 hover:text-sky-600 transition-colors py-0.5">上传剧本</Link>
            </div>
          </div>
          
          {/* 关于信息 - 移动端隐藏 */}
          <div className="hidden md:block">
            <h3 className="text-xs font-semibold text-gray-900 mb-1">关于</h3>
            <div className="space-y-0.5 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>创作人：<span className="font-semibold text-sky-600">萌萌</span></span>
              </div>
              {cfg.version && <div>版本：{cfg.version}</div>}
              {cfg.contact && <div>联系：{cfg.contact}</div>}
            </div>
          </div>
        </div>
        
        {/* 底部信息栏 - 紧凑但完整 */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-2 text-xs text-gray-500">
            <div className="text-center sm:text-left">
              © 2025 血染钟楼资源平台. All rights reserved.
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
              {cfg.icp && <span className="text-center">{cfg.icp}</span>}
              <span className="flex items-center gap-1">
                Made with 
                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                by 萌萌
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}


