import { headers } from 'next/headers'
import CenteredImagesWithLightbox from '../_components/CenteredImagesWithLightbox'

type Detail = { id: string; title: string; author?: string | null; state: string; images: { id: string; url: string; isCover?: boolean }[]; json?: unknown }

async function fetchDetail(id: string) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const res = await fetch(`${base}/api/scripts/${id}`, { cache: 'no-store' })
  const j = await res.json()
  const data = (j?.data ?? j) as Detail
  return { data, base }
}

export default async function ScriptDetailPage({ params }: { params: { id: string } }) {
  const { data, base } = await fetchDetail(params.id)
  const images = data.images ?? []
  const cover = images.find(i=>i.isCover) || images[0]
  const displayImages = images
  const jsonPreview = data.json ? JSON.stringify(data.json, null, 2) : null
  return (
    <div className="container-page section">
      <div className="card">
        <div className="card-body">
          {/* 顶部：不论图片尺寸，固定高度的横向滚动展示 */}
          {/* 顶部最多展示三张图片，居中 + 点击放大预览 */}
          <CenteredImagesWithLightbox images={displayImages} title={data.title} />

          {/* 中部：作者名与剧本名 */}
          <div className="mt-4">
            <div className="text-sm text-gray-600">作者：{data.author || '-'}</div>
            <div className="card-title mt-1">{data.title}</div>
          </div>

          {/* 底部：JSON 预览与操作 */}
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">JSON 预览</div>
            {jsonPreview ? (
              <pre className="text-xs bg-slate-50 border rounded-lg p-3 overflow-auto max-h-[32rem] whitespace-pre-wrap break-words">{jsonPreview}</pre>
            ) : (
              <div className="muted">暂无 JSON 内容</div>
            )}
            <div className="mt-3 flex gap-2">
              <a className="btn btn-outline" href={`${base}/api/scripts/${data.id}/download`} download>下载 JSON</a>
              <a className="btn btn-outline" href={`/scripts`}>返回列表</a>
            </div>
          </div>
        </div>
      </div>

      {/* 评论区域 */}
      {/* @ts-expect-error Server Component boundary */}
      <ClientCommentsWrapper id={params.id} />
    </div>
  )
}

function ClientCommentsWrapper({ id }: { id: string }) {
  const Comp = require('./comments').default as (p: { id: string }) => JSX.Element
  return <Comp id={id} />
}
