'use client'
import { useEffect, useState } from 'react'

type Toast = { text: string; type?: 'success' | 'error' | 'info'; id: number }

export default function Toaster() {
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { text: string; type?: 'success' | 'error' | 'info' }
      setToast({ id: Date.now(), text: detail.text, type: detail.type || 'info' })
      setTimeout(() => setToast(null), 2000)
    }
    window.addEventListener('app-toast' as any, handler)
    return () => window.removeEventListener('app-toast' as any, handler)
  }, [])

  if (!toast) return null
  const color = toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
  return (
    <div className="fixed inset-0 pointer-events-none z-50 grid place-items-center">
      <div className={`${color} text-white px-4 py-2 rounded-lg shadow-lg pointer-events-auto`}>{toast.text}</div>
    </div>
  )
}

export function emitToast(text: string, type?: 'success' | 'error' | 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { text, type } }))
  }
}


