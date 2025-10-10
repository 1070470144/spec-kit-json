# Tasks: 全站移动端响应式适配

**Input**: Design documents from `/specs/012-mobile-responsive-adaptation/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Extracted: Next.js 15, Tailwind CSS, PWA (next-pwa), TypeScript
2. Load design documents ✓
   → research.md: 7 key technology decisions
   → plan.md: Component inventory, PWA architecture, breakpoints
3. Generate tasks by category ✓
   → Setup: Dependencies, config, CI
   → Infrastructure: Hooks, PWA core, APIs
   → Components: Layout, interaction, content
   → Pages: Adaptation for all pages
   → Optimization: Images, PWA, performance
4. Apply task rules ✓
   → Different components = [P] for parallel
   → Same file modifications = sequential
   → Infrastructure before components before pages
5. Number tasks sequentially (T001-T050) ✓
6. Generate dependency graph ✓
7. Validate task completeness ✓
   → All components in inventory covered
   → All PWA features addressed
   → Performance goals monitored
8. Return: SUCCESS (50 tasks ready for execution) ✓
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- All file paths are relative to `xueran-juben-project/`
- Estimated time included for planning

---

## Phase 1: Setup & Configuration (5 tasks, ~1h) ✅ COMPLETED

### T001: 安装 PWA 和图片优化依赖 ✅
**文件**: `package.json`  
**操作**: 安装以下依赖
```bash
npm install --save @ducanh2912/next-pwa workbox-window
npm install --save-dev sharp plaiceholder web-push
```
**验收**: `package.json` 包含所有依赖，`npm install` 成功  
**预估**: 10 分钟  
**状态**: ✅ 已完成

### T002: 配置 Tailwind 响应式断点 ✅
**文件**: `tailwind.config.ts`  
**操作**: 
- 添加 `xs: '375px'` 断点
- 添加触摸目标工具类（`min-h-touch`, `min-w-touch` = 44px）
- 扩展间距系统（移动端优化）

**代码示例**:
```typescript
export default {
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      minHeight: { 'touch': '44px' },
      minWidth: { 'touch': '44px' },
    }
  }
}
```
**验收**: 可以使用 `xs:` 前缀，触摸类生效  
**预估**: 15 分钟

### T003: 配置 Next.js PWA (next.config.mjs)
**文件**: `next.config.mjs`  
**操作**:
- 集成 next-pwa
- 配置 Service Worker 缓存策略
- 禁用开发环境 PWA

**代码示例**:
```javascript
import withPWA from '@ducanh2912/next-pwa';

const nextConfig = {
  // existing config...
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // API cache strategy
    {
      urlPattern: /^\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: { maxEntries: 32, maxAgeSeconds: 86400 }
      }
    },
    // Image cache strategy
    {
      urlPattern: /\.(?:jpg|jpeg|png|webp|svg|gif|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: { maxEntries: 64, maxAgeSeconds: 2592000 }
      }
    }
  ]
})(nextConfig);
```
**验收**: 构建后生成 `public/sw.js` 和 `public/workbox-*.js`  
**预估**: 20 分钟

### T004: 创建 PWA Manifest 和图标
**文件**: `public/manifest.json`, `public/icons/*`  
**操作**:
- 创建 Web App Manifest
- 准备 PWA 图标（192x192, 512x512, maskable）
- 创建离线页面模板

**Manifest 示例**:
```json
{
  "name": "血染钟楼资源平台",
  "short_name": "BOTC",
  "description": "Blood on the Clocktower 剧本分享与管理平台",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0EA5E9",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/maskable-icon.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```
**验收**: Manifest 通过验证，图标显示正确  
**预估**: 15 分钟

### T005: 设置 Lighthouse CI
**文件**: `.github/workflows/lighthouse.yml`, `lighthouserc.json`  
**操作**:
- 创建 GitHub Actions 工作流
- 配置性能预算（FCP < 2s, LCP < 3s）
- 设置移动端测试

**lighthouserc.json**:
```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "settings": {
        "preset": "mobile",
        "throttling": { "rttMs": 150, "throughputKbps": 1638.4 }
      },
      "url": [
        "http://localhost:3000",
        "http://localhost:3000/scripts",
        "http://localhost:3000/upload"
      ]
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
**验收**: CI 流程运行成功，报告生成  
**预估**: 20 分钟

---

## Phase 2: 基础设施 (10 tasks, ~5h)

### T006 [P]: 创建响应式 Hook - useMediaQuery
**文件**: `src/hooks/useMediaQuery.ts`  
**操作**: 创建监听断点变化的 Hook
```typescript
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  
  return matches;
}

// 预定义断点
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
```
**验收**: Hook 正常工作，能检测断点变化  
**预估**: 30 分钟

### T007 [P]: 创建触摸手势 Hook - useTouchGesture
**文件**: `src/hooks/useTouchGesture.ts`  
**操作**: 封装触摸事件处理
```typescript
interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function useSwipe(handlers: SwipeHandlers, threshold = 50) {
  // Touch event handling logic
  // Return touch handlers for element
}
```
**验收**: 可以检测滑动方向，触发回调  
**预估**: 40 分钟

### T008 [P]: 创建在线状态 Hook - useOnlineStatus
**文件**: `src/hooks/useOnlineStatus.ts`  
**操作**: 监听网络状态变化
```typescript
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}
```
**验收**: 能检测在线/离线状态切换  
**预估**: 20 分钟

### T009 [P]: 创建图片优化脚本 - 批量生成 WebP
**文件**: `scripts/optimize-images.ts`  
**操作**:
- 使用 sharp 将 uploads/ 下的图片转换为 WebP
- 生成多尺寸响应式图片（640/768/1024/1280/1536w）
- 保留原图，WebP 存到 uploads/optimized/

```typescript
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

async function optimizeImage(inputPath: string, outputDir: string) {
  const fileName = path.basename(inputPath, path.extname(inputPath));
  const sizes = [640, 768, 1024, 1280, 1536];
  
  // Original WebP
  await sharp(inputPath)
    .webp({ quality: 80 })
    .toFile(path.join(outputDir, `${fileName}.webp`));
  
  // Responsive sizes
  await Promise.all(
    sizes.map(width =>
      sharp(inputPath)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(outputDir, `${fileName}-${width}w.webp`))
    )
  );
}

// Batch process all images in uploads/
async function processAllImages() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const outputDir = path.join(uploadsDir, 'optimized');
  await fs.mkdir(outputDir, { recursive: true });
  
  const files = await fs.readdir(uploadsDir);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  
  for (const file of imageFiles) {
    await optimizeImage(path.join(uploadsDir, file), outputDir);
    console.log(`✓ Optimized: ${file}`);
  }
}

processAllImages().catch(console.error);
```
**验收**: 运行脚本后生成 WebP 文件，尺寸正确  
**预估**: 45 分钟

### T010 [P]: 创建模糊占位图生成脚本
**文件**: `scripts/generate-placeholders.ts`  
**操作**: 使用 plaiceholder 生成 LQIP
```typescript
import { getPlaiceholder } from 'plaiceholder';
import fs from 'fs/promises';
import path from 'path';

async function generatePlaceholder(imagePath: string) {
  const { base64, img } = await getPlaiceholder(imagePath, { size: 10 });
  const fileName = path.basename(imagePath, path.extname(imagePath));
  
  return {
    fileName,
    ...img,
    blurDataURL: base64
  };
}

async function generateAllPlaceholders() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = await fs.readdir(uploadsDir);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  
  const placeholders = [];
  for (const file of imageFiles) {
    const data = await generatePlaceholder(path.join(uploadsDir, file));
    placeholders.push(data);
  }
  
  // Save to JSON for static import
  await fs.writeFile(
    path.join(process.cwd(), 'src/data/placeholders.json'),
    JSON.stringify(placeholders, null, 2)
  );
}

generateAllPlaceholders().catch(console.error);
```
**验收**: 生成 placeholders.json，包含 base64 数据  
**预估**: 30 分钟

### T011 [P]: 创建 Service Worker 工具 - 缓存管理
**文件**: `src/lib/pwa/cache-strategies.ts`  
**操作**: 封装常用缓存策略
```typescript
// Network First (API requests)
export async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    const cache = await caches.open('api-cache');
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Cache First (static assets)
export async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  const response = await fetch(request);
  const cache = await caches.open('static-cache');
  cache.put(request, response.clone());
  return response;
}
```
**验收**: 缓存策略按预期工作  
**预估**: 40 分钟

### T012 [P]: 创建 IndexedDB 离线队列封装
**文件**: `src/lib/pwa/offline-queue.ts`  
**操作**: 封装离线操作队列
```typescript
interface OfflineAction {
  id: string;
  type: 'like' | 'favorite' | 'comment';
  action: 'add' | 'remove' | 'create';
  data: any;
  timestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'failed';
}

export class OfflineQueue {
  private dbName = 'offline-queue';
  private storeName = 'actions';
  
  async init(): Promise<void>;
  async enqueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries' | 'status'>): Promise<void>;
  async getPending(): Promise<OfflineAction[]>;
  async markSynced(id: string): Promise<void>;
  async markFailed(id: string): Promise<void>;
  async clear(): Promise<void>;
}
```
**验收**: 可以存取离线操作，IndexedDB 正常工作  
**预估**: 1 小时

### T013 [P]: 创建推送通知客户端逻辑
**文件**: `src/lib/pwa/push-notifications.ts`  
**操作**: 封装 Push API
```typescript
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }
  return await Notification.requestPermission();
}

export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription> {
  const registration = await navigator.serviceWorker.ready;
  
  return await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  // Convert VAPID key to Uint8Array
}
```
**验收**: 能请求权限、订阅和取消订阅  
**预估**: 45 分钟

### T014: 添加 PushSubscription 数据模型 (Prisma)
**文件**: `prisma/schema.prisma`  
**操作**: 扩展 Prisma Schema
```prisma
model PushSubscription {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint    String   @unique
  keys        String   // JSON: {p256dh, auth}
  userAgent   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId])
}

model NotificationQueue {
  id          String   @id @default(cuid())
  userId      String
  type        String   // 'review-result', 'comment-reply', 'system'
  title       String
  body        String
  data        String?  // JSON
  status      String   @default("pending") // pending/sent/failed
  createdAt   DateTime @default(now())
  sentAt      DateTime?
  error       String?
  
  @@index([userId, status])
  @@index([status, createdAt])
}
```
**依赖**: 无（Prisma Schema）  
**验收**: Schema 验证通过  
**预估**: 15 分钟

### T015: 运行 Prisma Migration
**文件**: 数据库  
**操作**: 
```bash
npx prisma migrate dev --name add_pwa_models
npx prisma generate
```
**依赖**: T014  
**验收**: 数据库更新成功，TypeScript 类型生成  
**预估**: 10 分钟

---

## Phase 3: 布局组件 (5 tasks, ~3h)

### T016: 移动端 SiteHeader - 汉堡菜单
**文件**: `app/_components/SiteHeader.tsx`  
**操作**:
- 添加汉堡菜单（< md 断点）
- 保留桌面端导航（≥ md）
- 添加菜单展开/收起动画

**关键改动**:
```tsx
export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Logo />
          
          {/* Desktop Nav */}
          {!isMobile && <DesktopNav />}
          
          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="min-w-touch min-h-touch p-2"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          )}
        </div>
        
        {/* Mobile Menu */}
        {isMobile && isMenuOpen && (
          <MobileMenu onClose={() => setIsMenuOpen(false)} />
        )}
      </div>
    </header>
  );
}
```
**验收**: 移动端显示汉堡菜单，桌面端显示完整导航  
**预估**: 1 小时

### T017: 移动端 SiteFooter - 简化布局
**文件**: `app/_components/SiteFooter.tsx`  
**操作**:
- 移动端单列布局
- 简化链接显示
- 保持必要信息（版权、关键链接）

**关键改动**:
```tsx
export default function SiteFooter() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Desktop: 多列，Mobile: 单列 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-bold">关于</h3>
            <nav className="flex flex-col space-y-1">
              <Link href="/about">关于平台</Link>
              <Link href="/help">帮助中心</Link>
            </nav>
          </div>
          {/* 其他列... */}
        </div>
        
        {/* Copyright */}
        <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
          © 2025 血染钟楼资源平台
        </div>
      </div>
    </footer>
  );
}
```
**验收**: 移动端单列清晰，桌面端多列布局  
**预估**: 30 分钟

### T018: 移动端 AdminLayout - 侧边栏折叠
**文件**: `app/admin/layout.tsx`  
**操作**:
- 移动端侧边栏改为抽屉式
- 添加顶部菜单按钮（< lg）
- 桌面端保持固定侧边栏（≥ lg）

**关键改动**:
```tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1024px)');
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header with Menu Button */}
      {isMobile && (
        <header className="sticky top-0 z-40 bg-white shadow">
          <div className="flex items-center justify-between px-4 h-16">
            <h1 className="font-bold">管理后台</h1>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="min-w-touch min-h-touch"
            >
              <MenuIcon />
            </button>
          </div>
        </header>
      )}
      
      {/* Sidebar - Desktop: Fixed, Mobile: Drawer */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform',
        isMobile ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'
      )}>
        <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
      </aside>
      
      {/* Main Content */}
      <main className={cn('transition-all', isMobile ? 'ml-0' : 'ml-64')}>
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
      
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
```
**验收**: 移动端抽屉式侧边栏，桌面端固定侧边栏  
**预估**: 1 小时 15 分钟

### T019: 全局 layout.tsx - 添加 PWA Meta 标签
**文件**: `app/layout.tsx`  
**操作**:
- 添加 viewport meta 标签
- 添加 theme-color
- 链接 manifest.json
- 注册 Service Worker

**关键改动**:
```tsx
export const metadata: Metadata = {
  // existing metadata...
  manifest: '/manifest.json',
  themeColor: '#0EA5E9',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '血染钟楼',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0EA5E9" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        {children}
        <RegisterServiceWorker />
        <Toaster />
      </body>
    </html>
  );
}
```
**验收**: Meta 标签正确，PWA 可安装  
**预估**: 20 分钟

### T020: 创建离线页面
**文件**: `public/offline.html`  
**操作**: 创建简单的离线提示页面
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>离线 - 血染钟楼</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { font-size: 1.125rem; opacity: 0.9; }
  </style>
</head>
<body>
  <div>
    <h1>📡 您当前处于离线状态</h1>
    <p>请检查网络连接后重试</p>
    <p style="margin-top: 2rem;">
      <button onclick="window.location.reload()" style="padding: 12px 24px; font-size: 1rem; border: 2px solid white; background: transparent; color: white; border-radius: 8px; cursor: pointer;">
        重新加载
      </button>
    </p>
  </div>
</body>
</html>
```
**验收**: 离线时显示友好提示  
**预估**: 15 分钟

---

## Phase 4: 交互组件 (5 tasks, ~3h)

### T021 [P]: HotCarousel - 触摸滑动支持
**文件**: `app/_components/HotCarousel.tsx`  
**操作**:
- 添加触摸滑动手势
- 移动端隐藏左右箭头（< sm）
- 保留指示器和自动播放

**关键改动**:
```tsx
export default function HotCarousel({ items }: { items: Script[] }) {
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => goToNext(),
    onSwipeRight: () => goToPrev(),
  });
  const isMobile = useIsMobile();
  
  return (
    <div className="relative" {...swipeHandlers}>
      {/* Carousel items */}
      <div className="overflow-hidden">
        {/* slides... */}
      </div>
      
      {/* Navigation buttons - hidden on mobile */}
      {!isMobile && (
        <>
          <button onClick={goToPrev} className="absolute left-4 top-1/2 -translate-y-1/2 min-w-touch min-h-touch">
            <ChevronLeftIcon />
          </button>
          <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 min-w-touch min-h-touch">
            <ChevronRightIcon />
          </button>
        </>
      )}
      
      {/* Indicators - always visible */}
      <div className="flex justify-center gap-2 mt-4">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={cn(
              'w-2 h-2 rounded-full transition-all min-w-touch min-h-touch',
              idx === currentSlide ? 'bg-sky-500 w-8' : 'bg-gray-300'
            )}
          />
        ))}
      </div>
    </div>
  );
}
```
**验收**: 可以滑动切换，移动端无箭头，指示器可点击  
**预估**: 45 分钟

### T022 [P]: ScriptImagesCarousel - 手势优化
**文件**: `app/scripts/ScriptImagesCarousel.tsx`  
**操作**:
- 添加双指缩放支持（可选）
- 优化触摸响应速度
- 添加全屏预览模式（移动端）

**关键改动**:
```tsx
export default function ScriptImagesCarousel({ images }: { images: ImageAsset[] }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => goToNext(),
    onSwipeRight: () => goToPrev(),
  });
  
  return (
    <>
      <div className="relative" {...swipeHandlers}>
        <Image
          src={images[currentIndex].path}
          alt={`Image ${currentIndex + 1}`}
          fill
          className="object-contain cursor-pointer"
          onClick={() => setIsFullscreen(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      
      {/* Fullscreen Modal (mobile) */}
      {isFullscreen && (
        <FullscreenImageViewer
          images={images}
          initialIndex={currentIndex}
          onClose={() => setIsFullscreen(false)}
        />
      )}
    </>
  );
}
```
**验收**: 滑动流畅，全屏预览可用  
**预估**: 1 小时

### T023 [P]: ScriptCardActions - 触摸目标优化
**文件**: `app/scripts/ScriptCardActions.tsx`  
**操作**:
- 确保所有按钮 ≥ 44x44px
- 增加按钮间距（≥ 8px）
- 添加触摸反馈动画

**关键改动**:
```tsx
export default function ScriptCardActions({ scriptId }: { scriptId: string }) {
  return (
    <div className="flex items-center gap-2">
      {/* Like button */}
      <button
        onClick={handleLike}
        className={cn(
          'min-w-touch min-h-touch flex items-center justify-center',
          'rounded-lg p-2 transition-all duration-150',
          'active:scale-95', // Touch feedback
          liked ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500'
        )}
        aria-label="点赞"
      >
        <HeartIcon className={liked ? 'fill-current' : ''} />
        <span className="ml-1">{likeCount}</span>
      </button>
      
      {/* Favorite button */}
      <button
        onClick={handleFavorite}
        className={cn(
          'min-w-touch min-h-touch flex items-center justify-center',
          'rounded-lg p-2 transition-all duration-150',
          'active:scale-95',
          favorited ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-500'
        )}
        aria-label="收藏"
      >
        <StarIcon className={favorited ? 'fill-current' : ''} />
      </button>
      
      {/* Download button */}
      <button
        onClick={handleDownload}
        className="min-w-touch min-h-touch flex items-center justify-center rounded-lg p-2 bg-gray-50 text-gray-500 transition-all active:scale-95"
        aria-label="下载"
      >
        <DownloadIcon />
      </button>
    </div>
  );
}
```
**验收**: 按钮触摸区域足够大，间距合理，有反馈  
**预估**: 30 分钟

### T024 [P]: 表单键盘自动滚动逻辑
**文件**: `src/hooks/useKeyboardScroll.ts`  
**操作**: 创建 Hook 处理键盘弹出时的滚动
```typescript
export function useKeyboardScroll() {
  useEffect(() => {
    // iOS specific
    const handleFocusIn = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        setTimeout(() => {
          e.target.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 300); // Wait for keyboard animation
      }
    };
    
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);
}

// Usage in forms
export default function UploadForm() {
  useKeyboardScroll();
  // ... form fields
}
```
**验收**: 输入框获焦时自动滚动到可见区域  
**预估**: 45 分钟

### T025 [P]: Toaster - 移动端位置调整
**文件**: `app/_components/Toaster.tsx`  
**操作**:
- 移动端底部显示（避免被键盘遮挡）
- 桌面端右上角显示
- 确保触摸可关闭

**关键改动**:
```tsx
export default function Toaster() {
  const isMobile = useIsMobile();
  
  return (
    <Toaster
      position={isMobile ? 'bottom-center' : 'top-right'}
      toastOptions={{
        duration: 3000,
        style: {
          minWidth: isMobile ? '90vw' : '350px',
          minHeight: '44px', // Touch target
        },
        className: 'text-sm md:text-base',
      }}
    />
  );
}
```
**验收**: 移动端底部显示，桌面端右上角  
**预估**: 20 分钟

---

## Phase 5: 页面适配 (10 tasks, ~6h)

### T026 [P]: 首页响应式适配
**文件**: `app/page.tsx`, `app/_components/HeroSection.tsx`, `app/_components/FeaturesGrid.tsx`  
**操作**:
- Hero 区域字号缩小（移动端）
- FeaturesGrid 单列（< sm）、双列（sm-md）、三列（≥ md）
- 间距调整

**关键改动**:
```tsx
// HeroSection.tsx
<section className="py-12 md:py-20 lg:py-32">
  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
    血染钟楼资源平台
  </h1>
  <p className="mt-4 text-base sm:text-lg md:text-xl">
    分享与管理你的剧本
  </p>
</section>

// FeaturesGrid.tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
  {features.map(feature => <FeatureCard key={feature.id} {...feature} />)}
</div>
```
**验收**: 各断点布局正常，文字大小合适  
**预估**: 45 分钟

### T027 [P]: 剧本列表页适配
**文件**: `app/scripts/page.tsx`  
**操作**:
- 搜索框全宽（移动端）
- 卡片单列（< sm）、双列（sm-md）、三列（≥ lg）
- 分页控件触摸优化

**关键改动**:
```tsx
export default async function ScriptsPage({ searchParams }: Props) {
  const scripts = await fetchScripts(searchParams);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Search bar - full width on mobile */}
      <div className="mb-6">
        <input
          type="search"
          placeholder="搜索剧本..."
          className="w-full min-h-touch px-4 py-3 text-base border rounded-lg"
        />
      </div>
      
      {/* Script cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {scripts.map(script => (
          <ScriptCard key={script.id} script={script} />
        ))}
      </div>
      
      {/* Pagination */}
      <div className="mt-8 flex justify-center gap-2">
        <button className="min-w-touch min-h-touch px-4 py-2">上一页</button>
        <button className="min-w-touch min-h-touch px-4 py-2">下一页</button>
      </div>
    </div>
  );
}
```
**验收**: 单列清晰，搜索易用，分页可点击  
**预估**: 40 分钟

### T028 [P]: 剧本详情页适配
**文件**: `app/scripts/[id]/page.tsx`  
**操作**:
- 图片轮播响应式
- 元数据堆叠布局（移动端）
- 评论区优化

**关键改动**:
```tsx
export default async function ScriptDetailPage({ params }: Props) {
  const script = await fetchScript(params.id);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Image carousel */}
      <div className="aspect-video sm:aspect-[4/3] lg:aspect-video">
        <ScriptImagesCarousel images={script.images} />
      </div>
      
      {/* Content - stack on mobile, side-by-side on desktop */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            {script.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {script.summary}
          </p>
          
          {/* Actions */}
          <ScriptCardActions scriptId={script.id} />
          
          {/* Comments */}
          <CommentsSection scriptId={script.id} />
        </div>
        
        {/* Metadata sidebar */}
        <div className="lg:col-span-1">
          <ScriptMetaPanel script={script} />
        </div>
      </div>
    </div>
  );
}
```
**验收**: 移动端单列堆叠，桌面端侧边栏  
**预估**: 50 分钟

### T029 [P]: 上传页面表单优化
**文件**: `app/upload/page.tsx`  
**操作**:
- 输入框最小高度 44px
- 文件选择按钮触摸优化
- 图片预览适配
- 应用键盘滚动 Hook

**关键改动**:
```tsx
'use client';

export default function UploadPage() {
  useKeyboardScroll(); // 键盘自动滚动
  
  return (
    <form className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">上传剧本</h1>
      
      {/* Title input */}
      <div>
        <label className="block text-sm font-medium mb-2">剧本标题</label>
        <input
          type="text"
          className="w-full min-h-touch px-4 py-3 text-base border rounded-lg"
          placeholder="例如：隐舟暗渡"
        />
      </div>
      
      {/* File upload */}
      <div>
        <label className="block text-sm font-medium mb-2">JSON 文件</label>
        <button
          type="button"
          onClick={handleFileSelect}
          className="w-full min-h-touch py-3 border-2 border-dashed rounded-lg"
        >
          选择文件
        </button>
      </div>
      
      {/* Image upload */}
      <div>
        <label className="block text-sm font-medium mb-2">封面图片</label>
        <input
          type="file"
          accept="image/*"
          multiple
          className="w-full min-h-touch"
        />
        
        {/* Image previews - responsive grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previews.map(preview => (
            <div key={preview.id} className="aspect-square rounded-lg overflow-hidden">
              <img src={preview.url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Submit button */}
      <button
        type="submit"
        className="w-full min-h-touch py-4 text-lg font-medium text-white bg-gradient-to-r from-sky-500 to-cyan-600 rounded-lg"
      >
        提交剧本
      </button>
    </form>
  );
}
```
**验收**: 表单易用，键盘不遮挡，预览适配  
**预估**: 1 小时

### T030 [P]: 排行榜页面适配
**文件**: `app/leaderboard/page.tsx`  
**操作**:
- 切换按钮触摸优化
- 移动端卡片视图
- 桌面端表格视图

**关键改动**:
```tsx
export default async function LeaderboardPage({ searchParams }: Props) {
  const isMobile = false; // SSR, 使用 CSS
  const rankings = await fetchRankings(searchParams.type);
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Type switcher - responsive */}
      <div className="flex gap-2 mb-6">
        <button className="flex-1 sm:flex-none min-h-touch px-6 py-3">
          按点赞
        </button>
        <button className="flex-1 sm:flex-none min-h-touch px-6 py-3">
          按收藏
        </button>
        <button className="flex-1 sm:flex-none min-h-touch px-6 py-3">
          按下载
        </button>
      </div>
      
      {/* Mobile: Card view, Desktop: Table */}
      <div className="sm:hidden space-y-4">
        {rankings.map((item, idx) => (
          <RankingCard key={item.id} rank={idx + 1} item={item} />
        ))}
      </div>
      
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          {/* Table content */}
        </table>
      </div>
    </div>
  );
}
```
**验收**: 移动端卡片，桌面端表格，切换按钮大  
**预估**: 45 分钟

### T031 [P]: 个人页面适配
**文件**: `app/profile/page.tsx`, `app/my/favorites/page.tsx`, `app/my/uploads/page.tsx`  
**操作**:
- 头像和信息响应式布局
- 标签页触摸优化
- 内容列表适配

**关键改动**:
```tsx
export default async function ProfilePage() {
  const user = await getCurrentUser();
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Profile header - stack on mobile */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
        <Avatar size="lg" src={user.avatarUrl} />
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold">{user.nickname}</h1>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>
      
      {/* Tabs - full width buttons on mobile */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Link
          href="/my/uploads"
          className="min-h-touch py-3 text-center border rounded-lg"
        >
          我的上传
        </Link>
        <Link
          href="/my/favorites"
          className="min-h-touch py-3 text-center border rounded-lg"
        >
          我的收藏
        </Link>
        <Link
          href="/settings"
          className="min-h-touch py-3 text-center border rounded-lg"
        >
          设置
        </Link>
      </div>
      
      {children}
    </div>
  );
}
```
**验收**: 移动端堆叠清晰，标签页易点击  
**预估**: 40 分钟

### T032 [P]: 登录/注册页面适配
**文件**: `app/login/page.tsx`, `app/register/page.tsx`  
**操作**:
- 输入框类型正确（email, password）
- 最小高度 44px
- 应用键盘滚动

**关键改动**:
```tsx
'use client';

export default function LoginPage() {
  useKeyboardScroll();
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center">登录</h1>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">邮箱</label>
            <input
              type="email" // 触发邮箱键盘
              autoComplete="email"
              className="w-full min-h-touch px-4 py-3 text-base border rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">密码</label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full min-h-touch px-4 py-3 text-base border rounded-lg"
            />
          </div>
          
          <button
            type="submit"
            className="w-full min-h-touch py-4 text-lg font-medium text-white bg-sky-500 rounded-lg"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );
}
```
**验收**: 键盘类型正确，不遮挡输入框  
**预估**: 30 分钟

### T033 [P]: 管理后台剧本页面适配
**文件**: `app/admin/scripts/page.tsx`  
**操作**:
- 移动端横向滚动表格
- 操作按钮触摸优化
- 筛选器适配

**关键改动**:
```tsx
export default async function AdminScriptsPage() {
  const scripts = await fetchAdminScripts();
  
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">剧本管理</h1>
      
      {/* Filters - responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <select className="min-h-touch px-4 py-2 border rounded-lg">
          <option>全部状态</option>
        </select>
        {/* More filters */}
      </div>
      
      {/* Table - horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full bg-white rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs sm:text-sm">标题</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm">状态</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody>
            {scripts.map(script => (
              <tr key={script.id} className="border-t">
                <td className="px-4 py-3 text-sm">{script.title}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-1 text-xs rounded">
                    {script.state}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="min-w-touch min-h-touch p-2">
                      编辑
                    </button>
                    <button className="min-w-touch min-h-touch p-2">
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```
**验收**: 移动端可横向滚动，按钮易点击  
**预估**: 50 分钟

### T034 [P]: 管理后台用户页面适配
**文件**: `app/admin/users/page.tsx`  
**操作**: 同 T033，表格横向滚动
**验收**: 移动端表格可用  
**预估**: 30 分钟

### T035 [P]: 管理后台统计页面适配
**文件**: `app/admin/analytics/page.tsx`  
**操作**:
- 统计卡片单列（< sm）
- 图表适配小屏幕（chart.js responsive）
- 数字缩小字号

**关键改动**:
```tsx
export default async function AnalyticsPage() {
  const stats = await fetchStats();
  
  return (
    <div className="space-y-6">
      {/* Stats cards - responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>
      
      {/* Charts - responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium mb-4">上传趋势</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveChart data={uploadTrend} />
          </div>
        </div>
        {/* More charts */}
      </div>
    </div>
  );
}
```
**验收**: 卡片清晰，图表适配  
**预估**: 45 分钟

---

## Phase 6: 图片优化 (3 tasks, ~2h)

### T036: 批量生成 WebP 图片
**文件**: 执行脚本  
**操作**: 
```bash
npx ts-node scripts/optimize-images.ts
```
**依赖**: T009  
**验收**: uploads/optimized/ 包含所有 WebP 图片  
**预估**: 30 分钟（包含脚本调试）

### T037: 生成模糊占位图
**文件**: 执行脚本  
**操作**:
```bash
npx ts-node scripts/generate-placeholders.ts
```
**依赖**: T010  
**验收**: src/data/placeholders.json 生成  
**预估**: 20 分钟

### T038: 更新所有 Image 组件（懒加载 + WebP）
**文件**: 多个组件文件  
**操作**:
- 替换 `<img>` 为 Next.js `<Image>`
- 添加 `placeholder="blur"` 和 `blurDataURL`
- 配置 `sizes` 属性
- 启用懒加载（默认）

**示例**:
```tsx
import Image from 'next/image';
import placeholders from '@/data/placeholders.json';

export function ScriptCard({ script }: Props) {
  const placeholder = placeholders.find(p => p.fileName === script.coverImageId);
  
  return (
    <div className="rounded-lg overflow-hidden">
      <Image
        src={`/uploads/optimized/${script.coverImageId}.webp`}
        alt={script.title}
        width={640}
        height={480}
        placeholder="blur"
        blurDataURL={placeholder?.blurDataURL}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="w-full h-auto"
      />
    </div>
  );
}
```
**验收**: 图片懒加载，显示占位图，加载 WebP  
**预估**: 1 小时 10 分钟

---

## Phase 7: PWA 集成 (5 tasks, ~4h)

### T039: 注册 Service Worker
**文件**: `app/_components/RegisterServiceWorker.tsx`  
**操作**: 客户端组件注册 SW
```tsx
'use client';

export default function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(error => {
          console.error('SW registration failed:', error);
        });
    }
  }, []);
  
  return null;
}
```
**依赖**: T003  
**验收**: Service Worker 注册成功，可在 DevTools 查看  
**预估**: 30 分钟

### T040: 实现离线同步逻辑
**文件**: `src/lib/pwa/offline-sync.ts`  
**操作**:
- 实现 OfflineSyncManager 类
- 监听 online 事件自动同步
- UI 显示同步状态

```typescript
export class OfflineSyncManager {
  private queue: OfflineQueue;
  
  constructor() {
    this.queue = new OfflineQueue();
    this.setupListeners();
  }
  
  private setupListeners() {
    window.addEventListener('online', () => {
      this.syncAll();
    });
    
    // Background Sync API
    if ('serviceWorker' in navigator && 'sync' in self.registration) {
      navigator.serviceWorker.ready.then(registration => {
        return registration.sync.register('sync-offline-actions');
      });
    }
  }
  
  async queueLike(scriptId: string, action: 'add' | 'remove') {
    await this.queue.enqueue({
      type: 'like',
      action,
      data: { scriptId }
    });
    
    // 乐观更新 UI
    // ...
  }
  
  async syncAll() {
    const pending = await this.queue.getPending();
    if (pending.length === 0) return;
    
    try {
      const response = await fetch('/api/offline-sync/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions: pending })
      });
      
      const results = await response.json();
      
      // Update queue based on results
      for (let i = 0; i < results.length; i++) {
        if (results[i].success) {
          await this.queue.markSynced(pending[i].id);
        } else {
          await this.queue.markFailed(pending[i].id);
        }
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}
```
**依赖**: T012  
**验收**: 离线操作可以保存，在线后自动同步  
**预估**: 1 小时 30 分钟

### T041: 添加"添加到主屏幕"提示
**文件**: `app/_components/InstallPrompt.tsx`  
**操作**: 引导用户安装 PWA
```tsx
'use client';

export default function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  const handleInstall = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white shadow-lg rounded-lg p-4 z-50">
      <h3 className="font-bold mb-2">安装应用</h3>
      <p className="text-sm text-gray-600 mb-4">
        将血染钟楼添加到主屏幕，获得类原生应用体验
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 py-2 bg-sky-500 text-white rounded-lg"
        >
          安装
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="flex-1 py-2 border rounded-lg"
        >
          暂不
        </button>
      </div>
    </div>
  );
}
```
**验收**: 显示安装提示，可以触发安装  
**预估**: 45 分钟

### T042: 推送通知权限请求 UI
**文件**: `app/_components/NotificationPrompt.tsx`  
**操作**: 引导用户开启通知
```tsx
'use client';

export default function NotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  
  const handleRequest = async () => {
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      
      if (result === 'granted') {
        const subscription = await subscribeToPush(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        );
        
        // Send subscription to backend
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    }
  };
  
  if (permission !== 'default') return null;
  
  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white shadow-lg rounded-lg p-4 z-50">
      <h3 className="font-bold mb-2">开启通知</h3>
      <p className="text-sm text-gray-600 mb-4">
        接收剧本审核结果、评论回复等重要通知
      </p>
      <button
        onClick={handleRequest}
        className="w-full py-2 bg-sky-500 text-white rounded-lg"
      >
        开启通知
      </button>
    </div>
  );
}
```
**依赖**: T013  
**验收**: 可以请求权限并订阅推送  
**预估**: 45 分钟

### T043: 测试 PWA 安装流程
**文件**: 手动测试  
**操作**:
- 在移动设备上访问
- 测试添加到主屏幕
- 测试离线访问
- 测试推送通知

**测试清单**:
- [ ] Manifest 正确加载
- [ ] 图标显示正确
- [ ] 可以添加到主屏幕
- [ ] 独立窗口启动
- [ ] 离线可访问已缓存页面
- [ ] 推送通知显示正常
- [ ] 离线操作同步成功

**验收**: 所有 PWA 功能正常工作  
**预估**: 30 分钟

---

## Phase 8: 测试与优化 (7 tasks, ~4h)

### T044 [P]: 真实设备测试 - iPhone
**操作**: 在 iPhone 15 (iOS 18, Safari 18) 上测试
**测试清单**:
- [ ] 所有页面正常显示（320px 最小宽度）
- [ ] 触摸目标大小合适
- [ ] 键盘弹出不遮挡输入框
- [ ] 轮播图手势流畅
- [ ] PWA 可安装
- [ ] 推送通知工作
- [ ] 离线功能正常

**验收**: 无重大问题，体验流畅  
**预估**: 45 分钟

### T045 [P]: 真实设备测试 - Android
**操作**: 在 Samsung Galaxy S23 (Android 14, Chrome 120) 上测试
**测试清单**: 同 T044
**验收**: Android 特有功能正常（添加到主屏幕、通知）  
**预估**: 45 分钟

### T046 [P]: 微信浏览器兼容性测试
**操作**: 在微信内置浏览器测试（iOS 和 Android 各一次）
**测试清单**:
- [ ] 基本功能正常
- [ ] PWA 功能降级处理
- [ ] 分享功能可用
- [ ] 图片加载正常

**验收**: 微信浏览器基本功能可用  
**预估**: 30 分钟

### T047 [P]: Lighthouse 性能测试（移动端）
**操作**: 运行 Lighthouse CI，检查性能指标
**测试命令**:
```bash
npm run build
npm run start
npx lhci autorun
```
**验收标准**:
- Performance ≥ 90
- Accessibility ≥ 90
- FCP < 2s
- LCP < 3s

**如未达标**: 进入 T049 优化  
**预估**: 30 分钟

### T048 [P]: 无障碍测试
**操作**:
- 使用 axe DevTools 扫描
- VoiceOver 测试（iOS）
- TalkBack 测试（Android）
- 键盘导航测试

**测试清单**:
- [ ] 所有交互元素可通过键盘访问
- [ ] aria-label 正确设置
- [ ] 对比度符合 WCAG AA
- [ ] 屏幕阅读器可正常朗读

**验收**: Lighthouse 无障碍分数 ≥ 90  
**预估**: 45 分钟

### T049: 性能优化（根据测试结果）
**操作**: 根据 Lighthouse 报告优化
**可能的优化项**:
- 压缩图片质量
- 启用 gzip/brotli
- 代码分割优化
- 字体预加载
- 关键 CSS 内联

**示例**:
```tsx
// 动态导入非关键组件
const AdminSidebar = dynamic(() => import('./AdminSidebar'), {
  loading: () => <Skeleton />,
  ssr: false
});

// 字体优化
import { Inter } from 'next/font/google';
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true
});
```
**验收**: 性能指标达标  
**预估**: 1 小时

### T050: 文档更新
**文件**: `specs/012-mobile-responsive-adaptation/implementation-notes.md`, `specs/012-mobile-responsive-adaptation/verification.md`  
**操作**:
- 记录实施过程中的关键决策
- 记录已知问题和限制
- 更新验证文档

**implementation-notes.md 内容**:
- 技术选型确认
- 实施过程中的修改
- 遇到的问题和解决方案
- 性能测试结果
- 截图对比（优化前后）

**verification.md 内容**:
- 功能验收清单
- 性能验收清单
- 兼容性验收清单
- 已知问题列表

**验收**: 文档完整，可供未来参考  
**预估**: 30 分钟

---

## Dependencies Graph

```
Setup (T001-T005)
  ↓
Infrastructure (T006-T015)
  ├─ Hooks (T006-T008) [P] → Components
  ├─ Scripts (T009-T010) [P] → T036-T038
  ├─ PWA (T011-T013) [P] → T039-T043
  └─ Database (T014-T015) → APIs
  ↓
Layout Components (T016-T020)
  ↓
Interaction Components (T021-T025) [P]
  ↓
Page Adaptations (T026-T035) [P]
  ↓
Image Optimization (T036-T038)
  ↓
PWA Integration (T039-T043)
  ↓
Testing & Optimization (T044-T050) [P]
```

## Parallel Execution Examples

**Phase 2 - Infrastructure (可并行)**:
```bash
# 同时创建 3 个 Hooks
Task T006: Create useMediaQuery Hook
Task T007: Create useTouchGesture Hook
Task T008: Create useOnlineStatus Hook

# 同时创建图片脚本
Task T009: Create WebP generation script
Task T010: Create placeholder generation script
```

**Phase 4 - Interaction Components (可并行)**:
```bash
Task T021: Optimize HotCarousel for touch
Task T022: Optimize ScriptImagesCarousel
Task T023: Optimize ScriptCardActions touch targets
Task T024: Implement keyboard scroll logic
Task T025: Adjust Toaster position
```

**Phase 5 - Page Adaptations (可并行)**:
```bash
# 10 个页面可以同时适配
Task T026: Homepage responsive
Task T027: Scripts list page
Task T028: Script detail page
Task T029: Upload page
Task T030: Leaderboard page
# ... T031-T035
```

**Phase 8 - Testing (可并行)**:
```bash
Task T044: Test on iPhone
Task T045: Test on Android
Task T046: Test in WeChat browser
Task T047: Run Lighthouse CI
Task T048: Accessibility testing
```

## Validation Checklist

### Task Completeness
- [x] All components in inventory have adaptation tasks
- [x] All PWA features have implementation tasks
- [x] Image optimization pipeline complete
- [x] Testing coverage adequate
- [x] Documentation tasks included

### Task Quality
- [x] Each task specifies exact file paths
- [x] Parallel tasks [P] are truly independent
- [x] Dependencies clearly documented
- [x] Acceptance criteria defined
- [x] Time estimates provided

### Constitution Compliance
- [x] Material Design 3 principles maintained
- [x] TypeScript strict mode preserved
- [x] Performance targets monitored (T047, T049)
- [x] Accessibility requirements tested (T048)
- [x] No violations of code conventions

## Estimated Timeline

| Phase | Tasks | Estimated Time | Can Parallelize |
|-------|-------|----------------|-----------------|
| Setup | T001-T005 | 1h | Partially |
| Infrastructure | T006-T015 | 5h | Yes (6-13) |
| Layout | T016-T020 | 3h | No |
| Interaction | T021-T025 | 3h | Yes |
| Pages | T026-T035 | 6h | Yes |
| Images | T036-T038 | 2h | No |
| PWA | T039-T043 | 4h | No |
| Testing | T044-T050 | 4h | Yes (44-48) |
| **Total** | **50 tasks** | **~28h** | |

**With Parallelization**: ~18-20 hours (assuming 3-4 parallel developers)

## Notes

- **[P] Tasks**: Can be worked on simultaneously by different developers
- **Sequential Tasks**: Must be completed in order (e.g., T014 before T015)
- **Verification**: Each task has clear acceptance criteria
- **Rollback**: If a task breaks existing functionality, revert and fix
- **Documentation**: Update implementation-notes.md as you progress

## Success Criteria

Implementation is complete when:
- ✅ All 50 tasks marked as completed
- ✅ Lighthouse mobile performance ≥ 90
- ✅ Lighthouse accessibility ≥ 90
- ✅ FCP < 2s, LCP < 3s (measured via Lighthouse)
- ✅ All pages tested on iOS 18+, Android Chrome 120+, WeChat
- ✅ PWA installable and functional
- ✅ Push notifications working
- ✅ Offline sync operational
- ✅ No regressions in desktop experience
- ✅ Documentation complete

---

**Generated**: 2025-10-10 | **Status**: Ready for implementation  
**Next Step**: Run `/implement` to begin task execution, or manually execute tasks T001-T050 in order.

