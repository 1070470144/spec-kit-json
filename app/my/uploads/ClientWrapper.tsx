'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ScriptItem = {
  id: string
  title: string
  authorName?: string | null
  state: 'pending' | 'published' | 'rejected' | 'abandoned'
  createdAt: string
  previewUrl?: string | null
}

function PreviewImage({ previewUrl, title }: { previewUrl?: string | null; title: string }) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  return (
    <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center relative">
      {previewUrl && !imageError ? (
        <>
          <img 
            src={previewUrl} 
            alt={title}
            className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}
        </>
      ) : (
        <div className="text-xs text-gray-400 text-center px-1">
          无图片
        </div>
      )}
    </div>
  )
}

function DeleteButton({ scriptId, scriptTitle }: { scriptId: string; scriptTitle: string }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/scripts/${scriptId}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        router.refresh()
        setShowConfirm(false)
      } else {
        alert('删除失败，请重试')
      }
    } catch (error) {
      alert('删除失败，请重试')
    } finally {
      setIsDeleting(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
          <h3 className="text-lg font-medium text-gray-900 text-center mb-2">确认删除</h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            确定要删除剧本 <span className="font-medium">"{scriptTitle}"</span> 吗？
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors flex-1 md:flex-initial justify-center"
    >
      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      删除
    </button>
  )
}

export function ScriptListItem({ item }: { item: ScriptItem }) {
  return (
    <div className="hover:bg-gray-50 transition-colors">
      {/* 桌面端布局 */}
      <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center px-6 py-4">
        <div className="col-span-4">
          <h3 className="font-semibold text-surface-on text-base mb-1 line-clamp-1">{item.title}</h3>
          <p className="text-sm text-surface-on-variant">作者：{item.authorName || '未知'}</p>
        </div>
        
        <div className="col-span-2">
          <StateBadge state={item.state} />
        </div>
        
        <div className="col-span-2">
          <div className="text-sm text-surface-on-variant">
            {new Date(item.createdAt).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        
        <div className="col-span-2">
          <PreviewImage previewUrl={item.previewUrl} title={item.title} />
        </div>
        
        <div className="col-span-2">
          <div className="flex gap-2">
            <a 
              href={`/scripts/${item.id}`}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              详情
            </a>
            <DeleteButton scriptId={item.id} scriptTitle={item.title} />
          </div>
        </div>
      </div>

      {/* 移动端布局 */}
      <div className="md:hidden p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-surface-on text-base mb-1 line-clamp-2">{item.title}</h3>
            <p className="text-sm text-surface-on-variant">作者：{item.authorName || '未知'}</p>
          </div>
          <div className="flex-shrink-0">
            <PreviewImage previewUrl={item.previewUrl} title={item.title} />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StateBadge state={item.state} />
            <div className="text-xs text-surface-on-variant">
              {new Date(item.createdAt).toLocaleDateString('zh-CN', {
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
            href={`/scripts/${item.id}`}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            详情
          </a>
          <DeleteButton scriptId={item.id} scriptTitle={item.title} />
        </div>
      </div>
    </div>
  )
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
