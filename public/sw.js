// 简化版 Service Worker - 避免预缓存问题
const CACHE_NAME = 'xueran-juben-v1'
const RUNTIME_CACHE = 'runtime-cache-v1'

// 跳过等待，立即激活
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  self.skipWaiting()
})

// 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// 网络优先策略，避免缓存 API 和构建文件
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 跳过不需要缓存的请求
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/_next/static/chunks/') ||
    url.pathname.includes('/_buildManifest.js') ||
    url.pathname.includes('/_ssgManifest.js') ||
    url.pathname.includes('/hot-update') ||
    url.hostname !== self.location.hostname
  ) {
    return
  }

  // 静态资源使用缓存优先策略
  if (
    url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/) ||
    url.pathname.match(/\.(woff|woff2|ttf|eot)$/) ||
    url.pathname.includes('/icons/')
  ) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          return fetch(request).then((networkResponse) => {
            // 只缓存成功的响应
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone())
            }
            return networkResponse
          }).catch((error) => {
            console.log('[SW] Fetch failed:', error)
            // 如果网络失败，返回离线页面
            if (request.destination === 'document') {
              return caches.match('/offline.html')
            }
            throw error
          })
        })
      })
    )
    return
  }

  // 其他请求使用网络优先策略
  event.respondWith(
    fetch(request)
      .then((response) => {
        // 只缓存成功的响应
        if (response && response.status === 200 && request.destination === 'document') {
          const responseToCache = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache)
          })
        }
        return response
      })
      .catch((error) => {
        console.log('[SW] Fetch failed, trying cache:', error)
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          // 如果是文档请求，返回离线页面
          if (request.destination === 'document') {
            return caches.match('/offline.html')
          }
          throw error
        })
      })
  )
})

console.log('[SW] Service Worker loaded')
