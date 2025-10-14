'use client'
import { useState } from 'react'

export default function RefreshAllPreviewsButton() {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState<{
    total: number
    success: number
    skipped: number
    failed: number
    details: Array<{ id: string; title: string; status: string; reason?: string }>
  } | null>(null)

  async function handleConfirm() {
    setShowConfirm(false)
    setLoading(true)

    try {
      const res = await fetch('/api/admin/scripts/refresh-all-previews', {
        method: 'POST'
      })

      const data = await res.json()

      if (res.ok && data.data?.results) {
        setResult(data.data.results)
        setShowResult(true)
      } else {
        alert('刷新失败：' + (data?.error?.message || '未知错误'))
      }
    } catch (error) {
      console.error('Refresh failed:', error)
      alert('刷新失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium min-h-touch"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            处理中...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新剧本图片
          </>
        )}
      </button>

      {/* 确认对话框 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">刷新剧本预览图</h3>
                <p className="text-sm text-gray-600 mb-2">
                  此操作将为所有<strong className="text-violet-600">已审核通过</strong>的剧本重新生成预览图。
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 space-y-1">
                  <p className="font-medium">注意事项：</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>只会覆盖<strong>自动生成</strong>的预览图</li>
                    <li><strong>玩家上传</strong>的预览图会被保留</li>
                    <li>处理失败的剧本会继续处理其他剧本</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors min-h-touch"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors min-h-touch"
              >
                确认刷新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 结果对话框 */}
      {showResult && result && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">刷新结果</h3>
            </div>
            
            <div className="p-6 space-y-4">
              {/* 统计卡片 */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.total}</div>
                  <div className="text-xs text-blue-600 mt-1">总计</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{result.success}</div>
                  <div className="text-xs text-green-600 mt-1">成功</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600">{result.skipped}</div>
                  <div className="text-xs text-amber-600 mt-1">跳过</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                  <div className="text-xs text-red-600 mt-1">失败</div>
                </div>
              </div>

              {/* 详细列表 */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h4 className="text-sm font-medium text-gray-700">处理详情</h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {result.details.map((item, index) => (
                    <div key={item.id} className={`px-4 py-3 border-b last:border-b-0 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                          {item.reason && (
                            <p className="text-xs text-gray-500 mt-1">{item.reason}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                          item.status === 'success' ? 'bg-green-100 text-green-700' :
                          item.status === 'skipped' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.status === 'success' ? '✓ 成功' :
                           item.status === 'skipped' ? '○ 跳过' :
                           '✗ 失败'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t">
              <button
                onClick={() => {
                  setShowResult(false)
                  location.reload()
                }}
                className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors min-h-touch"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

