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

export default async function ScriptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, base } = await fetchDetail(id)
  const images = data.images ?? []
  const displayImages = images
  const jsonPreview = data.json ? JSON.stringify(data.json, null, 2) : null
  
  return (
    <div className="container-page section space-y-6">
      {/* 面包屑导航 */}
      <nav className="flex items-center gap-2 text-base text-surface-on-variant">
        <a href="/" className="hover:text-sky-600 transition-colors">首页</a>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <a href="/scripts" className="hover:text-sky-600 transition-colors">剧本列表</a>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-surface-on font-medium truncate max-w-md">{data.title}</span>
      </nav>

      {/* 图片展示区 */}
      <div className="card">
        <div className="card-body">
          <CenteredImagesWithLightbox images={displayImages} title={data.title} />
        </div>
      </div>

      {/* 剧本信息区 */}
      <div className="card">
        <div className="card-body">
          <div className="mb-6">
            <h1 className="text-headline-large font-bold text-surface-on mb-3">
              {data.title}
            </h1>
            <div className="flex items-center gap-4 text-body-medium text-surface-on-variant">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>作者：<span className="text-surface-on font-medium">{data.author || '未知'}</span></span>
              </div>
            </div>
          </div>

          {/* 操作按钮组 */}
          <div className="flex items-center gap-3 pb-6 border-b border-outline">
            <a 
              className="m3-btn-filled inline-flex items-center gap-2" 
              href={`${base}/api/scripts/${data.id}/download`} 
              download
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              下载 JSON
            </a>
            <a 
              className="m3-btn-outlined inline-flex items-center gap-2" 
              href="/scripts"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回列表
            </a>
          </div>
        </div>
      </div>

      {/* JSON 预览区 */}
      <div className="card">
        <div className="card-body">
          <div className="mb-4">
            <h2 className="text-title-large font-semibold text-surface-on">JSON 内容</h2>
            <p className="text-body-small text-surface-on-variant mt-1">
              剧本的 JSON 数据内容预览
            </p>
          </div>
          
          {jsonPreview ? (
            <pre className="text-body-small font-mono bg-gray-50 border border-outline rounded-lg p-4 overflow-auto max-h-[32rem] whitespace-pre-wrap break-words">
              {jsonPreview}
            </pre>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-title-medium font-medium text-surface-on mb-1">
                暂无 JSON 内容
              </div>
              <div className="text-body-small text-surface-on-variant">
                该剧本还未上传 JSON 数据
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 评论区域 */}
      <ClientCommentsWrapper id={id} />
    </div>
  )
}

function ClientCommentsWrapper({ id }: { id: string }) {
  const Comp = require('./comments').default as (p: { id: string }) => JSX.Element
  return <Comp id={id} />
}
