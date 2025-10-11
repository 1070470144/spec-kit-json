import { headers, cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import ScriptImagesCarousel from '@/app/scripts/ScriptImagesCarousel'
import { getSession } from '@/src/auth/session'
import { prisma } from '@/src/db/client'

type Item = { 
  id: string; 
  title: string; 
  state: string; 
  createdAt?: string;
  rejectReason?: string | null;
  previewUrl: string;
  hasAutoPreview: boolean;
}

async function fetchMyUploads(page = 1, pageSize = 24) {
  const session = await getSession()
  if (!session) {
    return { items: [], total: 0, page, pageSize }
  }
  
  const skip = (page - 1) * pageSize
  const [scripts, total] = await Promise.all([
    prisma.script.findMany({
      where: { createdById: session.userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        state: true,
        createdAt: true,
        images: {
          select: { path: true, isCover: true, sortOrder: true },
          take: 3,
          orderBy: { sortOrder: 'asc' }
        },
        reviews: {
          where: { decision: 'rejected' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { reason: true }
        }
      }
    }),
    prisma.script.count({ where: { createdById: session.userId } })
  ])
  
  const items: Item[] = scripts.map(s => {
    // 计算预览图 URL
    let previewUrl: string
    let hasAutoPreview = false
    
    if (s.images && s.images[0]?.path) {
      previewUrl = `/api/files?path=${encodeURIComponent(s.images[0].path)}`
      hasAutoPreview = false
    } else {
      // 没有图片时使用自动预览图
      previewUrl = `/api/scripts/${s.id}/auto-preview`
      hasAutoPreview = true
    }
    
    return {
      id: s.id,
      title: s.title,
      state: s.state,
      createdAt: s.createdAt.toISOString(),
      rejectReason: s.reviews[0]?.reason || null,
      previewUrl,
      hasAutoPreview
    }
  })
  
  return { items, total, page, pageSize }
}

export default async function MyUploadsPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const sp = searchParams ? await searchParams : undefined
  const pageNum = Math.max(1, Number(sp?.page || '1'))
  const { items, total, page, pageSize } = await fetchMyUploads(pageNum, 24)
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))
  const makeHref = (p: number) => `/my/uploads?${new URLSearchParams({ page: String(p) }).toString()}`
  return (
    <div className="container-page section space-y-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-surface-on mb-4">我的上传</h1>
        <p className="text-lg text-surface-on-variant max-w-2xl mx-auto">
          管理您上传的剧本，查看审核状态
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(!items || items.length === 0) && (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-title-medium font-medium text-surface-on mb-1">
              还没有上传剧本
            </div>
            <div className="text-body-small text-surface-on-variant mb-4">
              点击下方按钮开始上传您的第一个剧本
            </div>
            <a className="m3-btn-filled inline-flex items-center gap-2" href="/upload">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              上传剧本
            </a>
          </div>
        )}
        {items && items.length > 0 && items.map(s => (
          <div key={s.id} className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            {/* 顶部装饰条 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500"></div>
            
            <ClientCarouselWrapper id={s.id} previewUrl={s.previewUrl} hasAutoPreview={s.hasAutoPreview} />
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className={`text-xl font-bold flex-1 ${s.state==='abandoned' ? 'line-through text-gray-400' : 'text-surface-on group-hover:text-sky-600'} transition-colors`}>
                  {s.title}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border-2 ${
                  s.state === 'pending' ? 'bg-yellow-50 text-yellow-800 border-yellow-300' :
                  s.state === 'published' ? 'bg-green-50 text-green-800 border-green-300' :
                  s.state === 'rejected' ? 'bg-red-50 text-red-800 border-red-300' :
                  'bg-gray-50 text-gray-800 border-gray-300'
                }`}>
                  {s.state === 'pending' ? '待审核' :
                   s.state === 'published' ? '已发布' :
                   s.state === 'rejected' ? '已拒绝' :
                   s.state || '-'}
                </span>
              </div>
              
              {/* 拒绝理由 */}
              {s.state === 'rejected' && s.rejectReason && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-red-800 mb-1">拒绝理由</div>
                      <div className="text-sm text-red-700">{s.rejectReason}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <a className="m3-btn-outlined text-sm px-4 py-2" href={`/scripts/${s.id}`}>
                  查看详情
                </a>
                <form className="inline" action={async () => {
                  'use server'
                  const h = await headers()
                  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
                  const proto = h.get('x-forwarded-proto') || 'http'
                  const base = `${proto}://${host}`
                  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
                  const res = await fetch(`${base}/api/scripts/${s.id}/delete`, { method: 'POST', headers: { cookie: cookieHeader } })
                  console.log('[Delete] Script:', s.id, 'Response:', res.status)
                  // 刷新页面数据
                  revalidatePath('/my/uploads')
                }}>
                  <button 
                    className="btn-danger text-sm px-4 py-2 rounded-xl hover:shadow-lg transition-all" 
                    type="submit"
                    title="删除这个剧本"
                  >
                    删除
                  </button>
                </form>
              </div>
            </div>
            
            {/* 悬浮边框 */}
            <div className="absolute inset-0 border-2 border-sky-500/0 group-hover:border-sky-500/20 rounded-2xl transition-all duration-500 pointer-events-none"></div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-4">
          <a 
            className={`m3-btn-outlined ${page<=1 ? 'opacity-60 pointer-events-none' : ''}`}
            href={makeHref(Math.max(1, page-1))} 
            aria-disabled={page<=1}
            aria-label="上一页"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            上一页
          </a>
          <span className="text-base font-medium text-surface-on-variant px-6">
            第 {page} / {totalPages} 页 · 共 {total} 条
          </span>
          <a 
            className={`m3-btn-outlined ${page>=totalPages ? 'opacity-60 pointer-events-none' : ''}`}
            href={makeHref(Math.min(totalPages, page+1))} 
            aria-disabled={page>=totalPages}
            aria-label="下一页"
          >
            下一页
            <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      )}
    </div>
  )
}

// 复用剧本图片轮播
function ClientCarouselWrapper({ id, previewUrl, hasAutoPreview }: { id: string; previewUrl: string; hasAutoPreview: boolean }) {
  const Carousel = require('../../scripts/ScriptImagesCarousel').default as (p: { id: string; previewUrl?: string; hasAutoPreview?: boolean }) => JSX.Element
  return <Carousel id={id} previewUrl={previewUrl} hasAutoPreview={hasAutoPreview} />
}


