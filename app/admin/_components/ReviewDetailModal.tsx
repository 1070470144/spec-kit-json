'use client'
import { useEffect, useState } from 'react'

type Detail = { id: string; title: string; author?: string | null; images: { id: string; url: string }[]; json?: unknown }

export default function ReviewDetailModal({ id, open, onClose, onApproved, onRejected }: { id: string; open: boolean; onClose: () => void; onApproved: () => void; onRejected: (reason: string) => void }) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open) return
    let aborted = false
    setLoading(true)
    setDetail(null)
    
    async function load() {
      try {
        const res = await fetch(`/api/scripts/${id}`, { cache: 'no-store' })
        const j = await res.json()
        const d = (j?.data ?? j) as Detail
        if (!aborted) setDetail(d)
      } catch (error) {
        console.error('加载剧本详情失败:', error)
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    load()
    return () => { aborted = true }
  }, [id, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="m3-dialog w-full max-w-4xl" onClick={e=>e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="text-title-large text-surface-on">剧本详情</h2>
          <button 
            className="m3-icon-btn text-surface-on" 
            onClick={onClose}
            aria-label="关闭"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {loading && (
          <div className="dialog-content">
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          </div>
        )}
        
        {!loading && detail && (
          <div className="dialog-content grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-title-medium mb-1 text-surface-on">{detail.title}</h3>
                <p className="text-body-small text-surface-on-variant">作者：{detail.author || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {detail.images?.map(img => (
                  <div key={img.id} className="m3-card-elevated overflow-hidden">
                    <img src={img.url} alt="剧本图片" className="w-full h-32 object-cover" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-body-medium font-medium text-surface-on mb-2">JSON</label>
                <pre className="text-xs bg-slate-50 border border-outline rounded-sm p-4 overflow-auto max-h-64">
                  {JSON.stringify(detail.json, null, 2)}
                </pre>
              </div>
              <div>
                <label htmlFor="reject-reason" className="block text-body-medium font-medium text-surface-on mb-2">拒绝理由</label>
                <textarea 
                  id="reject-reason"
                  className="textarea" 
                  placeholder="填写拒绝理由（拒绝时必填）" 
                  value={reason} 
                  onChange={e=>setReason(e.target.value)}
                  rows={3}
                />
              </div>
              {error && (
                <div className="rounded-sm border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-body-small">
                  {error}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button 
                  className="m3-btn-filled flex-1" 
                  onClick={async () => {
                    setSubmitting(true)
                    setError('')
                    try {
                      await onApproved()
                      onClose()
                    } catch (err) {
                      setError('操作失败')
                    } finally {
                      setSubmitting(false)
                    }
                  }}
                  disabled={submitting}
                >
                  {submitting ? '处理中...' : '通过'}
                </button>
                <button 
                  className="m3-btn-outlined flex-1" 
                  onClick={async () => {
                    setError('')
                    if (!reason.trim()) {
                      setError('请填写拒绝理由')
                      return
                    }
                    setSubmitting(true)
                    try {
                      await onRejected(reason)
                      onClose()
                    } catch (err) {
                      setError('操作失败')
                    } finally {
                      setSubmitting(false)
                    }
                  }}
                  disabled={submitting}
                >
                  {submitting ? '处理中...' : '拒绝'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


