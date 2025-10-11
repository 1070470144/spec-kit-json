'use client'
import { useEffect, useRef, useState } from 'react'

export default function AdminBatchUploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 })
  const [success, setSuccess] = useState(0)
  const [fails, setFails] = useState<{ name: string; reason: string }[]>([])
  const [autoGeneratePreview, setAutoGeneratePreview] = useState(false)
  const [previewSuccess, setPreviewSuccess] = useState(0)
  const [fileStatus, setFileStatus] = useState<Record<string, string>>({})
  const inputRef = useRef<HTMLInputElement|null>(null)

  // 让文件选择器支持目录选择（递归）
  useEffect(() => {
    if (inputRef.current) {
      try {
        inputRef.current.setAttribute('webkitdirectory', '')
        inputRef.current.setAttribute('directory', '')
      } catch {}
    }
  }, [])

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files || [])
    // 仅保留 .json 文件（大小写不敏感）
    const jsons = list.filter(f => /\.json$/i.test(f.name))
    setFiles(jsons)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    if (!files.length) { setMsg('请选择包含 JSON 的文件夹或 JSON 文件'); return }
    setLoading(true)
    setProgress({ done: 0, total: files.length })
    setFails([])
    setSuccess(0)
    setPreviewSuccess(0)
    setFileStatus({})
    
    let successCount = 0
    let previewCount = 0
    const failsList: { name: string; reason: string }[] = []
    
    try {
      for (const f of files) {
        // 更新状态：正在处理
        setFileStatus(prev => ({ ...prev, [f.name]: '正在解析...' }))
        
        const text = await f.text()
        let obj: unknown
        try { 
          obj = JSON.parse(text) 
        } catch {
          failsList.push({ name: f.name, reason: '非法 JSON 格式' })
          setFails(failsList)
          setFileStatus(prev => ({ ...prev, [f.name]: '❌ 解析失败' }))
          setProgress(p => ({ done: p.done + 1, total: p.total }))
          continue
        }
        
        // 上传剧本
        setFileStatus(prev => ({ ...prev, [f.name]: '正在上传...' }))
        const title = (f.name || 'untitled').replace(/\.json$/i, '')
        const res = await fetch('/api/scripts', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ title, json: obj }) 
        })
        
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          failsList.push({ name: f.name, reason: d?.error?.message || String(res.status) })
          setFails(failsList)
          setFileStatus(prev => ({ ...prev, [f.name]: '❌ 上传失败' }))
          setProgress(p => ({ done: p.done + 1, total: p.total }))
          continue
        }
        
        // 获取创建的剧本 ID
        const result = await res.json()
        const scriptId = result?.data?.id
        
        successCount++
        setSuccess(successCount)
        
        // 如果启用自动生成预览图
        if (autoGeneratePreview && scriptId) {
          try {
            setFileStatus(prev => ({ ...prev, [f.name]: '⏳ 正在生成预览图...' }))
            
            const previewRes = await fetch(`/api/scripts/${scriptId}/auto-preview`, {
              method: 'GET'
            })
            
            if (previewRes.ok) {
              previewCount++
              setPreviewSuccess(previewCount)
              setFileStatus(prev => ({ ...prev, [f.name]: '✅ 上传成功，预览图已生成' }))
              console.log(`[Preview] Generated for ${f.name} (${scriptId})`)
            } else {
              setFileStatus(prev => ({ ...prev, [f.name]: '⚠️ 上传成功，预览图生成失败' }))
              console.warn(`[Preview] Failed for ${f.name} (${scriptId})`)
            }
          } catch (error) {
            setFileStatus(prev => ({ ...prev, [f.name]: '⚠️ 上传成功，预览图生成失败' }))
            console.error(`[Preview] Error for ${f.name}:`, error)
          }
        } else {
          setFileStatus(prev => ({ ...prev, [f.name]: '✅ 上传成功' }))
        }
        
        setProgress(p => ({ done: p.done + 1, total: p.total }))
      }
      
      // 设置完成消息
      if (autoGeneratePreview) {
        setMsg(`上传完成：成功 ${successCount} 个，失败 ${failsList.length} 个，预览图生成 ${previewCount} 个`)
      } else {
        setMsg(`上传完成：成功 ${successCount} 个，失败 ${failsList.length} 个`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card max-w-4xl mx-auto">
        <div className="card-body">
          <div className="mb-6">
            <h1 className="text-headline-medium font-semibold text-surface-on mb-1">批量上传剧本</h1>
            <p className="text-body-small text-surface-on-variant">
              选择文件夹或多个 JSON 文件进行批量上传，系统将自动处理所有文件
            </p>
          </div>

          {/* 文件选择区域 */}
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-sky-400 hover:bg-sky-50/30 transition-all duration-300">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-500/10 to-cyan-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <input 
                  ref={inputRef} 
                  className="hidden" 
                  id="file-upload"
                  type="file" 
                  multiple 
                  onChange={onPick}
                  accept=".json"
                />
                <label 
                  htmlFor="file-upload" 
                  className="m3-btn-outlined cursor-pointer inline-flex"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  选择文件夹或文件
                </label>
                <p className="text-body-small text-surface-on-variant mt-3">
                  支持选择包含 JSON 文件的文件夹，或直接选择多个 JSON 文件
                </p>
              </div>
              
              {files.length > 0 && (
                <div className="mt-4 p-4 bg-sky-50 border border-sky-200 rounded-xl">
                  <div className="flex items-center justify-center gap-2 text-sky-800">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-semibold">已选择 {files.length} 个 JSON 文件</span>
                  </div>
                </div>
              )}
            </div>

            {/* 自动生成预览图选项 */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <input
                type="checkbox"
                id="auto-preview"
                checked={autoGeneratePreview}
                onChange={(e) => setAutoGeneratePreview(e.target.checked)}
                className="mt-1 w-5 h-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500 cursor-pointer"
                disabled={loading}
              />
              <label htmlFor="auto-preview" className="flex-1 cursor-pointer">
                <div className="font-semibold text-sky-900 mb-1">
                  自动生成预览图
                </div>
                <div className="text-sm text-sky-700">
                  为每个上传的剧本自动生成预览图，方便管理和浏览（会增加约 1-2 秒/个的处理时间）
                </div>
              </label>
            </div>

            {/* 提示信息 */}
            {autoGeneratePreview && files.length > 10 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <div className="font-semibold mb-1">提示</div>
                    <div>
                      您选择了 {files.length} 个文件并启用了自动生成预览图，
                      预计需要约 {Math.ceil(files.length * 2 / 60)} 分钟完成。
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                className="m3-btn-filled" 
                type="submit" 
                disabled={!files.length || loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    上传中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    开始批量上传
                  </>
                )}
              </button>
              <a className="m3-btn-outlined" href="/admin/scripts">
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                返回列表
              </a>
            </div>
          </form>

          {/* 上传进度 */}
          {progress.total > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-surface-on">上传进度</span>
                <span className="text-surface-on-variant">{progress.done} / {progress.total}</span>
              </div>
              <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-500 to-cyan-600 transition-all duration-500 rounded-full"
                  style={{ width: `${progress.total > 0 ? (progress.done / progress.total * 100) : 0}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* 统计信息 */}
          {(success > 0 || fails.length > 0) && (
            <div className={`grid ${autoGeneratePreview ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                <div className="text-3xl font-bold text-green-700 mb-1">{success}</div>
                <div className="text-sm text-green-600">成功上传</div>
              </div>
              {autoGeneratePreview && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                  <div className="text-3xl font-bold text-blue-700 mb-1">{previewSuccess}</div>
                  <div className="text-sm text-blue-600">预览图已生成</div>
                </div>
              )}
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                <div className="text-3xl font-bold text-red-700 mb-1">{fails.length}</div>
                <div className="text-sm text-red-600">上传失败</div>
              </div>
            </div>
          )}

          {/* 详细状态列表 */}
          {Object.keys(fileStatus).length > 0 && (
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-800">处理详情</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="divide-y divide-gray-100">
                  {Object.entries(fileStatus).map(([filename, status]) => (
                    <div key={filename} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <span className="font-mono text-xs text-gray-600 flex-shrink-0 max-w-xs truncate" title={filename}>
                        {filename}
                      </span>
                      <span className={`flex-1 text-sm ${
                        status.includes('✅') ? 'text-green-600 font-medium' :
                        status.includes('❌') ? 'text-red-600 font-medium' :
                        status.includes('⚠️') ? 'text-yellow-600 font-medium' :
                        status.includes('⏳') ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 失败列表 */}
          {fails.length > 0 && (
            <div className="border border-red-200 rounded-2xl overflow-hidden">
              <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                <h3 className="text-base font-semibold text-red-800">失败详情</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="text-left text-surface-on-variant">
                      <th className="px-4 py-3 font-medium">文件名</th>
                      <th className="px-4 py-3 font-medium">失败原因</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fails.map((f, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{f.name}</td>
                        <td className="px-4 py-3 text-red-600">{f.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 完成消息 */}
          {msg && (
            <div className={`rounded-xl border-2 px-6 py-4 text-center ${
              msg.includes('成功') && fails.length === 0
                ? 'bg-green-50 border-green-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className={`text-base font-semibold ${
                msg.includes('成功') && fails.length === 0
                  ? 'text-green-700' 
                  : 'text-blue-700'
              }`}>
                {msg}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


