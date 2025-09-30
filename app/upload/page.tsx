'use client'
import { useEffect, useRef, useState } from 'react'

export default function UploadPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [title, setTitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [jsonFile, setJsonFile] = useState<File | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [message, setMessage] = useState('')
  const [imgPreviews, setImgPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<null | { type: 'success' | 'error' | 'info'; text: string }>(null)
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

  function showToast(text: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  function onPickJson(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    setJsonFile(f || null)
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
    for (const f of images) form.append('images', f)

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
          
          <h1 className="text-4xl font-bold text-surface-on mb-4">
            需要登录才能上传
          </h1>
          <p className="text-lg text-surface-on-variant mb-8 max-w-md mx-auto">
            请先登录您的账户，然后即可上传剧本和图片
          </p>
          
          <div className="flex gap-4 justify-center">
            <a 
              className="m3-btn-filled inline-flex items-center gap-2 px-8 py-4 text-lg"
              href="/login"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              登录账户
            </a>
            <a 
              className="m3-btn-outlined inline-flex items-center gap-2 px-8 py-4 text-lg"
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
        <h1 className="text-headline-small mb-2 text-surface-on">上传剧本</h1>
        <p className="text-body-medium text-surface-on-variant">支持 JSON 文件与 0–3 张图片（JPG/PNG/WebP）。</p>
      </div>

      <div className="m3-card-elevated max-w-3xl mt-6">
        <div className="p-6 space-y-6">
          {toast && (
            <div className={`rounded-sm border px-4 py-3 text-body-small ${
              toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              {toast.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label htmlFor="title" className="sm:w-32 text-body-medium text-surface-on font-medium">名字（标题）<span className="text-error">*</span></label>
              <input 
                id="title"
                className="input flex-1" 
                placeholder="例如：隐舟暗渡" 
                value={title} 
                onChange={e=>setTitle(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label htmlFor="author" className="sm:w-32 text-body-medium text-surface-on font-medium">作者（可选）</label>
              <input 
                id="author"
                className="input flex-1" 
                placeholder="作者名" 
                value={authorName} 
                onChange={e=>setAuthorName(e.target.value)} 
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label htmlFor="json-file" className="sm:w-32 text-body-medium text-surface-on font-medium">剧本 JSON<span className="text-error">*</span></label>
              <div className="flex items-center gap-3 flex-1">
                <input 
                  ref={jsonRef} 
                  id="json-file"
                  className="hidden" 
                  type="file" 
                  accept="application/json" 
                  onChange={onPickJson} 
                />
                <button type="button" className="m3-btn-outlined" onClick={() => jsonRef.current?.click()}>选择文件</button>
                <span className="text-body-small text-surface-on-variant truncate flex-1">
                  {jsonFile ? jsonFile.name : '未选择'}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <label htmlFor="images-file" className="sm:w-32 text-body-medium text-surface-on font-medium sm:mt-2">图片（0–3）</label>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <input 
                    ref={imagesRef} 
                    id="images-file"
                    className="hidden" 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    multiple 
                    onChange={onPickImages} 
                  />
                  <button type="button" className="m3-btn-outlined" onClick={() => imagesRef.current?.click()}>选择图片</button>
                  <span className="text-body-small text-surface-on-variant">
                    {images.length ? `已选 ${images.length} 张` : '未选择'}
                  </span>
                </div>
                {!!imgPreviews.length && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {imgPreviews.map((src, i) => (
                      <div key={i} className="m3-card-elevated overflow-hidden">
                        <img src={src} alt={`预览 ${i+1}`} className="object-cover w-full h-24" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <a className="m3-btn-text" href="/scripts">返回列表</a>
              <button className="m3-btn-filled" type="submit" disabled={!title || !jsonFile || loading}>
                {loading ? '提交中…' : '提交'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
