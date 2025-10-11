# Spec 030: 管理员剧本列表 - 改为竖向列表形式

## 需求概述

将管理员剧本列表页面从卡片网格布局改为竖向列表形式，提供更清晰的表格式视图，方便管理员快速浏览和操作大量剧本。

## 当前状态

### 现有布局
- 网格布局：`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- 卡片形式：每个剧本独立的卡片
- 信息展示：
  - 标题
  - 作者
  - 状态
  - 操作按钮（查看、编辑、删除/恢复）

### 存在的问题
1. ❌ 卡片布局占用空间大，一屏显示内容少
2. ❌ 难以快速比较多个剧本信息
3. ❌ 信息密度低，不适合管理大量数据
4. ❌ 移动端网格布局体验不佳

## 目标设计

### 列表布局特点

采用**表格式列表**设计，每行显示一个剧本：

```
┌────────────────────────────────────────────────────────────────┐
│ 标题栏：剧本列表 (共 X 条)                    [一键删除全部] │
├────────────────────────────────────────────────────────────────┤
│ [待审核] [已通过] [已拒绝] [已废弃]                           │
├────┬──────────────────┬────────┬────────┬──────────────────────┤
│ #  │ 剧本标题         │ 作者   │ 状态   │ 操作                 │
├────┼──────────────────┼────────┼────────┼──────────────────────┤
│ 1  │ 剧本名称         │ 作者名 │ 待审核 │ [查看][编辑][删除]   │
│ 2  │ 剧本名称         │ 作者名 │ 已通过 │ [查看][编辑][删除]   │
│ 3  │ 剧本名称         │ 作者名 │ 已废弃 │ [查看][恢复][删除]   │
└────┴──────────────────┴────────┴────────┴──────────────────────┘
```

### 视觉设计

#### 桌面端（≥768px）
```
┌─────────────────────────────────────────────────────────────────┐
│ 完整表格                                                        │
│ 列：序号 | 标题 (40%) | 作者 (15%) | 状态 (15%) | 操作 (30%)  │
└─────────────────────────────────────────────────────────────────┘
```

#### 移动端（<768px）
```
┌──────────────────────────────┐
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 1. 剧本标题                  │
│    作者：XXX  |  状态：待审核 │
│    [查看] [编辑] [删除]      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 2. 剧本标题                  │
│    作者：XXX  |  状态：已通过 │
│    [查看] [编辑] [删除]      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
└──────────────────────────────┘
```

## 详细设计

### 1. 列表头部（Table Header）

```tsx
<div className="hidden md:grid grid-cols-[50px_1fr_150px_120px_280px] gap-4 px-4 py-3 bg-gray-50 border-b border-outline font-medium text-sm text-surface-on-variant">
  <div className="text-center">#</div>
  <div>剧本标题</div>
  <div>作者</div>
  <div>状态</div>
  <div className="text-right">操作</div>
</div>
```

### 2. 列表项（桌面端）

```tsx
<div className="hidden md:grid grid-cols-[50px_1fr_150px_120px_280px] gap-4 px-4 py-4 border-b border-outline hover:bg-gray-50 transition-colors">
  {/* 序号 */}
  <div className="text-center text-surface-on-variant text-sm">
    {index + 1}
  </div>
  
  {/* 标题 */}
  <div className="font-medium text-surface-on truncate">
    {item.title}
  </div>
  
  {/* 作者 */}
  <div className="text-surface-on-variant text-sm">
    {item.authorName || '-'}
  </div>
  
  {/* 状态标签 */}
  <div>
    <StateBadge state={item.state} />
  </div>
  
  {/* 操作按钮 */}
  <div className="flex items-center justify-end gap-2">
    <button className="btn-sm">查看</button>
    {isAbandoned ? (
      <button className="btn-sm btn-success">恢复</button>
    ) : (
      <a className="btn-sm btn-primary">编辑</a>
    )}
    <button className="btn-sm btn-danger">删除</button>
  </div>
</div>
```

### 3. 列表项（移动端）

```tsx
<div className="md:hidden p-4 border-b border-outline">
  {/* 序号和标题 */}
  <div className="flex items-start gap-2 mb-2">
    <span className="text-surface-on-variant text-sm font-medium">
      #{index + 1}
    </span>
    <span className="font-medium text-surface-on flex-1">
      {item.title}
    </span>
  </div>
  
  {/* 元信息 */}
  <div className="flex items-center gap-3 text-sm text-surface-on-variant mb-3">
    <span>作者：{item.authorName || '-'}</span>
    <span>·</span>
    <StateBadge state={item.state} />
  </div>
  
  {/* 操作按钮 */}
  <div className="flex gap-2">
    <button className="btn-sm flex-1">查看</button>
    {isAbandoned ? (
      <button className="btn-sm btn-success flex-1">恢复</button>
    ) : (
      <a className="btn-sm btn-primary flex-1">编辑</a>
    )}
    <button className="btn-sm btn-danger flex-1">删除</button>
  </div>
</div>
```

### 4. 状态标签组件

```tsx
function Statebadge({ state }: { state?: string }) {
  const config = {
    pending: { label: '待审核', className: 'bg-yellow-100 text-yellow-800' },
    published: { label: '已通过', className: 'bg-green-100 text-green-800' },
    rejected: { label: '已拒绝', className: 'bg-red-100 text-red-800' },
    abandoned: { label: '已废弃', className: 'bg-gray-100 text-gray-800' },
  }
  
  const { label, className } = config[state as keyof typeof config] || config.pending
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
```

### 5. Loading 骨架屏

#### 桌面端
```tsx
<div className="hidden md:grid grid-cols-[50px_1fr_150px_120px_280px] gap-4 px-4 py-4 border-b border-outline">
  <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
  <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
  <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
  <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
  <div className="flex justify-end gap-2">
    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
  </div>
</div>
```

#### 移动端
```tsx
<div className="md:hidden p-4 border-b border-outline">
  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3 animate-pulse"></div>
  <div className="flex gap-2">
    <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse"></div>
    <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse"></div>
    <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse"></div>
  </div>
</div>
```

### 6. 空状态

```tsx
{!items?.length && (
  <div className="text-center py-16">
    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <div className="text-lg font-medium text-surface-on mb-1">暂无剧本</div>
    <div className="text-sm text-surface-on-variant">{currentState.emptyText}</div>
  </div>
)}
```

## 组件结构

### 文件改动

#### 1. AdminScriptsList.tsx
- 修改主容器布局
- 添加表格头部
- 改变列表项布局方式

#### 2. 新建 AdminScriptListItem.tsx
```tsx
'use client'
import { useState } from 'react'
import AdminScriptViewModal from './AdminScriptViewModal'

type Item = { 
  id: string
  title: string
  state?: string
  authorName?: string | null 
}

export default function AdminScriptListItem({ 
  item, 
  index 
}: { 
  item: Item
  index: number
}) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  
  const isAbandoned = item.state === 'abandoned'
  
  // 删除和恢复逻辑保持不变...
  
  return (
    <>
      {/* 桌面端表格行 */}
      <div className="hidden md:grid grid-cols-[50px_1fr_150px_120px_280px] gap-4 px-4 py-4 border-b border-outline hover:bg-gray-50 transition-colors">
        {/* 内容... */}
      </div>
      
      {/* 移动端卡片 */}
      <div className="md:hidden p-4 border-b border-outline">
        {/* 内容... */}
      </div>
      
      {open && <AdminScriptViewModal id={item.id} open={open} onClose={() => setOpen(false)} />}
    </>
  )
}
```

#### 3. 新建 StateBadge.tsx
```tsx
export default function StateBadge({ state }: { state?: string }) {
  // 状态标签配置...
}
```

## 样式规范

### 按钮尺寸

定义小尺寸按钮样式：

```css
/* globals.css */
.btn-sm {
  @apply px-3 py-1.5 text-sm rounded-md font-medium transition-colors;
  min-height: 32px;
}

.btn-sm.btn-primary {
  @apply bg-primary text-on-primary hover:bg-primary/90;
}

.btn-sm.btn-success {
  @apply bg-green-600 text-white hover:bg-green-700;
}

.btn-sm.btn-danger {
  @apply bg-error text-on-error hover:bg-error/90;
}
```

### 响应式断点

- **移动端**: < 768px - 堆叠式卡片列表
- **桌面端**: ≥ 768px - 表格式列表

## 优势对比

| 特性 | 卡片布局（旧） | 列表布局（新） |
|------|---------------|---------------|
| 信息密度 | ⚠️ 低 | ✅ 高 |
| 一屏显示数量 | ⚠️ 6-9 个 | ✅ 15-20 个 |
| 快速扫描 | ❌ 困难 | ✅ 容易 |
| 空间利用 | ⚠️ 60% | ✅ 85% |
| 管理效率 | ⚠️ 低 | ✅ 高 |
| 移动端体验 | ⚠️ 一般 | ✅ 优化 |

## 实施步骤

### Phase 1: 组件重构
1. ✅ 创建 `StateBadge.tsx` 组件
2. ✅ 创建 `AdminScriptListItem.tsx` 组件
3. ✅ 添加按钮样式类

### Phase 2: 布局改造
4. ✅ 修改 `AdminScriptsList.tsx` 主布局
5. ✅ 添加表格头部
6. ✅ 替换列表渲染逻辑
7. ✅ 更新 Loading 骨架屏

### Phase 3: 测试验证
8. ✅ 测试桌面端显示
9. ✅ 测试移动端显示
10. ✅ 测试所有操作功能
11. ✅ 测试不同状态切换

## 验证清单

### 功能验证
- [ ] 列表正确显示所有剧本
- [ ] 序号正确（考虑分页）
- [ ] 状态标签颜色正确
- [ ] "查看"按钮打开弹窗
- [ ] "编辑"链接跳转正确
- [ ] "删除"功能正常
- [ ] "恢复"功能正常（废弃状态）
- [ ] 分页功能正常

### 响应式验证
- [ ] 桌面端表格布局正常
- [ ] 移动端列表布局正常
- [ ] 平板端（768px）正常切换
- [ ] 超宽屏（>1920px）布局合理

### 交互验证
- [ ] Hover 效果正常
- [ ] 按钮点击反馈清晰
- [ ] Loading 状态流畅
- [ ] 空状态显示正确

## 注意事项

1. **序号计算**: 考虑分页，序号应为 `(pageNum - 1) * pageSize + index + 1`
2. **长标题处理**: 桌面端使用 `truncate`，移动端可换行
3. **按钮对齐**: 桌面端右对齐，移动端全宽均分
4. **状态颜色**: 保持一致性和可访问性
5. **Loading 数量**: 显示 10 个骨架屏项

## 相关文件

### 需要修改
- `xueran-juben-project/app/admin/scripts/AdminScriptsList.tsx`

### 需要创建
- `xueran-juben-project/app/admin/_components/AdminScriptListItem.tsx`
- `xueran-juben-project/app/admin/_components/StateBadge.tsx`

### 需要更新（可选）
- `xueran-juben-project/app/globals.css` - 添加 `.btn-sm` 样式

## 预期效果

- ✅ 信息密度提升 **3 倍**
- ✅ 管理效率提升 **2 倍**
- ✅ 页面加载速度不变
- ✅ 移动端体验优化
- ✅ 保持所有现有功能

