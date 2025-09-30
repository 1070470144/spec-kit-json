# Spec: 审核剧本界面 Material Design 3 优化

**ID**: 007-review-interface-m3  
**Created**: 2025-09-30  
**Status**: Draft  
**Priority**: High

## 目标

按照 CONSTITUTION.md 中的 Material Design 3 规范，优化管理员审核剧本界面的视觉设计与交互体验，同时修复 UI 闪烁问题（合并规格 006）。

## 背景

从截图可以看到当前审核界面包含：
1. 待审核剧本列表（卡片式）
2. 剧本详情 Modal（查看 JSON、图片）
3. 审核操作（通过/拒绝 + 理由输入）
4. 批量操作（一键通过全部）

**存在问题**:
- ❌ UI 闪烁（location.reload() 导致）
- ❌ Modal 样式不符合 M3 规范
- ❌ 按钮样式不统一
- ❌ 缺少 Loading 状态
- ❌ 视觉层次不够清晰

## 范围

### 包含
- ✅ 审核页面布局优化（/admin/review）
- ✅ 待审核列表卡片（M3 样式）
- ✅ 详情 Modal（M3 Dialog）
- ✅ 审核操作按钮（M3 按钮）
- ✅ 修复 UI 闪烁（router.refresh）
- ✅ 添加 Loading 状态
- ✅ 拒绝理由输入（M3 Text Field）

### 不包含
- ❌ 其他管理页面（单独规格）
- ❌ 审核历史记录（下一阶段）
- ❌ 批量审核优化（下一阶段）

## 用户故事

### US-1: 审核剧本
**作为** 管理员  
**我想要** 在清晰的界面中审核剧本  
**以便于** 高效地完成审核工作

**验收标准**:
- 待审核列表使用 M3 卡片样式
- 点击卡片打开详情 Modal
- Modal 使用 M3 Dialog 样式
- 通过/拒绝按钮使用 M3 样式
- 操作后无白屏闪烁
- 有明确的操作反馈

### US-2: 查看剧本详情
**作为** 管理员  
**我想要** 查看剧本的完整信息  
**以便于** 做出审核决策

**验收标准**:
- Modal 打开有平滑动画
- 图片清晰展示
- JSON 代码高亮或格式化
- 有 Loading 状态
- 关闭 Modal 平滑

### US-3: 批量审核
**作为** 管理员  
**我想要** 快速通过多个剧本  
**以便于** 提高审核效率

**验收标准**:
- 一键通过按钮醒目
- 操作有确认提示
- 有进度反馈
- 操作后平滑更新

## 设计规范

### 页面布局

```
审核页面 (admin/review/page.tsx)
├── 页面标题区
│   ├── 标题 (Headline Medium)
│   ├── 说明 (Body Small)
│   └── 待审核徽章 (Badge)
├── 一键通过按钮（Outlined Button）
└── 待审核列表（Grid）
    └── 剧本卡片 × N (Elevated Card)
```

### Modal 设计 (M3 Dialog)

```
剧本详情 Modal
├── 头部 (Title Large + 关闭按钮)
├── 内容区 (Grid 2列)
│   ├── 左列: 标题 + 作者 + 图片
│   └── 右列: JSON + 拒绝理由 + 操作按钮
└── 背景遮罩 (Scrim)
```

#### Dialog 规范
- **容器**: M3 Surface, rounded-xl (28px)
- **背景**: bg-black/40（Scrim）
- **阴影**: elevation-5
- **宽度**: max-w-4xl
- **动画**: fade + scale (duration-standard)

### 颜色系统

```css
/* 页面元素 */
页面背景: surface
卡片: surface + elevation-2
标题: surface-on
待审核徽章: primary-container + primary-on-container

/* Modal */
Dialog: surface + elevation-5
Scrim: black/40
关闭按钮: Icon Button

/* 按钮 */
通过: primary (Filled Button)
拒绝: outline (Outlined Button)
删除: error (Filled Tonal Button)
关闭: Text Button
```

### 组件样式

#### 待审核卡片
```tsx
<div className="m3-card-elevated cursor-pointer hover:shadow-elevation-3 transition-shadow">
  <div className="p-4">
    <h3 className="text-title-large mb-1">{title}</h3>
    <p className="text-body-small text-surface-on-variant">作者：{author}</p>
  </div>
  <div className="border-t border-outline-variant p-4">
    <button className="btn-danger">删除</button>
  </div>
</div>
```

#### 详情 Modal (M3 Dialog)
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
  <div className="m3-dialog w-full max-w-4xl">
    <div className="dialog-header">
      <h2 className="text-title-large">剧本详情</h2>
      <button className="m3-icon-btn" onClick={onClose}>×</button>
    </div>
    <div className="dialog-content">
      {/* 内容 */}
    </div>
  </div>
</div>
```

#### 操作按钮
```tsx
<div className="flex gap-3">
  <button className="m3-btn-filled">通过</button>
  <button className="m3-btn-outlined">拒绝</button>
</div>
```

## 技术实现

### 修复 UI 闪烁

#### ReviewItem.tsx
```typescript
'use client'
import { useRouter } from 'next/navigation'

export default function ReviewItem({ id, title, author }) {
  const router = useRouter()
  
  async function approve() {
    const res = await fetch(`/api/scripts/${id}/review`, ...)
    if (res.ok) {
      router.refresh()  // ✅ 替代 location.reload()
    }
  }
}
```

#### ReviewDetailModal.tsx
```typescript
const [loading, setLoading] = useState(false)
const [detail, setDetail] = useState<Detail | null>(null)

useEffect(() => {
  if (!open) return
  setLoading(true)
  setDetail(null)
  
  async function load() {
    try {
      const res = await fetch(`/api/scripts/${id}`, ...)
      if (!aborted) setDetail(data)
    } finally {
      if (!aborted) setLoading(false)
    }
  }
  load()
}, [id, open])

// 渲染 Loading
{loading && (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
)}
```

### M3 样式应用

#### globals.css 新增
```css
/* M3 Dialog */
.m3-dialog {
  @apply bg-surface rounded-xl shadow-elevation-5;
  @apply animate-in fade-in zoom-in-95 duration-standard;
}

.dialog-header {
  @apply px-6 py-4 border-b border-outline-variant;
  @apply flex items-center justify-between;
}

.dialog-content {
  @apply p-6 max-h-[70vh] overflow-auto;
}

/* M3 Badge (待审核) */
.m3-badge-pending {
  @apply inline-flex items-center gap-2 px-3 py-1.5 rounded-full;
  @apply bg-primary-container text-primary-on-container;
}

/* Filled Tonal Button (删除) */
.m3-btn-filled-tonal-error {
  @apply inline-flex items-center justify-center rounded-sm px-4 py-2 text-label-large;
  @apply bg-error-container text-error-on-container hover:shadow-elevation-1;
  @apply transition-all duration-standard;
}
```

## 性能要求

- Modal 打开动画流畅（60fps）
- 数据加载 < 500ms
- 审核操作响应 < 300ms
- 列表刷新无白屏

## 无障碍要求

- Modal 有 `role="dialog"` 和 `aria-modal="true"`
- 关闭按钮有 `aria-label="关闭"`
- 通过/拒绝按钮有明确文本
- 键盘可操作（Esc 关闭 Modal）
- Focus trap（Modal 打开时焦点限制在 Modal 内）

## 成功指标

- ✅ 审核操作无白屏闪烁
- ✅ Modal 打开平滑流畅
- ✅ 所有组件遵循 M3 设计系统
- ✅ Loading 状态明确
- ✅ 操作反馈即时
- ✅ 响应式布局正常

## 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| router.refresh() 不刷新 | 高 | 低 | 测试验证，添加回退 |
| Modal 动画卡顿 | 中 | 低 | 使用 CSS 动画，避免 JS |
| Loading 状态闪现 | 低 | 中 | 添加最小显示时间 |

## 参考

- [Material Design 3 - Dialogs](https://m3.material.io/components/dialogs)
- [Material Design 3 - Badges](https://m3.material.io/components/badges)
- [Next.js useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router)
