/**
 * Service Worker 缓存策略工具
 * 
 * 实现常用的缓存策略：
 * - Network First: 优先网络，失败时使用缓存
 * - Cache First: 优先缓存，失败时使用网络
 * - Stale While Revalidate: 返回缓存同时后台更新
 */

const API_CACHE_NAME = 'api-cache-v1';
const STATIC_CACHE_NAME = 'static-cache-v1';
const IMAGE_CACHE_NAME = 'image-cache-v1';

/**
 * Network First 策略
 * 适用于：API 请求、动态内容
 */
export async function networkFirst(
  request: Request,
  cacheName: string = API_CACHE_NAME,
  timeout: number = 10000
): Promise<Response> {
  try {
    // 尝试从网络获取
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), timeout);
    });

    const response = await Promise.race([networkPromise, timeoutPromise]) as Response;

    // 缓存成功的响应
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // 网络失败，尝试从缓存获取
    const cached = await caches.match(request);
    if (cached) {
      console.log('[Cache] Network failed, using cache:', request.url);
      return cached;
    }

    // 缓存也没有，返回离线页面或错误
    throw error;
  }
}

/**
 * Cache First 策略
 * 适用于：静态资源、不常变化的图片
 */
export async function cacheFirst(
  request: Request,
  cacheName: string = STATIC_CACHE_NAME
): Promise<Response> {
  // 先检查缓存
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  // 缓存未命中，从网络获取
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Stale While Revalidate 策略
 * 返回缓存的同时后台更新缓存
 * 适用于：可以接受短暂过期的内容
 */
export async function staleWhileRevalidate(
  request: Request,
  cacheName: string = STATIC_CACHE_NAME
): Promise<Response> {
  const cached = await caches.match(request);

  // 后台更新（不等待）
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(cacheName).then(cache => {
        cache.put(request, response.clone());
      });
    }
    return response;
  });

  // 如果有缓存，立即返回缓存
  if (cached) {
    return cached;
  }

  // 无缓存，等待网络
  return fetchPromise;
}

/**
 * Network Only 策略
 * 始终从网络获取，不缓存
 * 适用于：敏感数据、实时数据
 */
export async function networkOnly(request: Request): Promise<Response> {
  return fetch(request);
}

/**
 * Cache Only 策略
 * 仅从缓存获取
 * 适用于：离线模式、预缓存资源
 */
export async function cacheOnly(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  throw new Error('No cache available');
}

/**
 * 清理过期缓存
 */
export async function cleanupExpiredCache(
  cacheName: string,
  maxEntries: number,
  maxAge: number // seconds
): Promise<void> {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  
  // 按时间排序（最旧的在前）
  const entries = await Promise.all(
    requests.map(async (request) => {
      const response = await cache.match(request);
      const dateHeader = response?.headers.get('date');
      const date = dateHeader ? new Date(dateHeader).getTime() : 0;
      return { request, date };
    })
  );

  entries.sort((a, b) => a.date - b.date);

  // 删除超过最大数量的旧条目
  if (entries.length > maxEntries) {
    const toDelete = entries.slice(0, entries.length - maxEntries);
    await Promise.all(
      toDelete.map(entry => cache.delete(entry.request))
    );
  }

  // 删除过期条目
  const now = Date.now();
  const maxAgeMs = maxAge * 1000;
  const expired = entries.filter(entry => now - entry.date > maxAgeMs);
  
  await Promise.all(
    expired.map(entry => cache.delete(entry.request))
  );
}

/**
 * 预缓存关键资源
 */
export async function precacheResources(urls: string[]): Promise<void> {
  const cache = await caches.open(STATIC_CACHE_NAME);
  await cache.addAll(urls);
}

/**
 * 清理所有旧版本缓存
 */
export async function cleanupOldCaches(
  currentCaches: string[]
): Promise<void> {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => !currentCaches.includes(name));
  
  await Promise.all(
    oldCaches.map(name => caches.delete(name))
  );
  
  console.log('[Cache] Cleaned up old caches:', oldCaches);
}

