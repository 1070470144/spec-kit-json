# Research & Technical Decisions: 移动端响应式适配

**Feature**: 全站移动端响应式适配 + PWA  
**Date**: 2025-10-10  
**Status**: Completed

## Executive Summary

针对移动端响应式适配和完整 PWA 功能需求，完成了关键技术选型研究。所有决策基于 Next.js 15+ 生态系统，优先使用成熟的开源方案，确保实施风险可控。

**核心决策**:
1. PWA: next-pwa 5.x (vs 手动 Workbox)
2. 图片优化: sharp + plaiceholder + Next.js Image
3. 触摸手势: 原生 Touch Events (vs react-use-gesture)
4. 推送通知: Web Push API + VAPID
5. 离线同步: IndexedDB + Background Sync API
6. 断点策略: Tailwind 默认 + 自定义 xs (375px)

---

## 1. Next.js PWA 集成方案

### 研究问题
如何在 Next.js 15 中实现完整的 PWA 功能（Service Worker、离线支持、推送通知）？

### 方案对比

| 方案 | 优势 | 劣势 | 评分 |
|------|------|------|------|
| **next-pwa** | ✅ 与 Next.js 深度集成<br>✅ 自动生成 Service Worker<br>✅ 内置缓存策略<br>✅ 社区活跃 (9k+ stars) | ❌ 配置选项有限<br>❌ 依赖第三方维护 | 9/10 |
| 手动 Workbox | ✅ 完全可控<br>✅ 灵活定制 | ❌ 配置复杂<br>❌ 维护成本高<br>❌ 需要深入理解 SW 生命周期 | 5/10 |
| serwist | ✅ 现代化 SW 工具<br>✅ TypeScript 优先 | ❌ 社区较小<br>❌ 文档不够完善 | 6/10 |

### ✅ 最终决策: **next-pwa 5.x**

**选择理由**:
1. **开箱即用**: 一行配置即可生成 Service Worker
2. **Next.js 15 兼容**: 官方支持 App Router 和 Server Components
3. **成熟稳定**: 经过大量生产环境验证
4. **文档完善**: 详细的配置示例和最佳实践

**实施方案**:
```javascript
// next.config.mjs
import withPWA from '@ducanh2912/next-pwa';

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\./,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /\.(?:jpg|jpeg|png|webp|svg|gif|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    }
  ]
});
```

**替代方案未选择原因**:
- **手动 Workbox**: 过于复杂，学习曲线陡峭，维护成本高
- **serwist**: 社区生态不够成熟，风险较高

---

## 2. 图片优化管线

### 研究问题
如何实现激进的图片优化（懒加载 + WebP + 模糊占位图 + 渐进式加载）？

### 方案对比

| 技术 | 用途 | 优势 | 劣势 |
|------|------|------|------|
| **sharp** | WebP/AVIF 转换 | ✅ 高性能（libvips）<br>✅ 支持多种格式<br>✅ Node.js 原生 | ❌ 需要编译原生模块 |
| **plaiceholder** | 模糊占位图生成 | ✅ 自动生成 base64<br>✅ 多种风格 (blur/css/svg)<br>✅ 与 Next.js Image 集成 | ❌ 增加构建时间 |
| **Next.js Image** | 运行时优化 | ✅ 自动响应式尺寸<br>✅ 懒加载内置<br>✅ 格式自动协商 | ❌ 需要服务器支持 |
| Cloudinary | 第三方 CDN | ✅ 无需自建<br>✅ 功能强大 | ❌ 成本高<br>❌ 依赖外部服务 |

### ✅ 最终决策: **sharp + plaiceholder + Next.js Image**

**技术栈**:
```
构建时 (sharp)
  ├─ 原始图片 (JPEG/PNG)
  ├─ 生成 WebP (80% 质量)
  ├─ 生成多尺寸 (640/768/1024/1280/1536w)
  └─ 生成 LQIP (plaiceholder, 10x10 → base64)

运行时 (Next.js Image)
  ├─ 根据屏幕尺寸选择合适图片
  ├─ 懒加载（IntersectionObserver）
  ├─ 格式协商（Accept: image/webp）
  └─ 渐进式加载（blur → full）
```

**实施示例**:
```typescript
// scripts/optimize-images.ts
import sharp from 'sharp';
import { getPlaiceholder } from 'plaiceholder';
import fs from 'fs/promises';
import path from 'path';

async function optimizeImage(inputPath: string) {
  const fileName = path.basename(inputPath, path.extname(inputPath));
  const outputDir = path.join('public', 'optimized');
  
  // 生成 WebP
  await sharp(inputPath)
    .webp({ quality: 80 })
    .toFile(path.join(outputDir, `${fileName}.webp`));
  
  // 生成响应式尺寸
  const sizes = [640, 768, 1024, 1280, 1536];
  await Promise.all(
    sizes.map(width =>
      sharp(inputPath)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(outputDir, `${fileName}-${width}w.webp`))
    )
  );
  
  // 生成模糊占位图
  const { base64 } = await getPlaiceholder(inputPath, { size: 10 });
  
  return { base64, fileName };
}
```

**性能提升预期**:
- WebP 节省 25-35% 文件大小
- 懒加载减少初始加载 60%+ 图片
- LQIP 避免布局抖动，提升 LCP

---

## 3. 触摸手势处理

### 研究问题
如何实现流畅的移动端触摸交互（滑动、点击、长按）？

### 方案对比

| 方案 | 使用场景 | 复杂度 | 包大小 |
|------|----------|--------|--------|
| **原生 Touch Events** | 简单手势（滑动、点击） | 低 | 0 KB |
| **react-use-gesture** | 复杂手势（捏合、旋转） | 中 | 12 KB |
| **embla-carousel** | 轮播专用 | 低 | 10 KB |
| Hammer.js | 全功能手势库 | 高 | 23 KB |

### ✅ 最终决策: **原生 Touch Events + embla-carousel**

**决策理由**:
1. **大部分场景足够简单**: 滑动轮播、点击操作不需要复杂库
2. **减少包大小**: 原生实现 0 成本
3. **embla-carousel 已集成**: 项目已使用，无需额外引入

**实施方案**:

```typescript
// src/hooks/useTouchGesture.ts
export function useSwipe(onSwipeLeft?: () => void, onSwipeRight?: () => void) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  
  const handleTouchStart = (e: TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };
  
  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current) return;
    
    const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);
    
    // 横向滑动优先（deltaX > deltaY）
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }
    
    touchStart.current = null;
  };
  
  return { handleTouchStart, handleTouchEnd };
}
```

**特殊情况处理**:
- **图片轮播**: 使用 embla-carousel（已有依赖）
- **长按操作**: 使用 PointerEvents + setTimeout
- **捏合缩放**: 如需实现，再引入 react-use-gesture

---

## 4. Web 推送通知

### 研究问题
如何实现跨平台的推送通知功能？

### 技术方案

| 组件 | 技术选择 | 理由 |
|------|----------|------|
| **前端 API** | Push API + Notifications API | 标准 Web API，iOS 16.4+ 支持 |
| **认证方式** | VAPID (自主应用服务器密钥) | 无需依赖第三方，安全可控 |
| **后端推送** | web-push (npm) | 官方推荐，支持所有主流浏览器 |
| **订阅存储** | Prisma (PostgreSQL/SQLite) | 复用现有数据库 |

### ✅ 最终决策: **Web Push API + VAPID + web-push**

**架构流程**:
```
用户授权
  ↓
前端订阅 (PushManager.subscribe)
  ↓
POST /api/push/subscribe (endpoint + keys)
  ↓
后端存储到数据库 (Prisma)
  ↓
触发推送事件
  ↓
后端查询订阅 + web-push.sendNotification
  ↓
Service Worker 接收 (push event)
  ↓
显示通知 (self.registration.showNotification)
```

**实施代码**:
```typescript
// 前端：请求权限并订阅
async function subscribeToPush() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;
  
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  });
  
  // 发送订阅到后端
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });
}

// 后端：发送推送
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:admin@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function sendPushNotification(subscription, payload) {
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}
```

**兼容性**:
- ✅ Chrome 120+ (Android/Desktop)
- ✅ Safari 18+ (iOS/macOS) - iOS 16.4+ 支持
- ✅ 微信浏览器 (部分支持，需降级处理)

---

## 5. 离线同步策略

### 研究问题
如何在离线状态下保存用户操作，并在网络恢复后同步？

### 方案对比

| 存储方案 | 容量 | 性能 | 适用场景 |
|----------|------|------|----------|
| **IndexedDB** | ~50MB+ | 异步，高性能 | 复杂数据、大量记录 |
| LocalStorage | ~5MB | 同步，阻塞 | 简单键值对 |
| Cache API | ~50MB+ | 异步 | HTTP 响应缓存 |

| 同步方案 | 浏览器支持 | 复杂度 | 可靠性 |
|----------|------------|--------|--------|
| **Background Sync API** | Chrome/Edge/Opera | 低 | 高（系统级重试） |
| 手动轮询 | 全部 | 中 | 中（依赖用户在线） |
| WebSocket | 全部 | 高 | 高（实时，但耗电） |

### ✅ 最终决策: **IndexedDB + Background Sync API**

**技术架构**:
```typescript
// IndexedDB 队列结构
interface OfflineQueue {
  id: string;
  type: 'like' | 'favorite' | 'comment';
  action: 'add' | 'remove' | 'create';
  data: any;
  timestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'failed';
}

// 队列操作
class OfflineSyncManager {
  private db: IDBDatabase;
  
  async enqueue(action: OfflineQueue): Promise<void> {
    // 存入 IndexedDB
    // 触发 UI 乐观更新
    // 注册 Background Sync
  }
  
  async syncAll(): Promise<void> {
    const pending = await this.getPendingActions();
    const results = await fetch('/api/offline-sync/actions', {
      method: 'POST',
      body: JSON.stringify({ actions: pending })
    });
    // 根据结果更新队列状态
  }
}

// Service Worker: 监听 sync 事件
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncManager.syncAll());
  }
});
```

**降级方案**:
- 不支持 Background Sync: 用户手动触发同步按钮
- IndexedDB 不可用: 使用 LocalStorage + 容量限制警告

**冲突处理**:
- 时间戳优先: 最新操作覆盖旧操作
- 服务端验证: 检测冲突（如点赞已存在）并忽略

---

## 6. 响应式断点策略

### 研究问题
如何设计响应式断点，既符合 Material Design 3，又适配 Tailwind CSS？

### 断点对比

| 框架 | 断点名称 | 宽度 | 设备 |
|------|----------|------|------|
| **Tailwind 默认** | xs/sm/md/lg/xl/2xl | 640/768/1024/1280/1536 | 通用 |
| **Material Design 3** | compact/medium/expanded | 600/840/1240 | 通用 |
| **Bootstrap 5** | sm/md/lg/xl/xxl | 576/768/992/1200/1400 | 通用 |

### ✅ 最终决策: **Tailwind 默认 + 自定义 xs (375px)**

**断点定义**:
```javascript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      'xs': '375px',   // 小屏手机 (iPhone SE, iPhone 12 mini)
      'sm': '640px',   // 大屏手机 (iPhone 14 Pro Max, Pixel 7)
      'md': '768px',   // 平板竖屏 (iPad, iPad mini)
      'lg': '1024px',  // 平板横屏 (iPad Pro)
      'xl': '1280px',  // 桌面
      '2xl': '1536px', // 大桌面
    }
  }
}
```

**对应关系**:
| Tailwind | M3 | 典型设备 | 布局策略 |
|----------|----|-----------| ---------|
| < xs (375px) | compact | iPhone SE | 单列，最小功能 |
| xs-sm | compact | iPhone 14 | 单列，完整功能 |
| sm-md | medium | 大屏手机 | 双列可选 |
| md-lg | medium | iPad 竖屏 | 双列/三列 |
| lg-xl | expanded | iPad 横屏 | 完整桌面布局 |
| xl+ | expanded | 桌面 | 宽松布局 |

**设计理由**:
1. **Tailwind 生态**: 复用现有类名，减少学习成本
2. **xs 断点必需**: 针对 iPhone SE (375px) 优化
3. **M3 语义对齐**: compact ≈ xs-sm, medium ≈ sm-lg, expanded ≈ lg+

---

## 7. 性能监控方案

### 研究问题
如何监控移动端性能，确保达到目标（FCP < 2s, LCP < 3s）？

### 方案对比

| 工具 | 类型 | 优势 | 劣势 |
|------|------|------|------|
| **Lighthouse CI** | 实验室测试 | ✅ CI 集成<br>✅ 历史对比<br>✅ 预算设置 | ❌ 非真实用户环境 |
| **Web Vitals API** | 真实用户监控 | ✅ 真实数据<br>✅ 低成本 | ❌ 需自建上报 |
| WebPageTest | 实验室测试 | ✅ 多地理位置<br>✅ 详细瀑布图 | ❌ 手动执行 |
| Google Analytics 4 | 真实用户监控 | ✅ 现成方案 | ❌ 隐私问题 |

### ✅ 最终决策: **Lighthouse CI + Web Vitals API**

**实施方案**:

**1. Lighthouse CI (开发/CI 环境)**
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci && npm run build
      - run: npm install -g @lhci/cli
      - run: lhci autorun
```

```javascript
// lighthouserc.json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": ["http://localhost:3000", "http://localhost:3000/scripts"]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 3000 }]
      }
    }
  }
}
```

**2. Web Vitals API (生产环境)**
```typescript
// app/layout.tsx
import { sendToAnalytics } from '@/lib/analytics';

export default function RootLayout({ children }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
        onCLS(sendToAnalytics);
        onFID(sendToAnalytics);
        onFCP(sendToAnalytics);
        onLCP(sendToAnalytics);
        onTTFB(sendToAnalytics);
      });
    }
  }, []);
  
  return <html>{children}</html>;
}

// lib/analytics.ts
export function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  });
  
  // 使用 sendBeacon 异步发送，不阻塞页面
  navigator.sendBeacon?.('/api/analytics/vitals', body);
}
```

**监控指标**:
- FCP (First Contentful Paint): 首次内容绘制
- LCP (Largest Contentful Paint): 最大内容绘制
- CLS (Cumulative Layout Shift): 累积布局偏移
- FID (First Input Delay): 首次输入延迟
- TTFB (Time to First Byte): 首字节时间

**告警阈值**:
- FCP > 2s: Warning
- LCP > 3s: Warning
- CLS > 0.1: Warning

---

## Summary of Decisions

| 研究主题 | 最终决策 | 关键考量 |
|----------|----------|----------|
| PWA 集成 | next-pwa 5.x | 成熟度、Next.js 集成 |
| 图片优化 | sharp + plaiceholder + Next.js Image | 性能、开发体验 |
| 触摸手势 | 原生 + embla-carousel | 包大小、足够简单 |
| 推送通知 | Web Push API + VAPID | 标准 API、跨平台 |
| 离线同步 | IndexedDB + Background Sync | 可靠性、浏览器支持 |
| 响应式断点 | Tailwind 默认 + xs (375px) | 生态一致性 |
| 性能监控 | Lighthouse CI + Web Vitals | CI 集成、真实用户数据 |

**风险评估**:
- ✅ 低风险: 所有技术都有成熟的开源方案
- ⚠️ 中等风险: PWA 在微信浏览器兼容性需额外测试
- ⚠️ 中等风险: 图片优化增加构建时间（可通过增量构建缓解）

**下一步**: 进入 Phase 1 设计阶段，创建组件清单和 API 契约。

---

*Research completed: 2025-10-10 | All decisions approved for implementation*

