import { headers } from 'next/headers'
import { ScriptListItem } from './ClientWrapper'

type ScriptItem = {
  id: string
  title: string
  authorName?: string | null
  state: 'pending' | 'published' | 'rejected' | 'abandoned'
  createdAt: string
  previewUrl?: string | null
  hasAutoPreview?: boolean
}

async function fetchMyUploads(page = 1, pageSize = 24) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const qs = new URLSearchParams({ mine: '1', page: String(page), pageSize: String(pageSize) })
  const url = `${base}/api/scripts?${qs.toString()}`
  
  const res = await fetch(url, { 
    cache: 'no-store',
    headers: {
      'Cookie': (await import('next/headers')).cookies().toString()
    }
  })
  
  const j = await res.json().catch(() => ({}))
  const items = (j?.data?.items ?? j?.items ?? []) as ScriptItem[]
  const total = Number(j?.data?.total ?? j?.total ?? 0)
  const ps = Number(j?.data?.pageSize ?? j?.pageSize ?? pageSize)
  const p = Number(j?.data?.page ?? j?.page ?? page)
  
  return { items, total, page: p, pageSize: ps }
}


export default async function MyUploadsPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const sp = searchParams ? await searchParams : undefined
  const pageNum = Math.max(1, Number(sp?.page || '1'))
  const { items, total, page, pageSize } = await fetchMyUploads(pageNum, 24)
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))
  const makeHref = (p: number) => `/my/uploads?${new URLSearchParams({ page: String(p) }).toString()}`

  return (
    <div className="container-page section space-y-6 sm:space-y-8">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-surface-on mb-3 sm:mb-4">我的上传</h1>
        <p className="text-base sm:text-lg text-surface-on-variant max-w-2xl mx-auto px-4">查看你上传的剧本（包含待审核与已通过）</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="text-lg font-medium text-surface-on mb-2">还没有上传剧本</div>
          <div className="text-surface-on-variant mb-6">点击下方按钮开始上传您的第一个剧本</div>
          <a className="m3-btn-filled inline-flex items-center gap-2" href="/upload">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            上传剧本
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* 桌面端表头 */}
          <div className="hidden md:block bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-600">
              <div className="col-span-4">剧本信息</div>
              <div className="col-span-2">状态</div>
              <div className="col-span-2">上传时间</div>
              <div className="col-span-2">预览图</div>
              <div className="col-span-2">操作</div>
            </div>
          </div>
          
          {/* 列表内容 */}
          <div className="divide-y divide-gray-100">
            {items.map(i => (
              <ScriptListItem key={i.id} item={i} />
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <a className={`m3-btn-outlined ${page<=1 ? 'opacity-60 pointer-events-none' : ''}`} href={makeHref(Math.max(1, page-1))} aria-disabled={page<=1} aria-label="上一页">
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            上一页
          </a>
          <span className="text-base font-medium text-surface-on-variant px-6">
            第 {page} / {totalPages} 页 · 共 {total} 条
          </span>
          <a className={`m3-btn-outlined ${page>=totalPages ? 'opacity-60 pointer-events-none' : ''}`} href={makeHref(Math.min(totalPages, page+1))} aria-disabled={page>=totalPages} aria-label="下一页">
            下一页
            <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </a>
        </div>
      )}
    </div>
  )
}