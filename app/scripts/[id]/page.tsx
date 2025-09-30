import { headers } from 'next/headers'
import CenteredImagesWithLightbox from '../_components/CenteredImagesWithLightbox'
import JsonPreview from './JsonPreview'

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
    <div className="container-page space-y-8 py-8">
      {/* 面包屑导航 */}
      <nav className="flex items-center gap-2 text-sm text-surface-on-variant">
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

      {/* 主要内容区 - 整合设计 */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-2xl">
        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500"></div>
        
        <div className="p-8 md:p-12">
          {/* 图片展示 */}
          {displayImages.length > 0 && (
            <div className="mb-8">
              <CenteredImagesWithLightbox images={displayImages} title={data.title} />
            </div>
          )}
          
          {/* 标题和信息 */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-surface-on mb-4 leading-tight">
              {data.title}
            </h1>
            <div className="flex items-center gap-2 text-lg text-surface-on-variant">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>作者：<span className="text-surface-on font-semibold">{data.author || '未知'}</span></span>
            </div>
          </div>

          {/* 操作按钮组 */}
          <div className="flex flex-wrap items-center gap-4 pb-8 border-b border-gray-200">
            <a 
              className="m3-btn-filled inline-flex items-center gap-2 text-lg px-10 py-4" 
              href={`${base}/api/scripts/${data.id}/download`} 
              download
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

          {/* JSON 预览 */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/10 to-cyan-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-surface-on">JSON 数据</h2>
                <p className="text-sm text-surface-on-variant">
                  剧本的完整 JSON 内容
                </p>
              </div>
            </div>
            
            <JsonPreview jsonPreview={jsonPreview} />
          </div>
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
