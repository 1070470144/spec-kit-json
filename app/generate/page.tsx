'use client'
import { useState, useRef } from 'react'

export default function GenerateImagePage() {
  const [title, setTitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [jsonFile, setJsonFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewSvg, setPreviewSvg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloadingUHD, setDownloadingUHD] = useState(false)
  const [toast, setToast] = useState<null | { type: 'success' | 'error' | 'info'; text: string }>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [finalTitle, setFinalTitle] = useState('')
  const [finalAuthor, setFinalAuthor] = useState('')
  const jsonRef = useRef<HTMLInputElement | null>(null)

  function showToast(text: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  function onPickJson(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    setJsonFile(f || null)
    // 清除之前的预览图
    if (previewUrl) {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)
    }
    if (previewSvg) {
      setPreviewSvg(null)
    }
  }

  // 生成预览图
  async function generatePreview() {
    if (!jsonFile) {
      showToast('请先选择JSON文件', 'error')
      return
    }

    setLoading(true)
    try {
      // 读取JSON文件内容
      const jsonText = await jsonFile.text()
      let json: any = {}
      
      try {
        json = JSON.parse(jsonText)
      } catch (error) {
        showToast('JSON文件格式错误', 'error')
        setLoading(false)
        return
      }

      // 从JSON中提取标题和作者（如果用户没填）
      const jsonData = json as any
      const jsonTitle = Array.isArray(jsonData) 
        ? (jsonData[0]?.name || jsonData[0]?.id || '')
        : (jsonData?.name || jsonData?.id || '')
      const jsonAuthor = Array.isArray(jsonData)
        ? (jsonData[0]?.author || '')
        : (jsonData?.author || '')

      // 确定最终的标题和作者
      const scriptTitle = title || jsonTitle || '未命名剧本'
      const scriptAuthor = authorName || jsonAuthor || '未知作者'
      
      // 保存最终的标题和作者（用于下载文件名）
      setFinalTitle(scriptTitle)
      setFinalAuthor(scriptAuthor)

      // 创建临时脚本数据
      const tempScriptData = {
        id: 'temp-generate',
        title: scriptTitle,
        author: scriptAuthor,
        json
      }

      // 调用预览生成API（统一压缩逻辑）
      const response = await fetch('/api/scripts/temp-preview/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tempScriptData)
      })

      if (response.ok) {
        // 直接读取SVG文本并内联渲染，避免<img>解码失败
        const svgText = await response.text()
        const svgTextScaled = svgText.replace(/<svg(\s[^>]*?)?>/, (m) => {
          if (/style=/.test(m)) {
            return m.replace(/style=\"([^\"]*)\"/, (s, v) => `style=\"${v};max-width:100%;width:100%;height:auto;display:block\"`)
          }
          return m.replace('<svg', '<svg style=\"max-width:100%;width:100%;height:auto;display:block\"')
        })
        setPreviewSvg(svgTextScaled)
        // 同步创建blob备用
        try {
          const svgBlob = new Blob([svgText], { type: 'image/svg+xml' })
          const blobUrl = URL.createObjectURL(svgBlob)
          if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl)
          }
          setPreviewUrl(blobUrl)
        } catch {}
        showToast('预览图生成成功！', 'success')
      } else {
        showToast('预览图生成失败', 'error')
      }
    } catch (error) {
      console.error('Preview generation failed:', error)
      showToast('预览图生成失败', 'error')
    }
    setLoading(false)
  }

  // 点击查看预览图（在当前页面模态框中打开）
  function viewPreview() {
    if (!previewSvg && !previewUrl) return
    setShowPreviewModal(true)
  }

  // 下载PNG（标准版）
  async function downloadPNG() {
    if (!previewSvg && !previewUrl) return

    setLoading(true)
    try {
      // 优先使用缓存的SVG文本
      const svgText = previewSvg || (await (await fetch(previewUrl as string)).text())

      // 调用转换API
      const convertResponse = await fetch('/api/tools/convert-svg-to-png', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ svg: svgText, quality: 'normal' })
      })

      if (convertResponse.ok) {
        const blob = await convertResponse.blob()
        const fileSizeMB = (blob.size / 1024 / 1024).toFixed(2)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        // 使用剧本名+作者名作为文件名
        const fileName = `${finalTitle}_${finalAuthor}.png`
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        showToast(`标准PNG下载成功 (${fileSizeMB}MB)`, 'success')
      } else {
        showToast('PNG转换失败', 'error')
      }
    } catch (error) {
      console.error('Download PNG failed:', error)
      showToast('下载失败', 'error')
    }
    setLoading(false)
  }

  // 下载超高清PNG
  async function downloadUltraHDPNG() {
    if (!previewSvg && !previewUrl) return

    // 提示用户
    showToast('开始生成超高清图，预计需要15-30秒，文件约30-60MB', 'info')
    
    setDownloadingUHD(true)
    const startTime = Date.now()
    
    try {
      // 优先使用缓存的SVG文本
      const svgText = previewSvg || (await (await fetch(previewUrl as string)).text())

      // 调用转换API，使用ultra质量
      const convertResponse = await fetch('/api/tools/convert-svg-to-png', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ svg: svgText, quality: 'ultra' })
      })

      if (convertResponse.ok) {
        const blob = await convertResponse.blob()
        const fileSizeMB = (blob.size / 1024 / 1024).toFixed(2)
        const duration = ((Date.now() - startTime) / 1000).toFixed(1)
        
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        // 文件名添加_UHD后缀
        const fileName = `${finalTitle}_${finalAuthor}_UHD.png`
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        showToast(`超高清图片下载成功！文件大小: ${fileSizeMB}MB，耗时: ${duration}秒`, 'success')
      } else {
        showToast('超高清图生成失败', 'error')
      }
    } catch (error) {
      console.error('Download Ultra HD PNG failed:', error)
      showToast('下载失败', 'error')
    }
    setDownloadingUHD(false)
  }

  return (
    <div className="container-page section">
      <div className="max-w-3xl">
        <h1 className="text-2xl sm:text-3xl md:text-headline-small mb-2 text-surface-on">生成剧本预览图</h1>
        <p className="text-sm sm:text-base md:text-body-medium text-surface-on-variant">
          上传剧本 JSON 文件，生成精美的预览图，支持在线查看和下载 PNG 格式
        </p>
      </div>

      <div className="m3-card-elevated max-w-3xl mt-4 sm:mt-6">
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          {toast && (
            <div className={`rounded-sm border px-4 py-3 text-body-small ${
              toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 
              toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 
              'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              {toast.text}
            </div>
          )}

          <div className="space-y-5">
            {/* 标题 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label htmlFor="title" className="text-sm sm:text-base sm:w-32 text-surface-on font-medium">名字（可选）</label>
              <input 
                id="title"
                className="input flex-1 min-h-touch text-base" 
                placeholder="不填则使用JSON中的标题" 
                value={title} 
                onChange={e=>setTitle(e.target.value)}
              />
            </div>

            {/* 作者 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label htmlFor="author" className="text-sm sm:text-base sm:w-32 text-surface-on font-medium">作者（可选）</label>
              <input 
                id="author"
                className="input flex-1 min-h-touch text-base" 
                placeholder="不填则使用JSON中的作者" 
                value={authorName} 
                onChange={e=>setAuthorName(e.target.value)} 
              />
            </div>

            {/* JSON文件 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label htmlFor="json-file" className="text-sm sm:text-base sm:w-32 text-surface-on font-medium">剧本 JSON<span className="text-error">*</span></label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
                <input 
                  ref={jsonRef} 
                  id="json-file"
                  className="hidden" 
                  type="file" 
                  accept="application/json,.json" 
                  onChange={onPickJson} 
                />
                <button 
                  type="button" 
                  className="m3-btn-outlined min-h-touch w-full sm:w-auto" 
                  onClick={() => jsonRef.current?.click()}
                >
                  选择文件
                </button>
                <span className="text-sm text-surface-on-variant truncate">
                  {jsonFile ? jsonFile.name : '未选择'}
                </span>
              </div>
            </div>

            {/* 生成按钮 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label className="text-sm sm:text-base sm:w-32 text-surface-on font-medium"></label>
              <button
                type="button"
                onClick={generatePreview}
                disabled={!jsonFile || loading}
                className="m3-btn-filled min-h-touch flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    生成中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    生成预览图
                  </>
                )}
              </button>
            </div>

            {/* 预览图显示 */}
            {(previewSvg || previewUrl) && (
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 pt-4 border-t">
                <label className="text-sm sm:text-base sm:w-32 text-surface-on font-medium sm:mt-2">预览图</label>
                <div className="flex-1 space-y-4">
                  <div 
                    className="inline-block m3-card-elevated overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300 group relative"
                    style={{ width: '280px', maxHeight: '700px' }}
                    onClick={viewPreview}
                  >
                    {previewSvg ? (
                      <div className="w-full h-auto bg-white" style={{ lineHeight: 0, overflow: 'hidden' }}>
                        {/* eslint-disable-next-line react/no-danger */}
                        <div dangerouslySetInnerHTML={{ __html: previewSvg }} />
                      </div>
                    ) : (
                      <img src={previewUrl as string} alt="预览图" className="w-full h-auto object-contain bg-white" />
                    )}
                    {/* 悬浮提示 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-3 shadow-lg">
                        <svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-surface-on-variant">点击预览图可放大查看</p>

                  {/* 下载按钮 */}
                  <div className="flex flex-wrap gap-3">
                    {/* 标准PNG */}
                    <button
                      type="button"
                      onClick={downloadPNG}
                      disabled={loading || downloadingUHD}
                      className="m3-btn-outlined flex items-center gap-2 min-h-touch disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
                          转换中...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          下载 PNG (标准)
                        </>
                      )}
                    </button>

                    {/* 超高清PNG */}
                    <button
                      type="button"
                      onClick={downloadUltraHDPNG}
                      disabled={loading || downloadingUHD}
                      className="m3-btn-filled flex items-center gap-2 min-h-touch disabled:opacity-50"
                    >
                      {downloadingUHD ? (
                        <>
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                          生成中...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          下载超高清图 ★
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* 提示文本 */}
                  <p className="text-xs text-surface-on-variant">
                    标准版 (~1-2MB) 适合网络分享 | 超高清 (~30-60MB) 极致质量 适合专业打印
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
            <a className="m3-btn-text min-h-touch text-center" href="/scripts">返回首页</a>
          </div>
        </div>
      </div>

      {/* 预览图放大模态框 */}
      {showPreviewModal && (previewSvg || previewUrl) && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowPreviewModal(false)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setShowPreviewModal(false)}
              className="sticky top-4 right-4 float-right z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* 预览图 */}
            <div className="p-4">
              {previewSvg ? (
                <div className="w-full h-auto" style={{ lineHeight: 0 }}>
                  {/* eslint-disable-next-line react/no-danger */}
                  <div dangerouslySetInnerHTML={{ __html: previewSvg }} />
                </div>
              ) : (
                <img 
                  src={previewUrl as string} 
                  alt="预览图" 
                  className="w-full h-auto object-contain"
                  style={{ maxHeight: 'calc(90vh - 4rem)' }}
                />
              )}
            </div>
            
            {/* 底部信息栏 */}
            <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent p-4 border-t">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{finalTitle}</p>
                  <p className="text-xs text-gray-500 truncate">作者: {finalAuthor}</p>
                </div>
                <div className="flex gap-2">
                  {/* 标准版 */}
                  <button
                    onClick={downloadPNG}
                    disabled={loading || downloadingUHD}
                    className="m3-btn-outlined flex items-center gap-2 whitespace-nowrap disabled:opacity-50 text-sm"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        转换中...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        标准
                      </>
                    )}
                  </button>
                  
                  {/* 超高清版 */}
                  <button
                    onClick={downloadUltraHDPNG}
                    disabled={loading || downloadingUHD}
                    className="m3-btn-filled flex items-center gap-2 whitespace-nowrap disabled:opacity-50 text-sm"
                  >
                    {downloadingUHD ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        生成中...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        超高清 ★
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

