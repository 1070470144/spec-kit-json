'use client'
import { useEffect, useRef, useState } from 'react'

export default function UploadPage() {
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
