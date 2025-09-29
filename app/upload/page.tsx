'use client'
import { useEffect, useState } from 'react'

export default function UploadPage() {
  const [title, setTitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [jsonFile, setJsonFile] = useState<File | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [message, setMessage] = useState('')
  const [imgPreviews, setImgPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<null | { type: 'success' | 'error' | 'info'; text: string }>(null)

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
    showToast('创建成功，已进入待审核', 'success')
    location.href = `/scripts`
  }

  return (
    <div className="container-page section">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold">上传剧本</h1>
        <p className="subtitle mt-1">支持 JSON 文件与 0–3 张图片（JPG/PNG/WebP）。</p>
      </div>

      <div className="glass-card max-w-3xl">
        <div className="card-body space-y-5">
          {toast && (
            <div className={`rounded-lg border px-3 py-2 text-sm ${
              toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              {toast.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">名字（标题）</label>
              <input className="input" placeholder="例如：隐舟暗渡" value={title} onChange={e=>setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">作者（可选）</label>
              <input className="input" placeholder="作者名" value={authorName} onChange={e=>setAuthorName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">剧本 JSON 文件</label>
              <input className="input" type="file" accept="application/json" onChange={onPickJson} />
              {jsonFile && <div className="muted mt-1">已选择：{jsonFile.name}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">图片（0–3）</label>
              <input className="input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onPickImages} />
              {!!imgPreviews.length && (
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {imgPreviews.map((src, i) => (
                    <img key={i} src={src} alt="预览" className="rounded border bg-white object-cover w-full h-24" />
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" type="submit" disabled={!title || !jsonFile || loading}>
                {loading ? '提交中…' : '提交'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
