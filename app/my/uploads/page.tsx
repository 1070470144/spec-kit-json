import { headers } from 'next/headers'

// 内联 PreviewImage 组件
function PreviewImage({ previewUrl, title }: { previewUrl?: string | null; title: string }) {
  return (
    <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center relative">
      {previewUrl ? (
        <img 
          src={previewUrl} 
          alt={title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="text-xs text-gray-400 text-center px-1">
          无图片
        </div>
      )}
    </div>
  )
}

// 内联 DeleteButton 组件
function DeleteButton({ scriptId, scriptTitle }: { scriptId: string; scriptTitle: string }) {
  return (
    <button
      onClick={() => {
        if (confirm(`确定要删除剧本 "${scriptTitle}" 吗？此操作无法撤销。`)) {
          fetch(`/api/scripts/${scriptId}/delete`, { method: 'POST' })
            .then(() => window.location.reload())
            .catch(() => alert('删除失败，请重试'))
        }
      }}
      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors md:px-3 md:py-1.5 flex-1 md:flex-initial justify-center"
    >
      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      删除
    </button>
  )
}

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

function StateBadge({ state }: { state: ScriptItem['state'] }) {
  const map: Record<ScriptItem['state'], { text: string; cls: string }> = {
    pending: { text: '待审核', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    published: { text: '已通过', cls: 'bg-green-100 text-green-700 border-green-200' },
    rejected: { text: '已驳回', cls: 'bg-red-100 text-red-700 border-red-200' },
    abandoned: { text: '已废弃', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  }
  const it = map[state]
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs border ${it.cls}`}>{it.text}</span>
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
              <div key={i.id} className="hover:bg-gray-50 transition-colors">
                {/* 桌面端布局 */}
                <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center px-6 py-4">
                  {/* 剧本信息 */}
                  <div className="col-span-4">
                    <h3 className="font-semibold text-surface-on text-base mb-1 line-clamp-1">{i.title}</h3>
                    <p className="text-sm text-surface-on-variant">作者：{i.authorName || '未知'}</p>
                  </div>
                  
                  {/* 状态 */}
                  <div className="col-span-2">
                    <StateBadge state={i.state} />
                  </div>
                  
                  {/* 上传时间 */}
                  <div className="col-span-2">
                    <div className="text-sm text-surface-on-variant">
                      {new Date(i.createdAt).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  
                  {/* 预览图 */}
                  <div className="col-span-2">
                    <PreviewImage previewUrl={i.previewUrl} title={i.title} />
                  </div>
                  
                  {/* 操作 */}
                  <div className="col-span-2">
                    <div className="flex gap-2">
                      <a 
                        href={`/scripts/${i.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        详情
                      </a>
                      <DeleteButton scriptId={i.id} scriptTitle={i.title} />
                    </div>
                  </div>
                </div>

                {/* 移动端布局 */}
                <div className="md:hidden p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-surface-on text-base mb-1 line-clamp-2">{i.title}</h3>
                      <p className="text-sm text-surface-on-variant">作者：{i.authorName || '未知'}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <PreviewImage previewUrl={i.previewUrl} title={i.title} />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StateBadge state={i.state} />
                      <div className="text-xs text-surface-on-variant">
                        {new Date(i.createdAt).toLocaleDateString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <a 
                      href={`/scripts/${i.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      详情
                    </a>
                    <DeleteButton scriptId={i.id} scriptTitle={i.title} />
                  </div>
                </div>
              </div>
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