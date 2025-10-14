'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DeleteAllScriptsButton from '../_components/DeleteAllScriptsButton'
import RefreshAllPreviewsButton from '../_components/RefreshAllPreviewsButton'
import StateBadge from '../_components/StateBadge'
import AdminScriptViewModal from '../_components/AdminScriptViewModal'

type ScriptItem = { id: string; title: string; state?: string; authorName?: string | null }

// 内联列表项组件
function ScriptListItem({ 
  item, 
  index,
  pageNum,
  pageSize
}: { 
  item: ScriptItem
  index: number
  pageNum: number
  pageSize: number
}) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  
  const isAbandoned = item.state === 'abandoned'
  const displayNumber = (pageNum - 1) * pageSize + index + 1

  async function onDelete() {
    if (!confirm('确定要删除该剧本吗？此操作不可恢复')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/scripts/${item.id}/delete`, { method: 'POST' })
      if (!res.ok) { 
        alert('删除失败')
        return 
      }
      location.reload()
    } finally { 
      setDeleting(false) 
    }
  }

  async function onRestore() {
    if (!confirm('确定要恢复此剧本并转移为系统所有吗？\n\n恢复后：\n- 剧本将重新上架\n- 原用户将无法再编辑此剧本\n- 剧本归系统管理')) return
    setRestoring(true)
    try {
      const res = await fetch(`/api/admin/scripts/${item.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newState: 'published', transferOwnership: true })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(`恢复失败：${data?.error?.message || '未知错误'}`)
        return
      }
      alert('恢复成功！')
      location.reload()
    } catch (error) {
      console.error('Restore failed:', error)
      alert('恢复失败，请重试')
    } finally {
      setRestoring(false)
    }
  }
  
  return (
    <>
      {/* 桌面端表格行 */}
      <div className="hidden md:grid grid-cols-[50px_1fr_150px_120px_280px] gap-4 px-4 py-4 border-b border-outline hover:bg-gray-50 transition-colors items-center">
        <div className="text-center text-surface-on-variant text-sm font-medium">
          {displayNumber}
        </div>
        
        <div className="font-medium text-surface-on truncate" title={item.title}>
          {item.title}
        </div>
        
        <div className="text-surface-on-variant text-sm truncate" title={item.authorName || '-'}>
          {item.authorName || '-'}
        </div>
        
        <div>
          <StateBadge state={item.state} />
        </div>
        
        <div className="flex items-center justify-end gap-2">
          <button 
            className="px-3 py-1.5 text-sm rounded-md font-medium transition-colors border border-outline hover:bg-gray-50" 
            onClick={() => setOpen(true)}
          >
            查看
          </button>
          {isAbandoned ? (
            <button 
              className="px-3 py-1.5 text-sm rounded-md font-medium transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              onClick={onRestore}
              disabled={restoring}
            >
              {restoring ? '恢复中...' : '🔄 恢复'}
            </button>
          ) : (
            <a 
              className="px-3 py-1.5 text-sm rounded-md font-medium transition-colors bg-primary text-on-primary hover:bg-primary/90"
              href={`/admin/scripts/${item.id}`}
            >
              编辑
            </a>
          )}
          <button 
            className="px-3 py-1.5 text-sm rounded-md font-medium transition-colors bg-error text-on-error hover:bg-error/90 disabled:opacity-50"
            onClick={onDelete}
            disabled={deleting || restoring}
          >
            {deleting ? '删除中...' : '删除'}
          </button>
        </div>
      </div>
      
      {/* 移动端列表项 */}
      <div className="md:hidden p-4 border-b border-outline">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-surface-on-variant text-sm font-medium shrink-0">
            #{displayNumber}
          </span>
          <span className="font-medium text-surface-on flex-1">
            {item.title}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-sm text-surface-on-variant mb-3 flex-wrap">
          <span>作者：{item.authorName || '-'}</span>
          <span>·</span>
          <StateBadge state={item.state} />
        </div>
        
        <div className="flex gap-2">
          <button 
            className="flex-1 px-3 py-2 text-sm rounded-md font-medium transition-colors border border-outline hover:bg-gray-50 min-h-touch"
            onClick={() => setOpen(true)}
          >
            查看
          </button>
          {isAbandoned ? (
            <button 
              className="flex-1 px-3 py-2 text-sm rounded-md font-medium transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 min-h-touch"
              onClick={onRestore}
              disabled={restoring}
            >
              {restoring ? '恢复中...' : '🔄 恢复'}
            </button>
          ) : (
            <a 
              className="flex-1 px-3 py-2 text-sm rounded-md font-medium transition-colors bg-primary text-on-primary hover:bg-primary/90 text-center min-h-touch flex items-center justify-center"
              href={`/admin/scripts/${item.id}`}
            >
              编辑
            </a>
          )}
          <button 
            className="flex-1 px-3 py-2 text-sm rounded-md font-medium transition-colors bg-error text-on-error hover:bg-error/90 disabled:opacity-50 min-h-touch"
            onClick={onDelete}
            disabled={deleting || restoring}
          >
            {deleting ? '删除中...' : '删除'}
          </button>
        </div>
      </div>
      
      {open && <AdminScriptViewModal id={item.id} open={open} onClose={() => setOpen(false)} />}
    </>
  )
}

function AdminScriptsListContent() {
  const searchParams = useSearchParams()
  const state = searchParams?.get('state') || 'pending'
  const pageStr = searchParams?.get('page') || '1'
  const pageNum = Math.max(1, Number(pageStr))
  
  const [items, setItems] = useState<ScriptItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const pageSize = 24
  
  // 状态配置
  const states = [
    { value: 'pending', label: '待审核', emptyText: '暂无待审核的剧本' },
    { value: 'published', label: '已通过', emptyText: '还没有已发布的剧本' },
    { value: 'rejected', label: '已拒绝', emptyText: '没有已拒绝的剧本' },
    { value: 'abandoned', label: '已废弃', emptyText: '没有已废弃的剧本' },
  ]
  
  const currentState = states.find(s => s.value === state) || states[0]
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))
  const makeHref = (p: number) => `/admin/scripts?${new URLSearchParams({ state, page: String(p) }).toString()}`
  
  useEffect(() => {
    async function fetchScripts() {
      setLoading(true)
      try {
        const qs = new URLSearchParams({ 
          page: String(pageNum), 
          pageSize: String(pageSize), 
          ...(state ? { state } : {}) 
        })
        const res = await fetch(`/api/scripts?${qs.toString()}`, { cache: 'no-store' })
        const j = await res.json().catch(() => ({}))
        const fetchedItems = (j?.data?.items ?? j?.items ?? []) as ScriptItem[]
        const fetchedTotal = Number(j?.data?.total ?? j?.total ?? 0)
        setItems(fetchedItems)
        setTotal(fetchedTotal)
      } catch (error) {
        console.error('Failed to fetch scripts:', error)
        setItems([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }
    
    fetchScripts()
  }, [state, pageNum])

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="card">
        <div className="card-body p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-headline-medium font-semibold text-surface-on">剧本列表</h1>
              <p className="text-xs sm:text-sm text-surface-on-variant mt-1">
                管理所有剧本，查看不同状态的剧本
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <RefreshAllPreviewsButton />
              <DeleteAllScriptsButton />
            </div>
          </div>

          <div className="mb-6 grid grid-cols-4 sm:inline-flex rounded-sm border border-outline overflow-hidden w-full sm:w-auto" role="group" aria-label="状态筛选">
            {states.map((s) => (
              <a 
                key={s.value}
                className={`m3-segmented-btn min-h-touch text-xs sm:text-sm ${state === s.value ? 'm3-segmented-btn-active' : ''}`}
                href={`/admin/scripts?state=${s.value}`}
                aria-current={state === s.value ? 'page' : undefined}
              >
                {s.label}
              </a>
            ))}
          </div>

          {/* 表格头部 - 仅桌面端显示 */}
          <div className="hidden md:grid grid-cols-[50px_1fr_150px_120px_280px] gap-4 px-4 py-3 bg-gray-50 border-b border-outline font-medium text-sm text-surface-on-variant">
            <div className="text-center">#</div>
            <div>剧本标题</div>
            <div>作者</div>
            <div>状态</div>
            <div className="text-right">操作</div>
          </div>

          {loading ? (
            <div>
              {[...Array(10)].map((_, i) => (
                <div key={i}>
                  {/* 桌面端骨架屏 */}
                  <div className="hidden md:grid grid-cols-[50px_1fr_150px_120px_280px] gap-4 px-4 py-4 border-b border-outline">
                    <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="flex justify-end gap-2">
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  {/* 移动端骨架屏 */}
                  <div className="md:hidden p-4 border-b border-outline">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3 animate-pulse"></div>
                    <div className="flex gap-2">
                      <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {!items?.length && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-lg font-medium text-surface-on mb-1">
                    暂无剧本
                  </div>
                  <div className="text-sm text-surface-on-variant">
                    {currentState.emptyText}
                  </div>
                </div>
              )}

              {!!items?.length && (
                <div>
                  {items.map((s, idx) => (
                    <ScriptListItem 
                      key={s.id} 
                      item={s} 
                      index={idx}
                      pageNum={pageNum}
                      pageSize={pageSize}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {!loading && totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a 
                className={`m3-btn-outlined min-h-touch w-full sm:w-auto ${pageNum<=1?'opacity-60 pointer-events-none':''}`} 
                href={makeHref(Math.max(1, pageNum-1))}
                aria-label="上一页"
                aria-disabled={pageNum<=1}
              >
                上一页
              </a>
              <span className="text-sm sm:text-base text-surface-on-variant px-4 py-2">
                第 {pageNum} / {totalPages} 页 · 共 {total} 条
              </span>
              <a 
                className={`m3-btn-outlined min-h-touch w-full sm:w-auto ${pageNum>=totalPages?'opacity-60 pointer-events-none':''}`} 
                href={makeHref(Math.min(totalPages, pageNum+1))}
                aria-label="下一页"
                aria-disabled={pageNum>=totalPages}
              >
                下一页
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Wrapper component to handle Suspense boundary
export default function AdminScriptsList() {
  return (
    <Suspense fallback={
      <div className="space-y-4 sm:space-y-6">
        <div className="card">
          <div className="card-body p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-headline-medium font-semibold text-surface-on">剧本列表</h1>
                <p className="text-xs sm:text-sm text-surface-on-variant mt-1">
                  管理所有剧本，查看不同状态的剧本
                </p>
              </div>
            </div>
            
            {/* 表格头部 - 仅桌面端显示 */}
            <div className="hidden md:grid grid-cols-[50px_1fr_150px_120px_280px] gap-4 px-4 py-3 bg-gray-50 border-b border-outline font-medium text-sm text-surface-on-variant mb-0">
              <div className="text-center">#</div>
              <div>剧本标题</div>
              <div>作者</div>
              <div>状态</div>
              <div className="text-right">操作</div>
            </div>
            
            <div>
              {[...Array(10)].map((_, i) => (
                <div key={i}>
                  {/* 桌面端骨架屏 */}
                  <div className="hidden md:grid grid-cols-[50px_1fr_150px_120px_280px] gap-4 px-4 py-4 border-b border-outline">
                    <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="flex justify-end gap-2">
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  {/* 移动端骨架屏 */}
                  <div className="md:hidden p-4 border-b border-outline">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3 animate-pulse"></div>
                    <div className="flex gap-2">
                      <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <AdminScriptsListContent />
    </Suspense>
  )
}

