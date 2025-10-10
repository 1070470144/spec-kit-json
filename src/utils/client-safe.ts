/**
 * 客户端安全检查工具
 * 确保某些代码只在服务器端运行
 */

// 检查是否在服务器端
export const isServer = typeof window === 'undefined'

// 检查是否在客户端
export const isClient = typeof window !== 'undefined'

// 安全的服务器端执行
export function runOnServer(fn: () => void): void {
  if (isServer) {
    try {
      fn()
    } catch (error) {
      console.warn('[SERVER-ONLY] Function failed:', error)
    }
  }
}

// 安全的客户端执行
export function runOnClient(fn: () => void): void {
  if (isClient) {
    try {
      fn()
    } catch (error) {
      console.warn('[CLIENT-ONLY] Function failed:', error)
    }
  }
}

// 安全的全局变量访问
export function safeGlobal<T>(key: string, fallback: T): T {
  try {
    if (isServer && global && key in global) {
      return (global as any)[key] || fallback
    }
    if (isClient && window && key in window) {
      return (window as any)[key] || fallback
    }
    return fallback
  } catch {
    return fallback
  }
}
