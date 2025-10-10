# Implementation Plan: 全站移动端响应式适配

**Branch**: `master` (作为开发分支) | **Date**: 2025-10-10 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/012-mobile-responsive-adaptation/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
   → Spec loaded successfully with 5 clarifications completed
2. Fill Technical Context ✓
   → Project Type: Next.js Web Application (frontend + backend integrated)
   → All unknowns resolved via /clarify command
3. Fill Constitution Check section ✓
   → Based on CONSTITUTION.md requirements
4. Evaluate Constitution Check section ✓
   → All requirements aligned with M3 design system
   → No violations detected
5. Execute Phase 0 → research.md ✓
   → Technology choices documented
6. Execute Phase 1 → design artifacts ✓
   → Component inventory, breakpoints, PWA architecture
7. Re-evaluate Constitution Check ✓
   → Design maintains M3 compliance
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Task generation approach documented ✓
9. STOP - Ready for /tasks command ✓
```

## Summary

将现有 Next.js 血染钟楼资源平台的所有页面实现移动端响应式适配，包括完整的 PWA 功能。主要工作包括：

1. **响应式布局适配**: 所有页面支持 320px-1920px+ 屏幕宽度，采用 Tailwind 响应式断点
2. **触摸交互优化**: 44x44px 最小触摸目标，手势支持，键盘自动滚动
3. **图片激进优化**: 懒加载 + WebP + 模糊占位图 + 渐进式加载
4. **完整 PWA**: Service Worker、离线支持、添加到主屏幕、推送通知、后台同步
5. **性能目标**: FCP < 2秒，LCP < 3秒（4G 网络）
6. **兼容性**: iOS 18+, Android Chrome 120+, 微信最新版

技术方法：基于现有 Tailwind CSS + Material Design 3 系统扩展，使用 Next.js 内置优化功能，添加 PWA 支持（next-pwa），保持与项目宪法的完全一致性。

## Technical Context

**Language/Version**: TypeScript 5.4 (严格模式) + React 18.2 + Next.js 15.5  
**Primary Dependencies**: 
- 前端：Tailwind CSS 3.4, Next.js Image 优化
- PWA：next-pwa 或 Workbox 6+
- 图片：sharp (WebP 转换)，plaiceholder (模糊占位图)
- 通知：web-push, Push API

**Storage**: SQLite (Dev) / PostgreSQL (Prod) - 无变更，PWA 使用 IndexedDB + Cache Storage  
**Testing**: 
- 单元测试：无需新增（主要是 UI 适配）
- 设备测试：BrowserStack / 真实设备（iPhone 15+, Android 旗舰机）
- 性能测试：Lighthouse CI，WebPageTest

**Target Platform**: 
- 移动端：iOS 18+ (Safari 18+), Android 12+ (Chrome 120+)
- 桌面端：保持现有支持（向后兼容）
- PWA：支持 Service Worker 的现代浏览器
- 微信浏览器：最新版本

**Project Type**: Web Application (Next.js App Router + React Server Components)  
**Performance Goals**: 
- FCP < 2秒（4G 网络）
- LCP < 3秒（4G 网络）
- Lighthouse 性能分数 ≥ 90
- Lighthouse 无障碍分数 ≥ 90
- 初始包大小增量 < 50KB

**Constraints**: 
- 必须保持桌面端现有体验（向后兼容）
- 必须遵循项目宪法中的 M3 设计系统
- 不能破坏现有 API 和数据结构
- Service Worker 必须支持版本化更新
- 离线缓存策略必须考虑存储限制（<50MB）

**Scale/Scope**: 
- 页面数量：~20 页（包括管理后台）
- 组件改造：~30 个组件
- 图片优化：~100+ 图片资源
- PWA 功能：4 个核心模块（Service Worker、Manifest、推送通知、同步）
- 预估用户：移动端占比 50%+

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Material Design 3 合规性
- ✅ **色彩系统**: 使用现有 sky-500/cyan-500 配色，响应式适配不改变色彩
- ✅ **排版系统**: 移动端最小字号 16px（正文），保持 M3 五级系统
- ✅ **形状系统**: 圆角保持 8/12/16/24px，触摸目标 ≥ 44x44px
- ✅ **阴影系统**: 移动端保持 shadow-lg/2xl，适配小屏显示
- ✅ **无障碍**: 对比度 ≥ 4.5:1，支持屏幕阅读器（VoiceOver/TalkBack）
- ✅ **主题支持**: 继承现有浅色模式，未来可扩展深色模式

### 技术栈约束
- ✅ **TypeScript 严格模式**: 保持现有配置，禁用 `any`
- ✅ **Next.js App Router**: 使用现有架构，Server Components 优先
- ✅ **Prisma + SQLite**: 无需变更数据层
- ✅ **Zod 校验**: PWA 配置使用 Zod 验证
- ✅ **Tailwind CSS**: 扩展响应式断点，使用 M3 令牌

### 开发规范
- ✅ **命名约定**: 组件 PascalCase，工具函数 camelCase
- ✅ **代码质量**: 所有 PWA API 有类型定义，函数组件 + Hooks
- ✅ **Git 提交**: 遵循 Conventional Commits（feat/fix/style等）

### 安全与隐私
- ✅ **HTTPS 必需**: PWA 必须在 HTTPS 环境运行
- ✅ **权限请求**: 推送通知需用户明确授权
- ✅ **数据缓存**: 敏感数据（用户信息）不缓存到 Service Worker
- ✅ **离线同步**: 用户操作加密存储到 IndexedDB

### 性能标准
- ✅ **Lighthouse ≥ 90**: 移动端性能分数目标
- ✅ **图片优化**: Next.js Image + WebP + 懒加载
- ✅ **代码分割**: 动态导入非关键组件
- ✅ **关键CSS内联**: Tailwind JIT 自动优化

### 特殊考量
- ⚠️ **PWA 复杂度**: Service Worker 增加调试复杂度
  - **理由**: 离线支持是移动端核心需求，用户在弱网环境下访问
  - **缓解**: 使用成熟的 next-pwa 库，提供完善的调试工具
  
- ⚠️ **图片处理管线**: 构建时生成 WebP 和占位图增加构建时间
  - **理由**: 性能目标要求（FCP < 2s），图片是主要瓶颈
  - **缓解**: 使用增量构建，仅处理新增/修改的图片

**初始检查**: ✅ PASS - 所有要求符合项目宪法

## Project Structure

### Documentation (this feature)
```
specs/012-mobile-responsive-adaptation/
├── README.md           # 功能概览（已存在）
├── spec.md             # 功能规范（已存在，已完成澄清）
├── plan.md             # 本文档（/plan 命令输出）
├── research.md         # Phase 0 输出
├── component-inventory.md  # Phase 1 输出（组件改造清单）
├── breakpoints.md      # Phase 1 输出（断点策略）
├── pwa-architecture.md # Phase 1 输出（PWA 架构设计）
└── tasks.md            # Phase 2 输出（/tasks 命令生成）
```

### Source Code (existing Next.js structure)
```
xueran-juben-project/
├── app/                        # Next.js App Router
│   ├── _components/            # 共享组件（需改造）
│   │   ├── SiteHeader.tsx      # [MOBILE] 汉堡菜单
│   │   ├── SiteFooter.tsx      # [MOBILE] 简化布局
│   │   ├── HeroSection.tsx     # [MOBILE] 响应式标题
│   │   ├── HotCarousel.tsx     # [MOBILE] 触摸滑动
│   │   ├── FeaturesGrid.tsx    # [MOBILE] 单列布局
│   │   └── Toaster.tsx         # [MOBILE] 底部显示
│   │
│   ├── layout.tsx              # [MOBILE] 移动端 meta 标签
│   ├── page.tsx                # 首页（需适配）
│   │
│   ├── scripts/                # 剧本相关页面
│   │   ├── page.tsx            # [MOBILE] 列表页适配
│   │   ├── [id]/               # [MOBILE] 详情页适配
│   │   ├── ScriptCardActions.tsx  # [MOBILE] 触摸优化
│   │   └── ScriptImagesCarousel.tsx  # [MOBILE] 手势支持
│   │
│   ├── upload/                 # [MOBILE] 表单优化
│   ├── leaderboard/            # [MOBILE] 表格适配
│   ├── profile/                # [MOBILE] 个人页面
│   ├── login/                  # [MOBILE] 认证页面
│   ├── register/               # [MOBILE] 注册页面
│   │
│   └── admin/                  # 管理后台
│       ├── layout.tsx          # [MOBILE] 侧边栏折叠
│       ├── scripts/            # [MOBILE] 数据表格
│       ├── users/              # [MOBILE] 用户管理
│       └── analytics/          # [MOBILE] 图表适配
│
├── public/                     # 静态资源
│   ├── manifest.json          # [NEW] PWA 清单
│   ├── sw.js                  # [NEW] Service Worker
│   ├── icons/                 # [NEW] PWA 图标集
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── maskable-icon.png
│   └── offline.html           # [NEW] 离线页面
│
├── src/
│   ├── lib/                   # 工具库
│   │   ├── pwa/               # [NEW] PWA 工具
│   │   │   ├── service-worker.ts     # Service Worker 逻辑
│   │   │   ├── push-notifications.ts # 推送通知
│   │   │   ├── offline-sync.ts       # 离线同步
│   │   │   └── cache-strategies.ts   # 缓存策略
│   │   │
│   │   └── image-optimization/  # [NEW] 图片优化
│   │       ├── generate-webp.ts
│   │       ├── generate-placeholder.ts
│   │       └── lazy-load.ts
│   │
│   └── hooks/                 # React Hooks
│       ├── useMediaQuery.ts   # [NEW] 响应式断点
│       ├── useTouchGesture.ts # [NEW] 触摸手势
│       └── useOnlineStatus.ts # [NEW] 在线状态
│
├── styles/
│   └── globals.css            # [EXTEND] 响应式工具类
│
├── tailwind.config.ts         # [EXTEND] 移动端断点
├── next.config.mjs            # [EXTEND] PWA 配置
└── package.json               # [EXTEND] 新增依赖
```

**Structure Decision**: 
- 使用现有 Next.js App Router 结构
- 组件原地改造（非破坏性修改）
- PWA 相关代码集中在 `src/lib/pwa/`
- 响应式 Hooks 放在 `src/hooks/`
- Service Worker 和 Manifest 放在 `public/`

## Phase 0: Outline & Research

### Research Tasks

#### 1. Next.js PWA 集成方案研究
**任务**: 评估 next-pwa vs 手动 Workbox 实现
**输出**: 
- **决策**: 使用 next-pwa 5.x
- **理由**: 
  - 与 Next.js 15 深度集成，自动生成 Service Worker
  - 内置缓存策略（stale-while-revalidate、network-first等）
  - 支持离线回退、预缓存、运行时缓存
  - 社区活跃，文档完善
- **替代方案**: 手动 Workbox（过于复杂，维护成本高）

#### 2. 图片优化管线研究
**任务**: WebP 生成 + 模糊占位图 (LQIP) 最佳实践
**输出**:
- **决策**: sharp (WebP) + plaiceholder (LQIP) + Next.js Image
- **理由**:
  - sharp: 高性能图片处理，支持 WebP/AVIF
  - plaiceholder: 自动生成 base64 模糊占位图
  - Next.js Image: 自动响应式尺寸、懒加载、格式协商
- **流程**: 构建时预处理 → 运行时按需优化

#### 3. 触摸手势库选择
**任务**: React 触摸手势库评估
**输出**:
- **决策**: react-use-gesture 或原生 Touch Events
- **理由**:
  - 轮播图已有 embla-carousel（支持触摸）
  - 简单手势使用原生 Touch Events（减少依赖）
  - 复杂手势（如捏合缩放）使用 react-use-gesture
- **实现**: 优先原生，必要时引入库

#### 4. 推送通知服务研究
**任务**: Web Push 实现方案
**输出**:
- **决策**: Web Push API + VAPID + 后端存储订阅
- **理由**:
  - 标准 Web Push API（iOS 16.4+ 支持）
  - VAPID 密钥认证（安全）
  - 后端需存储用户订阅信息（Prisma）
- **流程**: 前端请求权限 → 后端保存订阅 → 触发时推送

#### 5. 响应式断点策略
**任务**: Tailwind 断点与 M3 断点对齐
**输出**:
- **决策**: 使用 Tailwind 默认断点 + 自定义 `xs`
  ```js
  screens: {
    'xs': '375px',   // 小屏手机
    'sm': '640px',   // 大屏手机/小平板
    'md': '768px',   // 平板竖屏
    'lg': '1024px',  // 平板横屏/小桌面
    'xl': '1280px',  // 桌面
    '2xl': '1536px', // 大桌面
  }
  ```
- **理由**: 与 Material Design 3 断点（compact/medium/expanded）语义对齐

#### 6. 离线同步策略
**任务**: IndexedDB + Background Sync 设计
**输出**:
- **决策**: 
  - 读操作: 优先缓存，后台更新（stale-while-revalidate）
  - 写操作: 本地队列（IndexedDB）+ Background Sync
- **流程**:
  1. 用户点赞/收藏 → 立即 UI 反馈 + 存入队列
  2. 网络恢复 → Background Sync 触发 → 批量提交
  3. 提交成功 → 清空队列，提交失败 → 保留重试

#### 7. 性能监控方案
**任务**: Lighthouse CI + Real User Monitoring (RUM)
**输出**:
- **决策**: 
  - 开发阶段: Lighthouse CI（GitHub Actions）
  - 生产环境: Web Vitals API + 自定义上报
- **指标**: FCP、LCP、CLS、FID、TTFB
- **阈值**: FCP < 2s, LCP < 3s (移动端 4G)

**Output**: `research.md` 包含所有决策、理由和替代方案

## Phase 1: Design & Contracts

### 1. Component Inventory & Mobile Adaptation Strategy

**输出文件**: `component-inventory.md`

**改造分类**:

#### A. 布局组件（优先级：P0）
| 组件 | 文件路径 | 改造内容 | 复杂度 |
|------|----------|----------|--------|
| SiteHeader | app/_components/SiteHeader.tsx | 汉堡菜单（< md）、底部导航可选 | 中 |
| SiteFooter | app/_components/SiteFooter.tsx | 简化链接、单列布局 | 低 |
| AdminLayout | app/admin/layout.tsx | 侧边栏折叠、顶部导航 | 高 |

#### B. 交互组件（优先级：P0）
| 组件 | 文件路径 | 改造内容 | 复杂度 |
|------|----------|----------|--------|
| HotCarousel | app/_components/HotCarousel.tsx | 触摸滑动、隐藏箭头（< sm） | 中 |
| ScriptImagesCarousel | app/scripts/ScriptImagesCarousel.tsx | 手势支持、全屏预览 | 中 |
| ScriptCardActions | app/scripts/ScriptCardActions.tsx | 触摸目标 44x44px | 低 |

#### C. 内容组件（优先级：P1）
| 组件 | 文件路径 | 改造内容 | 复杂度 |
|------|----------|----------|--------|
| HeroSection | app/_components/HeroSection.tsx | 字号缩小、间距调整 | 低 |
| FeaturesGrid | app/_components/FeaturesGrid.tsx | 单列 (< sm)、双列 (sm-md) | 低 |
| ScriptMetaPanel | app/scripts/ScriptMetaPanel.tsx | 堆叠布局、折叠详情 | 中 |

#### D. 表单组件（优先级：P1）
| 组件 | 文件路径 | 改造内容 | 复杂度 |
|------|----------|----------|--------|
| 上传表单 | app/upload/page.tsx | 输入框 44px、键盘滚动 | 中 |
| 登录表单 | app/login/page.tsx | 移动端优化、类型正确 | 低 |
| 注册表单 | app/register/page.tsx | 同上 | 低 |

#### E. 数据展示组件（优先级：P2）
| 组件 | 文件路径 | 改造内容 | 复杂度 |
|------|----------|----------|--------|
| 剧本列表 | app/scripts/page.tsx | 单列卡片、触摸优化 | 中 |
| 排行榜 | app/leaderboard/page.tsx | 卡片视图、横向滚动表格 | 中 |
| 管理表格 | app/admin/scripts/page.tsx | 横向滚动、卡片切换 | 高 |

**总计**: ~15 个核心组件，30+ 个子组件

### 2. Responsive Breakpoints & Strategies

**输出文件**: `breakpoints.md`

**断点定义**:
```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      'xs': '375px',   // 小屏手机 (iPhone SE)
      'sm': '640px',   // 大屏手机
      'md': '768px',   // 平板竖屏
      'lg': '1024px',  // 平板横屏/小桌面
      'xl': '1280px',  // 桌面
      '2xl': '1536px', // 大桌面
    },
    extend: {
      // 触摸目标最小尺寸
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
}
```

**响应式策略**:

| 屏幕尺寸 | 布局策略 | 导航方式 | 典型断点 |
|----------|----------|----------|----------|
| < 375px (xs) | 单列，最小功能 | 汉堡菜单 | `max-w-full px-4` |
| 375-640px (sm) | 单列，完整功能 | 汉堡菜单 | `sm:px-6` |
| 640-768px (md) | 双列（可选） | 汉堡菜单 | `md:grid-cols-2` |
| 768-1024px (lg) | 侧边栏折叠 | 展开式导航 | `lg:grid-cols-3` |
| 1024px+ (xl) | 桌面完整布局 | 固定侧边栏 | `xl:max-w-7xl` |

**组件适配模式**:
```tsx
// 示例：响应式卡片网格
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
  {items.map(item => (
    <ScriptCard key={item.id} {...item} />
  ))}
</div>

// 示例：条件渲染
<nav className="lg:hidden">
  <HamburgerMenu />
</nav>
<nav className="hidden lg:block">
  <DesktopNav />
</nav>
```

### 3. PWA Architecture & Data Model

**输出文件**: `pwa-architecture.md`

#### Service Worker 架构

```typescript
// public/sw.js (生成by next-pwa)
// 缓存策略:
// 1. 静态资源 (HTML/CSS/JS): CacheFirst
// 2. API 请求: NetworkFirst (fallback to cache)
// 3. 图片: StaleWhileRevalidate
// 4. 用户操作: NetworkOnly + Background Sync

// src/lib/pwa/service-worker.ts (配置)
interface PWAConfig {
  runtimeCaching: CacheStrategy[];
  offlineFallbacks: {
    document: '/offline.html';
    image: '/offline-image.png';
  };
  backgroundSync: {
    enabled: true;
    queues: ['likes', 'favorites', 'comments'];
  };
}
```

#### 推送通知数据模型

```typescript
// Prisma Schema Extension
model PushSubscription {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  endpoint    String   @unique
  keys        String   // JSON: {p256dh, auth}
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
  data        String   // JSON
  status      String   @default('pending') // pending/sent/failed
  createdAt   DateTime @default(now())
  sentAt      DateTime?
  
  @@index([userId, status])
}
```

#### 离线同步队列

```typescript
// IndexedDB Schema
interface OfflineAction {
  id: string;
  type: 'like' | 'favorite' | 'comment';
  action: 'add' | 'remove' | 'create';
  data: {
    scriptId?: string;
    commentId?: string;
    content?: string;
  };
  timestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'failed';
}

// 同步策略
class OfflineSyncManager {
  async queueAction(action: OfflineAction): Promise<void>;
  async syncPendingActions(): Promise<SyncResult>;
  async handleSyncEvent(event: SyncEvent): Promise<void>;
}
```

#### API 契约（新增）

**POST /api/push/subscribe**
```typescript
// 订阅推送通知
Request: {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}
Response: {
  success: boolean;
  subscriptionId: string;
}
```

**POST /api/push/send**
```typescript
// 发送推送通知（管理员）
Request: {
  userId: string;
  notification: {
    title: string;
    body: string;
    icon?: string;
    data?: Record<string, any>;
  };
}
Response: {
  success: boolean;
  messageId: string;
}
```

**POST /api/offline-sync/actions**
```typescript
// 批量同步离线操作
Request: {
  actions: Array<{
    type: 'like' | 'favorite' | 'comment';
    action: 'add' | 'remove' | 'create';
    data: any;
    timestamp: number;
  }>;
}
Response: {
  success: boolean;
  results: Array<{
    index: number;
    success: boolean;
    error?: string;
  }>;
}
```

### 4. Image Optimization Pipeline

**构建时流程**:
```mermaid
图片源文件 (JPEG/PNG)
  ↓
sharp 处理
  ├─→ WebP 生成 (80% 质量)
  ├─→ 多尺寸响应式 (640/768/1024/1280/1536w)
  └─→ 模糊占位图 (10x10 base64)
  ↓
存储到 public/optimized/
  ↓
Next.js Image 组件运行时按需服务
```

**使用示例**:
```tsx
import Image from 'next/image';
import { getPlaiceholder } from 'plaiceholder';

// 构建时获取占位图
export async function getStaticProps() {
  const { base64, img } = await getPlaiceholder('/images/hero.jpg');
  return { props: { blurDataURL: base64, ...img } };
}

// 组件中使用
<Image
  src="/images/hero.jpg"
  alt="Hero"
  placeholder="blur"
  blurDataURL={blurDataURL}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  quality={85}
/>
```

### 5. Testing Strategy

**设备测试矩阵**:
| 设备 | 浏览器 | 屏幕尺寸 | 优先级 | 测试内容 |
|------|--------|----------|--------|----------|
| iPhone SE | Safari 18 | 375x667 | P0 | 最小宽度、触摸、PWA |
| iPhone 15 | Safari 18 | 390x844 | P0 | 标准尺寸、通知、手势 |
| iPad | Safari 18 | 768x1024 | P1 | 平板布局、侧边栏 |
| Samsung Galaxy S23 | Chrome 120 | 360x780 | P0 | Android PWA、通知 |
| 微信浏览器 (iOS) | WKWebView | 390x844 | P1 | 兼容性、分享 |
| 微信浏览器 (Android) | Chrome | 360x780 | P1 | 兼容性、分享 |

**性能测试**:
- Lighthouse CI（每次 PR）：移动端 + 桌面端
- WebPageTest：4G 网络模拟（6 地理位置）
- 手动测试：弱网环境（Chrome DevTools 网络节流）

**无障碍测试**:
- axe DevTools 自动扫描
- VoiceOver（iOS）手动测试
- TalkBack（Android）手动测试
- 键盘导航测试（Tab/Enter/Esc）

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
1. **Setup Tasks** (T001-T005):
   - T001: 安装 PWA 相关依赖 (next-pwa, workbox, web-push)
   - T002: 配置 Tailwind 响应式断点
   - T003: 配置 Next.js PWA (next.config.mjs)
   - T004: 创建 PWA Manifest 和图标
   - T005: 设置 Lighthouse CI

2. **基础设施 Tasks** (T006-T015) [部分可并行]:
   - T006 [P]: 创建响应式 Hooks (useMediaQuery, useTouchGesture)
   - T007 [P]: 创建图片优化脚本 (WebP, LQIP)
   - T008 [P]: Service Worker 配置
   - T009 [P]: IndexedDB 离线队列封装
   - T010 [P]: 推送通知客户端逻辑
   - T011 [P]: 添加 PushSubscription 数据模型（Prisma）
   - T012 [P]: 添加 NotificationQueue 数据模型
   - T013: 运行 Prisma migration
   - T014 [P]: 创建 /api/push/subscribe 端点
   - T015 [P]: 创建 /api/offline-sync/actions 端点

3. **布局组件 Tasks** (T016-T020):
   - T016: 移动端 SiteHeader（汉堡菜单）
   - T017: 移动端 SiteFooter（简化布局）
   - T018: 移动端 AdminLayout（侧边栏折叠）
   - T019: 全局 layout.tsx 添加 PWA meta 标签
   - T020: 创建离线页面 (public/offline.html)

4. **交互组件 Tasks** (T021-T025) [可并行]:
   - T021 [P]: HotCarousel 触摸支持
   - T022 [P]: ScriptImagesCarousel 手势优化
   - T023 [P]: ScriptCardActions 触摸目标优化
   - T024 [P]: 表单键盘自动滚动逻辑
   - T025 [P]: Toaster 移动端位置调整

5. **页面适配 Tasks** (T026-T035) [可并行]:
   - T026 [P]: 首页响应式适配
   - T027 [P]: 剧本列表页适配（单列卡片）
   - T028 [P]: 剧本详情页适配
   - T029 [P]: 上传页面表单优化
   - T030 [P]: 排行榜页面适配（卡片视图）
   - T031 [P]: 个人页面适配
   - T032 [P]: 登录/注册页面适配
   - T033 [P]: 管理后台剧本页面适配
   - T034 [P]: 管理后台用户页面适配
   - T035 [P]: 管理后台统计页面适配

6. **图片优化 Tasks** (T036-T038):
   - T036: 批量生成 WebP 图片
   - T037: 生成模糊占位图
   - T038: 更新所有 Image 组件（懒加载 + WebP）

7. **PWA 集成 Tasks** (T039-T043):
   - T039: 注册 Service Worker
   - T040: 实现离线同步逻辑
   - T041: 添加"添加到主屏幕"提示
   - T042: 推送通知权限请求 UI
   - T043: 测试 PWA 安装流程

8. **测试与优化 Tasks** (T044-T050) [可并行]:
   - T044 [P]: 真实设备测试（iPhone/Android）
   - T045 [P]: 微信浏览器兼容性测试
   - T046 [P]: Lighthouse 性能测试（移动端）
   - T047 [P]: 无障碍测试（VoiceOver/TalkBack）
   - T048 [P]: 弱网环境测试（4G/3G 模拟）
   - T049: 性能优化（根据测试结果）
   - T050: 文档更新（实施笔记、验证文档）

**Ordering Strategy**:
- Setup → 基础设施 → 布局 → 交互 → 页面 → 图片 → PWA → 测试
- 基础设施完成后，组件和页面可并行开发
- 图片优化可在组件适配期间进行
- PWA 功能在所有页面适配完成后集成
- 测试贯穿整个过程，最后集中优化

**Estimated Output**: ~50 个任务，约 25-30 小时工作量

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No Constitution violations requiring justification*

此功能完全符合项目宪法要求，无需特殊豁免。所有技术选型都基于现有架构扩展，保持 M3 设计系统一致性。

唯一的额外复杂度（PWA + 图片优化）是功能需求明确要求的，且采用成熟的开源方案（next-pwa, sharp, plaiceholder）降低实现风险。

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete
- [x] Phase 1: Design complete
- [x] Phase 2: Task planning approach documented (NOT created tasks.md)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved (via /clarify command)
- [x] Complexity deviations documented: N/A (no deviations)

**Decision Log**:
- ✅ PWA 方案: next-pwa 5.x
- ✅ 图片优化: sharp + plaiceholder + Next.js Image
- ✅ 触摸手势: 原生 Touch Events + embla-carousel
- ✅ 推送通知: Web Push API + VAPID
- ✅ 离线同步: IndexedDB + Background Sync API
- ✅ 断点策略: Tailwind 默认 + 自定义 xs (375px)
- ✅ 测试设备: iOS 18+ / Chrome 120+ / 微信最新

---

## Next Steps

✅ **规划已完成** - 可以执行下一步命令：

```bash
# 生成详细任务清单
/tasks

# 开始实施
/implement
```

**预计工作量**: 25-30 小时  
**预计完成时间**: 2-3 周（考虑测试和优化）  
**风险等级**: 中 - PWA 和图片优化增加复杂度，但有成熟方案支持

---

*Based on Constitution v2.0.0 - See `CONSTITUTION.md` | Generated: 2025-10-10*

