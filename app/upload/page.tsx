'use client'
import { useState } from 'react'

export default function UploadPage() {
  const [title, setTitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [jsonFile, setJsonFile] = useState<File | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [message, setMessage] = useState('')

  function onPickJson(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    setJsonFile(f || null)
  }
  function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length > 3) {
      setMessage('最多选择 3 张图片')
      setImages(files.slice(0,3))
    } else {
      setImages(files)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    if (!title || !jsonFile) { setMessage('请填写标题并选择 JSON 文件'); return }
    if (images.length > 3) { setMessage('最多选择 3 张图片'); return }
    const form = new FormData()
    form.set('title', title)
    if (authorName) form.set('authorName', authorName)
    form.set('jsonFile', jsonFile)
    for (const f of images) form.append('images', f)

    const res = await fetch('/api/scripts', { method: 'POST', body: form })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setMessage(data?.error?.message || '上传失败'); return }
    const id = data?.data?.id || data?.id
    setMessage('创建成功')
    if (id) location.href = `/scripts/${id}`
  }

  return (
    <div className="container-page section">
      <h1 className="text-2xl font-semibold">上传剧本（JSON + 0-3 图片）</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="input" placeholder="名字（标题）" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="input" placeholder="作者（可选）" value={authorName} onChange={e=>setAuthorName(e.target.value)} />
        <div className="space-y-1">
          <div className="text-sm text-gray-700">选择剧本 JSON 文件</div>
          <input className="input" type="file" accept="application/json" onChange={onPickJson} />
        </div>
        <div className="space-y-1">
          <div className="text-sm text-gray-700">选择图片（0-3，JPG/PNG/WebP）</div>
          <input className="input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onPickImages} />
        </div>
        <button className="btn btn-primary" type="submit">提交</button>
      </form>
      {message && <div className="muted">{message}</div>}
    </div>
  )
}
