'use client'
import { useState, useRef } from 'react'

type BatchResult = {
  page: number
  batchSize: number
  total: number
  processed: number
  hasMore: boolean
  success: number
  skipped: number
  failed: number
  details: Array<{ id: string; title: string; status: 'success' | 'skipped' | 'failed'; reason?: string }>
}

type Progress = {
  current: number
  total: number
  percentage: number
  hasMore: boolean
  nextPage: number | null
}

type ProcessingState = {
  isRunning: boolean
  currentBatch: number
  totalProcessed: number
  totalSuccess: number
  totalSkipped: number
  totalFailed: number
  allDetails: Array<{ id: string; title: string; status: 'success' | 'skipped' | 'failed'; reason?: string }>
  progress: Progress | null
  retryInfo?: { batch: number; attempt: number; maxAttempts: number; message?: string }
}

export default function RefreshAllPreviewsButton() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [forceRefresh, setForceRefresh] = useState(false)
  
  const [processing, setProcessing] = useState<ProcessingState>({
    isRunning: false,
    currentBatch: 0,
    totalProcessed: 0,
    totalSuccess: 0,
    totalSkipped: 0,
    totalFailed: 0,
    allDetails: [],
    progress: null
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  async function processBatch(page: number, retryCount = 0): Promise<{ success: boolean; data?: any; error?: string }> {
    const MAX_RETRIES = 2
    
    try {
      const controller = new AbortController()
      abortControllerRef.current = controller

      // 设置60秒超时，给复杂剧本更多时间
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const res = await fetch('/api/admin/scripts/refresh-all-previews', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ page, batchSize: 1, forceRefresh }),
        signal: controller.signal,
        keepalive: true
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const errorText = await res.text()
        
        // 如果是524或502/503/504错误，且还有重试机会，则重试
        if ([524, 502, 503, 504].includes(res.status) && retryCount < MAX_RETRIES) {
          console.log(`[Retry] 批次 ${page + 1} 遇到 ${res.status} 错误，${retryCount + 1}/${MAX_RETRIES} 次重试...`)
          
          // 更新重试状态
          setProcessing(prev => ({
            ...prev,
            retryInfo: { batch: page + 1, attempt: retryCount + 1, maxAttempts: MAX_RETRIES }
          }))
          
          await new Promise(resolve => setTimeout(resolve, 3000)) // 等待3秒后重试
          return processBatch(page, retryCount + 1)
        }
        
        throw new Error(`HTTP ${res.status}: ${errorText}`)
      }

      const data = await res.json()
      return { success: true, data }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // 超时错误，尝试重试
          if (retryCount < MAX_RETRIES) {
            console.log(`[Retry] 批次 ${page + 1} 超时，${retryCount + 1}/${MAX_RETRIES} 次重试...`)
            
            // 更新重试状态
            setProcessing(prev => ({
              ...prev,
              retryInfo: { batch: page + 1, attempt: retryCount + 1, maxAttempts: MAX_RETRIES }
            }))
            
            await new Promise(resolve => setTimeout(resolve, 3000))
            return processBatch(page, retryCount + 1)
          }
          return { success: false, error: '请求超时（已重试）' }
        }
        return { success: false, error: error.message }
      }
      return { success: false, error: '未知错误' }
    }
  }

  async function handleConfirm() {
    setShowConfirm(false)
    setShowProgress(true)
    
    setProcessing({
      isRunning: true,
      currentBatch: 0,
      totalProcessed: 0,
      totalSuccess: 0,
      totalSkipped: 0,
      totalFailed: 0,
      allDetails: [],
      progress: null
    })

    let currentPage = 0
    let consecutiveSuccesses = 0

    while (true) {
      const batchResult = await processBatch(currentPage)

      if (!batchResult.success) {
        // 记录失败但继续处理下一个
        console.error(`[Batch ${currentPage + 1}] Failed:`, batchResult.error)
        
        // 更新失败计数
        setProcessing(prev => ({
          ...prev,
          totalFailed: prev.totalFailed + 1,
          allDetails: [...prev.allDetails, {
            id: `batch-${currentPage}`,
            title: `批次 ${currentPage + 1}`,
            status: 'failed',
            reason: batchResult.error || '未知错误'
          }]
        }))
        
        // 继续处理下一个（不要中断整个流程）
        currentPage++
        consecutiveSuccesses++
        
        // 失败后也要检查是否还有更多批次
        if (currentPage >= (processing.progress?.total || 0)) {
          setProcessing(prev => ({
            ...prev,
            isRunning: false
          }))
          break
        }
        
        // 失败后等待2秒再继续
        await new Promise(resolve => setTimeout(resolve, 2000))
        continue
      }

      const { batch, progress } = batchResult.data.data

      // 更新处理状态，清除重试信息
      setProcessing(prev => ({
        ...prev,
        currentBatch: currentPage + 1,
        totalProcessed: progress.current,
        totalSuccess: prev.totalSuccess + batch.success,
        totalSkipped: prev.totalSkipped + batch.skipped,
        totalFailed: prev.totalFailed + batch.failed,
        allDetails: [...prev.allDetails, ...batch.details],
        progress,
        retryInfo: undefined // 清除重试信息
      }))

      // 检查是否还有更多批次
      if (!progress.hasMore) {
        // 所有批次处理完成
        setProcessing(prev => ({
          ...prev,
          isRunning: false
        }))
        break
      }

      currentPage++
      consecutiveSuccesses++
      
      // 每处理20个剧本后，休息5秒让连接恢复
      if (consecutiveSuccesses % 20 === 0) {
        console.log(`[Batch ${currentPage}] 已连续处理 ${consecutiveSuccesses} 个，休息 5 秒...`)
        setProcessing(prev => ({
          ...prev,
          retryInfo: { 
            batch: 0, 
            attempt: 0, 
            maxAttempts: 0,
            message: `已处理 ${consecutiveSuccesses} 个，休息 5 秒恢复连接...`
          } as any
        }))
        await new Promise(resolve => setTimeout(resolve, 5000))
        setProcessing(prev => ({
          ...prev,
          retryInfo: undefined
        }))
      } else {
        // 正常延迟
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  function handleCancel() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setProcessing(prev => ({
      ...prev,
      isRunning: false
    }))
  }

  function handleShowDetailedResult() {
    setShowProgress(false)
    setShowResult(true)
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={processing.isRunning}
        className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium min-h-touch"
      >
        {processing.isRunning ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            批次 {processing.currentBatch} 处理中...
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
                <p className="text-sm text-gray-600 mb-3">
                  此操作将<strong className="text-violet-600">分批处理</strong>所有已审核通过的剧本，重新生成预览图。
                </p>
                
                {/* 强制刷新选项 */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceRefresh}
                      onChange={(e) => setForceRefresh(e.target.checked)}
                      className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500"
                    />
                    <span className="text-sm text-gray-700">
                      强制刷新（包括有玩家上传图片的剧本）
                    </span>
                  </label>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 space-y-1">
                  <p className="font-medium">✨ 新特性：</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>单个处理</strong>：每次仅处理 1 个剧本，确保稳定性</li>
                    <li><strong>周期性休息</strong>：每处理 20 个剧本休息 5 秒，避免连接累积问题</li>
                    <li><strong>自动重试</strong>：遇到超时或服务器错误自动重试（最多2次）</li>
                    <li><strong>错误跳过</strong>：JSON 有问题的剧本会跳过并记录</li>
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
                开始分批处理
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 实时进度对话框 */}
      {showProgress && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">刷新预览图进度</h3>
              <p className="text-sm text-gray-600">
                {processing.isRunning ? '正在分批处理剧本预览图...' : '处理已完成'}
              </p>
            </div>

            {/* 总体进度条 */}
            {processing.progress && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">总体进度</span>
                  <span className="text-sm text-gray-500">
                    {processing.progress.current} / {processing.progress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${processing.progress.percentage}%` }}
                  ></div>
                </div>
                <div className="text-center mt-2 text-lg font-semibold text-violet-600">
                  {processing.progress.percentage}%
                </div>
              </div>
            )}

            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-blue-600">{processing.totalProcessed}</div>
                <div className="text-xs text-blue-600 mt-1">已处理</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-green-600">{processing.totalSuccess}</div>
                <div className="text-xs text-green-600 mt-1">成功</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-amber-600">{processing.totalSkipped}</div>
                <div className="text-xs text-amber-600 mt-1">跳过</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-red-600">{processing.totalFailed}</div>
                <div className="text-xs text-red-600 mt-1">失败</div>
              </div>
            </div>

            {/* 当前批次信息和重试状态 */}
            {processing.isRunning && (
              <div className="space-y-3 mb-6">
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-violet-700">
                    <div className="w-3 h-3 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                    正在处理批次 {processing.currentBatch}
                  </div>
                </div>
                
                {/* 重试状态或休息提示 */}
                {processing.retryInfo && (
                  <div className={`border rounded-lg p-3 ${
                    processing.retryInfo.message 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className={`flex items-center gap-2 text-sm ${
                      processing.retryInfo.message 
                        ? 'text-blue-700' 
                        : 'text-amber-700'
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {processing.retryInfo.message || 
                        `批次 ${processing.retryInfo.batch} 超时，正在重试 (${processing.retryInfo.attempt}/${processing.retryInfo.maxAttempts})...`
                      }
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 最近的处理结果 */}
            {processing.allDetails.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">最近处理的剧本</h4>
                <div className="max-h-32 overflow-y-auto border rounded-lg">
                  {processing.allDetails.slice(-5).map((item, index) => (
                    <div key={`${item.id}-${index}`} className={`px-3 py-2 text-sm border-b last:border-b-0 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="truncate flex-1">{item.title}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ml-2 ${
                          item.status === 'success' ? 'bg-green-100 text-green-700' :
                          item.status === 'skipped' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.status === 'success' ? '✓' : item.status === 'skipped' ? '○' : '✗'}
                        </span>
                      </div>
                      {item.reason && (
                        <div className="text-xs text-gray-500 mt-1">{item.reason}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3">
              {processing.isRunning ? (
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  取消处理
                </button>
              ) : (
                <>
                  <button
                    onClick={handleShowDetailedResult}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    查看详细结果
                  </button>
                  <button
                    onClick={() => {
                      setShowProgress(false)
                      location.reload()
                    }}
                    className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                  >
                    完成
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 详细结果对话框 */}
      {showResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">详细处理结果</h3>
              <p className="text-sm text-gray-600 mt-1">
                共处理 {processing.totalProcessed} 个剧本
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* 统计卡片 */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{processing.totalProcessed}</div>
                  <div className="text-xs text-blue-600 mt-1">总处理</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{processing.totalSuccess}</div>
                  <div className="text-xs text-green-600 mt-1">成功</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600">{processing.totalSkipped}</div>
                  <div className="text-xs text-amber-600 mt-1">跳过</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{processing.totalFailed}</div>
                  <div className="text-xs text-red-600 mt-1">失败</div>
                </div>
              </div>

              {/* 详细列表 */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h4 className="text-sm font-medium text-gray-700">全部处理详情</h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {processing.allDetails.length > 0 ? processing.allDetails.map((item, index) => (
                    <div key={`${item.id}-${index}`} className={`px-4 py-3 border-b last:border-b-0 ${
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
                  )) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      暂无处理记录
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setShowResult(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                返回
              </button>
              <button
                onClick={() => {
                  setShowResult(false)
                  setShowProgress(false)
                  location.reload()
                }}
                className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                完成并刷新
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

