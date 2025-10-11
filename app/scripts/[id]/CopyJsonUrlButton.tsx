'use client'
import { useState } from 'react'

export default function CopyJsonUrlButton({ 
  scriptId, 
  baseUrl 
}: { 
  scriptId: string
  baseUrl: string 
}) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCopy() {
    setLoading(true)
    
    try {
      // 1. 获取 JSON 数据
      const url = `${baseUrl}/api/scripts/${scriptId}/download`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch JSON data')
      }
      
      const jsonData = await response.json()
      
      // 2. 将 JSON 对象转换为格式化的字符串
      const jsonString = JSON.stringify(jsonData, null, 2)
      
      // 3. 复制 JSON 字符串到剪贴板
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonString)
        setCopied(true)
        setError(false)
      } else {
        // 降级方案：使用传统方法
        const textarea = document.createElement('textarea')
        textarea.value = jsonString
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        const success = document.execCommand('copy')
        document.body.removeChild(textarea)
        
        if (success) {
          setCopied(true)
          setError(false)
        } else {
          throw new Error('Copy failed')
        }
      }
      
      // 2秒后恢复默认状态
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy JSON:', err)
      setError(true)
      setTimeout(() => setError(false), 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className="m3-btn-outlined w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-touch"
      onClick={handleCopy}
      disabled={copied || loading}
    >
      {loading ? (
        <>
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>加载中...</span>
        </>
      ) : copied ? (
        <>
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-600 font-medium">已复制到剪贴板！</span>
        </>
      ) : error ? (
        <>
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-red-600 font-medium">复制失败</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          复制 JSON 内容
        </>
      )}
    </button>
  )
}

