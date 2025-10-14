'use client'

import { useState, useEffect } from 'react'

interface SvgImageProps {
  src: string
  alt: string
  className?: string
  draggable?: boolean
  onClick?: (e: React.MouseEvent) => void
}

export default function SvgImage({ src, alt, className = '', draggable = false, onClick }: SvgImageProps) {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const isSvg = src.includes('.svg')
  
  useEffect(() => {
    if (!isSvg) {
      setLoading(false)
      return
    }
    
    const loadSvg = async () => {
      try {
        const response = await fetch(src)
        if (response.ok) {
          const text = await response.text()
          // 添加响应式样式
          const styledContent = text.replace(
            /<svg([^>]*?)>/,
            '<svg$1 style="max-width:100%;max-height:100%;width:100%;height:100%;">'
          )
          setContent(styledContent)
          setLoading(false)
        } else {
          console.error('[SvgImage] HTTP error:', response.status, response.statusText)
          setError(true)
          setLoading(false)
        }
      } catch (err) {
        console.error('[SvgImage] Load error:', err)
        setError(true)
        setLoading(false)
      }
    }
    
    loadSvg()
  }, [src, isSvg])
  
  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center text-gray-400 text-sm">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          加载失败
        </div>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50`}>
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }
  
  if (isSvg && content) {
    return (
      <div 
        className={`${className} flex items-center justify-center`}
        dangerouslySetInnerHTML={{ __html: content }}
        onClick={onClick}
      />
    )
  }
  
  // 非SVG图片使用普通img标签
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={draggable}
      onClick={onClick}
    />
  )
}
