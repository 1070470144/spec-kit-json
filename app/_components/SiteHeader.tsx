'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function SiteHeader() {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null
  
  const [me, setMe] = useState<{ id:string; email:string; nickname?:string|null; avatarUrl?:string|null; storytellerLevel?: number }|null>(null)
  const [open, setOpen] = useState(false) // 桌面端用户菜单
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false) // 移动端主菜单
  const menuRef = useRef<HTMLDivElement|null>(null)
  
  async function loadMe() {
    try {
      const res = await fetch('/api/me', { cache: 'no-store' })
      const j = await res.json().catch(()=>null)
      setMe(j?.data || null)
    } catch {}
  }
  
  useEffect(() => { loadMe() }, [])
  useEffect(() => {
    const onProfileUpdated = () => { loadMe() }
    window.addEventListener('profile-updated', onProfileUpdated as any)
    return () => window.removeEventListener('profile-updated', onProfileUpdated as any)
  }, [])
  
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])
  
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-white/80 backdrop-blur-xl shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 min-w-touch min-h-touch flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-xl"></div>
            <div className="relative w-full h-full flex items-center justify-center">
              <span className="text-white font-bold text-base sm:text-lg">血</span>
            </div>
          </div>
          <span className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-cyan-600 hidden sm:block">
            血染钟楼
          </span>
        </Link>
        
        {/* 桌面端导航链接 */}
        <div className="hidden md:flex items-center gap-6">
        <Link className="text-base font-medium text-gray-700 hover:text-sky-600 transition-colors" href="/">首页</Link>
        <Link className="text-base font-medium text-gray-700 hover:text-sky-600 transition-colors" href="/scripts">剧本列表</Link>
        <Link className="text-base font-medium text-gray-700 hover:text-sky-600 transition-colors" href="/leaderboard">排行榜</Link>
        <Link className="text-base font-medium text-gray-700 hover:text-sky-600 transition-colors" href="/upload">上传</Link>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {/* 移动端汉堡菜单按钮 */}
          <div className="md:hidden relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('Menu button clicked, current state:', mobileMenuOpen);
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="min-w-touch min-h-touch p-2 text-gray-700 hover:text-sky-600 transition-colors"
              aria-label="菜单"
              type="button"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* 移动端下拉菜单 */}
            {mobileMenuOpen && (
              <>
                {/* 遮罩层 */}
                <div
                  className="fixed inset-0 bg-transparent z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('遮罩层被点击');
                    setMobileMenuOpen(false);
                  }}
                />
                
                {/* 下拉菜单内容 */}
                <div className={`
                  absolute top-full right-0 w-72 max-w-[90vw] bg-white shadow-2xl rounded-2xl z-50 overflow-hidden mt-2
                  transform transition-all duration-200 origin-top-right
                  ${mobileMenuOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
                `}>
                  <div className="py-2">
                    {/* 用户信息（紧凑版） */}
                    {me && (
                      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-br from-sky-50 to-cyan-50">
                        <div className="flex items-center gap-2">
                          {me.avatarUrl ? (
                            <img src={me.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full border-2 border-sky-200 object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-white flex items-center justify-center text-sm font-semibold">
                              {(me.nickname||me.email||'')[0]?.toUpperCase()||'U'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{me.nickname || me.email}</p>
                            {!!me?.storytellerLevel && me.storytellerLevel > 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                                ★{me.storytellerLevel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* 主导航链接 */}
                    <div className="py-2">
                      <nav className="space-y-1">
                        <Link
                          href="/"
                          className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors min-h-touch"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          首页
                        </Link>
                        
                        <Link
                          href="/scripts"
                          className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors min-h-touch"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          剧本列表
                        </Link>
                        
                        <Link
                          href="/leaderboard"
                          className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors min-h-touch"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          排行榜
                        </Link>
                        
                        <Link
                          href="/upload"
                          className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors min-h-touch"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          上传剧本
                        </Link>
                        
                        {/* 用户菜单（已登录） */}
                        {me && (
                          <>
                            <div className="border-t border-gray-100 my-1"></div>
                            <Link
                              href="/profile"
                              className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors min-h-touch"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              我的资料
                            </Link>
                            
                            <Link
                              href="/my/uploads"
                              className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors min-h-touch"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              我的上传
                            </Link>
                            
                            <Link
                              href="/my/favorites"
                              className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors min-h-touch"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              我的收藏
                            </Link>
                            
                            <Link
                              href="/profile/storyteller"
                              className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors min-h-touch"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              认证说书人
                            </Link>
                          </>
                        )}
                        
                        {/* 登录/注册按钮（未登录状态） */}
                        {!me && (
                          <>
                            <div className="border-t border-gray-100 my-1"></div>
                            <Link
                              href="/login"
                              className="flex items-center justify-center gap-2 mx-4 py-3 text-base font-semibold text-sky-600 border border-sky-300 hover:bg-sky-50 rounded-lg transition-all min-h-touch"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              登录
                            </Link>
                            <Link
                              href="/register"
                              className="flex items-center justify-center gap-2 mx-4 mt-2 py-3 text-base font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-600 rounded-lg shadow-md hover:shadow-lg transition-all min-h-touch"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              注册
                            </Link>
                          </>
                        )}
                        
                        {/* 退出按钮（已登录状态） */}
                        {me && (
                          <>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button 
                              className="w-full flex items-center justify-center gap-2 mx-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-touch"
                              onClick={async()=>{ 
                                try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
                                setMobileMenuOpen(false)
                                location.replace('/') 
                              }}
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              退出登录
                            </button>
                          </>
                        )}
                      </nav>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* 桌面端登录/注册按钮 */}
          {!me && (
            <div className="hidden md:flex items-center gap-4">
              <Link className="text-base font-medium text-gray-700 hover:text-sky-600 transition-colors" href="/login">登录</Link>
              <Link className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-600 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300" href="/register">注册</Link>
            </div>
          )}
          
          {/* 桌面端用户菜单 */}
          {me && (
            <div className="hidden md:block relative" ref={menuRef}>
              <button 
                type="button" 
                onClick={()=>setOpen(o=>!o)} 
                className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-full hover:bg-gray-100 transition-all duration-300"
              >
                <span className="text-sm sm:text-base font-medium text-gray-800 select-none flex items-center gap-2 hidden sm:flex">
                  {me.nickname || me.email}
                  {!!me?.storytellerLevel && me.storytellerLevel > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm">
                      ★ {me.storytellerLevel}
                    </span>
                  )}
                </span>
                {me.avatarUrl ? (
                  <img src={me.avatarUrl} alt="avatar" className="w-9 h-9 rounded-full border-2 border-sky-200 object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-white flex items-center justify-center text-sm font-semibold shadow-md">
                    {(me.nickname||me.email||'')[0]?.toUpperCase()||'U'}
                  </div>
                )}
              </button>
              {open && (
                <div className="absolute right-0 mt-3 w-52 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden">
                  <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-base text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    我的资料
                  </Link>
                  <Link href="/my/uploads" className="flex items-center gap-3 px-4 py-3 text-base text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    我的上传
                  </Link>
                  <Link href="/profile/storyteller" className="flex items-center gap-3 px-4 py-3 text-base text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    认证说书人
                  </Link>
                  <Link href="/my/favorites" className="flex items-center gap-3 px-4 py-3 text-base text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    我的收藏
                  </Link>
                  <div className="border-t border-gray-100 my-2"></div>
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-3 text-base text-red-600 hover:bg-red-50 transition-colors"
                    onClick={async()=>{ try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}; location.replace('/') }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    退出登录
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}