'use client'
import { useState } from 'react'

export default function DeleteUserButton({ 
  userId, 
  userEmail, 
  isSuper,
  onDelete 
}: { 
  userId: string; 
  userEmail: string;
  isSuper: boolean;
  onDelete: (userId: string) => Promise<void>;
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete(userId)
      setShowConfirm(false)
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setDeleting(false)
    }
  }

  if (isSuper) {
    return (
      <button 
        className="btn-danger text-body-small px-3 py-1.5 opacity-50 cursor-not-allowed" 
        disabled
        title="超级用户不能删除"
      >
        删除
      </button>
    )
  }

  return (
    <>
      <button 
        className="btn-danger text-body-small px-3 py-1.5 hover:shadow-lg transition-all" 
        type="button"
        onClick={() => setShowConfirm(true)}
        title="删除用户"
      >
        删除
      </button>

      {/* 确认对话框 - 高端设计 */}
      {showConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/40 backdrop-blur-md animate-fade-in"
          onClick={() => !deleting && setShowConfirm(false)}
        >
          <div 
            className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部装饰 - 渐变条 */}
            <div className="h-2 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500"></div>
            
            {/* 背景装饰 */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-500/5 to-rose-500/10 rounded-full blur-3xl"></div>
            
            <div className="relative p-10">
              {/* 警告图标 - 增强设计 */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl rotate-6 opacity-20 animate-pulse"></div>
                <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>

              {/* 标题 */}
              <h3 className="text-3xl font-bold text-center text-surface-on mb-4">
                确认删除用户
              </h3>
              
              {/* 用户信息卡片 */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 rounded-2xl p-4 mb-6">
                <div className="text-center">
                  <div className="text-sm text-surface-on-variant mb-1">即将删除</div>
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="font-bold text-lg text-surface-on">{userEmail}</span>
                  </div>
                </div>
              </div>

              {/* 警告信息 - 增强设计 */}
              <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 mb-8">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-amber-900 mb-2">⚠️ 危险操作警告</div>
                      <div className="text-sm text-amber-800 space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600 mt-0.5">•</span>
                          <span>删除用户的点赞、收藏和评论</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600 mt-0.5">•</span>
                          <span>删除讲述者认证申请</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600 mt-0.5">•</span>
                          <span>保留用户上传的剧本（解除关联）</span>
                        </div>
                        <div className="flex items-start gap-2 font-semibold">
                          <span className="text-red-600 mt-0.5">⚡</span>
                          <span className="text-red-700">此操作不可恢复！</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 按钮组 */}
              <div className="flex gap-4">
                <button
                  className="flex-1 px-6 py-4 text-base font-semibold text-surface-on bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-60"
                  onClick={() => setShowConfirm(false)}
                  disabled={deleting}
                >
                  取消
                </button>
                <button
                  className="flex-1 inline-flex items-center justify-center px-6 py-4 text-base font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-xl shadow-lg hover:shadow-2xl hover:from-red-500 hover:to-rose-500 hover:scale-105 transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      删除中...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      确认删除
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
