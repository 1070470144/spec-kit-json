'use client'
import { useState } from 'react'

export default function JsonPreview({ jsonPreview }: { jsonPreview: string | null }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!jsonPreview) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white shadow-md flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="text-xl font-semibold text-gray-600 mb-2">
          暂无 JSON 数据
        </div>
        <div className="text-sm text-gray-500">
          该剧本还未上传 JSON 内容
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* 展开/收起按钮 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-all duration-300"
        >
          <svg 
            className={`w-5 h-5 text-sky-600 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-semibold text-sky-700">
            {isExpanded ? '收起内容' : '展开查看'}
          </span>
        </button>

        <div className="text-xs text-gray-500">
          {jsonPreview.split('\n').length} 行 · {(jsonPreview.length / 1024).toFixed(1)} KB
        </div>
      </div>

      {/* JSON 内容 */}
      <div 
        className={`overflow-hidden transition-all duration-500 ${
          isExpanded ? 'max-h-[60rem]' : 'max-h-48'
        }`}
      >
        <div className="relative group">
          <pre className="text-sm font-mono bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 rounded-2xl p-6 overflow-auto whitespace-pre-wrap break-words shadow-inner">
            {jsonPreview}
          </pre>
          
          {!isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"></div>
          )}
        </div>
      </div>
    </div>
  )
}
