'use client'
import { useEffect, useRef, useState } from 'react'
import { useKeyboardScroll } from '@/src/hooks/useKeyboardScroll'

export default function UploadPage() {
  useKeyboardScroll() // 键盘弹出时自动滚动
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [title, setTitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [jsonFile, setJsonFile] = useState<File | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [message, setMessage] = useState('')
  const [imgPreviews, setImgPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<null | { type: 'success' | 'error' | 'info'; text: string }>(null)
  // 自动预览图相关状态
  const [autoPreviewUrl, setAutoPreviewUrl] = useState<string | null>(null)
  const [autoPreviewLoading, setAutoPreviewLoading] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [modalImageSrc, setModalImageSrc] = useState<string | null>(null)
  const jsonRef = useRef<HTMLInputElement | null>(null)
  const imagesRef = useRef<HTMLInputElement | null>(null)

  // 检查登录状态
  useEffect(() => {
    async function checkLogin() {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' })
        const data = await res.json().catch(() => null)
        setIsLoggedIn(!!data?.data?.id)
      } catch {
        setIsLoggedIn(false)
      }
    }
    checkLogin()
  }, [])

  // 清理blob URL
  useEffect(() => {
    return () => {
      if (autoPreviewUrl && autoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(autoPreviewUrl)
      }
    }
  }, [autoPreviewUrl])

  function showToast(text: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  function onPickJson(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    setJsonFile(f || null)
    // 清除之前的自动预览图
    if (autoPreviewUrl) {
      setAutoPreviewUrl(null)
    }
  }
  function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length > 3) {
      showToast('最多选择 3 张图片', 'error')
      setImages(files.slice(0,3))
    } else {
      setImages(files)
    }
  }

  useEffect(() => {
    // 生成预览并清理旧对象 URL
    const urls: string[] = []
    for (const f of images) {
      try { urls.push(URL.createObjectURL(f)) } catch {}
    }
    setImgPreviews(urls)
    return () => { urls.forEach(u => { try { URL.revokeObjectURL(u) } catch {} }) }
  }, [images])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    if (!title || !jsonFile) { showToast('请填写标题并选择 JSON 文件', 'error'); return }
    if (images.length > 3) { showToast('最多选择 3 张图片', 'error'); return }
    
    const form = new FormData()
    form.set('title', title)
    if (authorName) form.set('authorName', authorName)
    form.set('jsonFile', jsonFile)
    
    // 添加用户上传的图片
    for (const f of images) form.append('images', f)
    
    // 如果有自动生成的预览图且没有用户上传图片，则上传预览图
    if (autoPreviewUrl && images.length === 0) {
      try {
        const response = await fetch(autoPreviewUrl)
        const blob = await response.blob()
        const previewFile = new File([blob], `preview-${Date.now()}.svg`, { type: 'image/svg+xml' })
        form.append('images', previewFile)
      } catch (error) {
        console.error('Failed to convert preview to file:', error)
      }
    }

    setLoading(true)
    const res = await fetch('/api/scripts', { method: 'POST', body: form })
    const data = await res.json().catch(() => ({} as any))
    setLoading(false)
    if (!res.ok) {
      const detail = data?.error?.details ? `（${String(data.error.details)}）` : ''
      showToast((data?.error?.message || '上传失败') + detail, 'error')
      return
    }
    const id = data?.data?.id || data?.id
    showToast('创建成功，已进入待审核，正在跳转...', 'success')
    setTimeout(() => {
      location.href = `/my/uploads`
    }, 1000)
  }

  // 生成自动预览图
  async function generateAutoPreview() {
    if (!jsonFile || !title) {
      showToast('请先填写标题并选择JSON文件', 'error')
      return
    }

    setAutoPreviewLoading(true)
    try {
      // 读取JSON文件内容
      const jsonText = await jsonFile.text()
      let json: any = {}
      
      try {
        json = JSON.parse(jsonText)
      } catch (error) {
        showToast('JSON文件格式错误', 'error')
        setAutoPreviewLoading(false)
        return
      }

      // 创建临时脚本数据
      const tempScriptData = {
        id: 'temp-preview',
        title,
        author: authorName || '未知作者',
        json
      }

      // 调用预览生成API
      const response = await fetch('/api/scripts/temp-preview/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tempScriptData)
      })

      if (response.ok) {
        // 使用Blob URL代替data URL，这样SVG可以加载外部图片
        const svgBlob = await response.blob()
        const blobUrl = URL.createObjectURL(svgBlob)
        
        // 清理旧的blob URL
        if (autoPreviewUrl && autoPreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(autoPreviewUrl)
        }
        
        setAutoPreviewUrl(blobUrl)
        showToast('预览图生成成功！', 'success')
      } else {
        showToast('预览图生成失败', 'error')
      }
    } catch (error) {
      console.error('Auto preview generation failed:', error)
      showToast('预览图生成失败', 'error')
    }
    setAutoPreviewLoading(false)
  }

  // 打开预览模态框
  function openPreviewModal(imageSrc: string) {
    setModalImageSrc(imageSrc)
    setShowPreviewModal(true)
  }

  // 关闭预览模态框
  function closePreviewModal() {
    setShowPreviewModal(false)
    setModalImageSrc(null)
  }

  // 监听ESC键关闭模态框
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPreviewModal) {
        closePreviewModal()
      }
    }
    
    if (showPreviewModal) {
      window.addEventListener('keydown', handleKeyDown)
      // 禁止背景滚动
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [showPreviewModal])

  // 加载中状态
  if (isLoggedIn === null) {
    return (
      <div className="container-page section">
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 mx-auto mb-4 border-4 border-sky-200 border-t-sky-600 rounded-full"></div>
          <div className="text-surface-on-variant">加载中...</div>
        </div>
      </div>
    )
  }

  // 未登录状态 - 提示并引导登录
  if (!isLoggedIn) {
    return (
      <div className="container-page section">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-2xl rotate-6 opacity-20 animate-pulse"></div>
            <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50 border-2 border-sky-200 flex items-center justify-center">
              <svg className="w-12 h-12 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-surface-on mb-3 sm:mb-4">
            需要登录才能上传
          </h1>
          <p className="text-base sm:text-lg text-surface-on-variant mb-6 sm:mb-8 max-w-md mx-auto px-4">
            请先登录您的账户，然后即可上传剧本和图片
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <a 
              className="m3-btn-filled inline-flex items-center justify-center gap-2 px-8 py-4 text-base sm:text-lg min-h-touch"
              href="/login"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              登录账户
            </a>
            <a 
              className="m3-btn-outlined inline-flex items-center justify-center gap-2 px-8 py-4 text-base sm:text-lg min-h-touch"
              href="/register"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              注册新账户
            </a>
          </div>
          
          <div className="mt-8 p-4 bg-sky-50 border border-sky-200 rounded-xl inline-block">
            <div className="flex items-center gap-2 text-sm text-sky-800">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>登录后即可上传剧本、收藏和点赞</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 已登录 - 显示上传表单
  return (
    <div className="container-page section">
      <div className="max-w-3xl">
        <h1 className="text-2xl sm:text-3xl md:text-headline-small mb-2 text-surface-on">上传剧本</h1>
        <p className="text-sm sm:text-base md:text-body-medium text-surface-on-variant">支持 JSON 文件与 0–3 张图片（JPG/PNG/WebP）。</p>
      </div>

      <div className="m3-card-elevated max-w-3xl mt-4 sm:mt-6">
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          {toast && (
            <div className={`rounded-sm border px-4 py-3 text-body-small ${
              toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              {toast.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label htmlFor="title" className="text-sm sm:text-base sm:w-32 text-surface-on font-medium">名字（标题）<span className="text-error">*</span></label>
              <input 
                id="title"
                className="input flex-1 min-h-touch text-base" 
                placeholder="例如：隐舟暗渡" 
                value={title} 
                onChange={e=>setTitle(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label htmlFor="author" className="text-sm sm:text-base sm:w-32 text-surface-on font-medium">作者（可选）</label>
              <input 
                id="author"
                className="input flex-1 min-h-touch text-base" 
                placeholder="作者名" 
                value={authorName} 
                onChange={e=>setAuthorName(e.target.value)} 
              />
            </div>
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
                <button type="button" className="m3-btn-outlined min-h-touch w-full sm:w-auto" onClick={() => jsonRef.current?.click()}>选择文件</button>
                <span className="text-sm text-surface-on-variant truncate">
                  {jsonFile ? jsonFile.name : '未选择'}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
              <label htmlFor="images-file" className="text-sm sm:text-base sm:w-32 text-surface-on font-medium sm:mt-2">图片（0–3）</label>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <input 
                    ref={imagesRef} 
                    id="images-file"
                    className="hidden" 
                    type="file" 
                    accept="image/jpeg,image/jpg,image/png,image/webp" 
                    multiple 
                    onChange={onPickImages} 
                  />
                  <button type="button" className="m3-btn-outlined min-h-touch w-full sm:w-auto" onClick={() => imagesRef.current?.click()}>选择图片</button>
                  <span className="text-sm text-surface-on-variant">
                    {images.length ? `已选 ${images.length} 张` : '未选择'}
                  </span>
                </div>
                {!!imgPreviews.length && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {imgPreviews.map((src, i) => (
                      <div 
                        key={i} 
                        className="m3-card-elevated overflow-hidden aspect-square cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => openPreviewModal(src)}
                      >
                        <img src={src} alt={`预览 ${i+1}`} className="object-cover w-full h-full" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all">
                          <svg className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* 自动预览图功能 */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
              <label htmlFor="preview-btn" className="text-sm sm:text-base sm:w-32 text-surface-on font-medium sm:mt-2">自动预览图</label>
              <div className="flex-1 space-y-4">
                <button
                  id="preview-btn"
                  type="button"
                  onClick={generateAutoPreview}
                  disabled={!jsonFile || !title || autoPreviewLoading}
                  className="m3-btn-filled min-h-touch flex items-center gap-2 disabled:opacity-50"
                >
                  {autoPreviewLoading ? (
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
                
                {/* 预览图显示区域 */}
                {autoPreviewUrl && (
                  <div 
                    className="inline-block m3-card-elevated overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                    style={{ width: '280px', maxHeight: '700px' }}
                    onClick={() => openPreviewModal(autoPreviewUrl)}
                  >
                    <img 
                      src={autoPreviewUrl} 
                      alt="预览图" 
                      className="w-full h-auto object-contain bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
              <a className="m3-btn-text min-h-touch text-center" href="/scripts">返回列表</a>
              <button className="m3-btn-filled min-h-touch" type="submit" disabled={!title || !jsonFile || loading}>
                {loading ? '提交中…' : '提交'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* 预览图放大模态框 */}
      {showPreviewModal && modalImageSrc && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-0 backdrop-blur-md">
          {/* 关闭按钮 - 右上角固定 */}
          <button
            onClick={closePreviewModal}
            className="fixed top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all shadow-2xl z-20 hover:scale-110 border border-white/30"
            aria-label="关闭"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* 提示文字 - 左上角 */}
          <div className="fixed top-6 left-6 text-white/80 text-sm font-medium z-20 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg">
            🖼️ 预览图 • 按ESC或点击背景关闭
          </div>
          
          {/* 图片容器 - 充满整个视口 */}
          <div className="relative w-full h-full flex items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
            <img 
              src={modalImageSrc} 
              alt="预览图放大" 
              className="max-w-full max-h-full object-contain drop-shadow-2xl"
              style={{ maxHeight: '95vh', maxWidth: '95vw' }}
            />
          </div>
          
          {/* 点击背景关闭 */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={closePreviewModal}
          />
        </div>
      )}
    </div>
  )
}
