# Spec: 管理员剧本列表状态筛选增强

**ID**: 008-admin-scripts-filter  
**Created**: 2025-09-30  
**Status**: Draft  
**Priority**: High

## 目标

在管理员剧本列表页面增加完整的状态筛选功能，支持筛选待审核、已通过、已拒绝、已废弃等所有状态的剧本，提升管理效率。

## 背景

当前管理员剧本列表（`/admin/scripts`）只有两个筛选选项：
- ✅ 已发布（默认）
- ✅ 已废弃

**缺少的状态**:
- ❌ 待审核 (pending)
- ❌ 已拒绝 (rejected)

从数据库 schema 和审核流程来看，剧本的状态流转：
```
pending (待审核) → published (已发布) / rejected (已拒绝)
                → abandoned (已废弃，管理员手动标记)
```

## 范围

### 包含
- ✅ 添加"待审核"筛选
- ✅ 添加"已拒绝"筛选
- ✅ 优化筛选按钮组（M3 Segmented Button）
- ✅ 显示当前筛选状态的统计
- ✅ 空状态提示优化

### 不包含
- ❌ 高级筛选（作者、标签等）
- ❌ 搜索功能
- ❌ 批量操作

## 用户故事

### US-1: 查看待审核剧本
**作为** 管理员  
**我想要** 查看所有待审核的剧本  
**以便于** 进行审核工作

**验收标准**:
- 点击"待审核"筛选显示 pending 状态剧本
- 显示待审核数量
- 空状态有友好提示

### US-2: 查看已拒绝剧本
**作为** 管理员  
**我想要** 查看所有已拒绝的剧本  
**以便于** 了解拒绝原因和复核

**验收标准**:
- 点击"已拒绝"筛选显示 rejected 状态剧本
- 显示拒绝数量
- 可查看拒绝理由

### US-3: 状态切换
**作为** 管理员  
**我想要** 快速切换不同状态  
**以便于** 高效管理剧本

**验收标准**:
- 筛选按钮使用 M3 Segmented Button
- 当前选中状态有明显标识
- 切换流畅无闪烁

## 设计规范

### 状态筛选按钮组

#### 布局
```
┌─────────┬─────────┬─────────┬─────────┐
│ 待审核  │ 已通过  │ 已拒绝  │ 已废弃  │
│ pending │published│rejected │abandoned│
└─────────┴─────────┴─────────┴─────────┘
```

#### M3 Segmented Button 样式
```tsx
<div className="inline-flex rounded-sm border border-outline overflow-hidden">
  <a className="m3-segmented-btn m3-segmented-btn-active">
    待审核 <span className="badge">5</span>
  </a>
  <a className="m3-segmented-btn">
    已通过
  </a>
  <a className="m3-segmented-btn">
    已拒绝
  </a>
  <a className="m3-segmented-btn">
    已废弃
  </a>
</div>
```

#### 状态徽章（可选）
- 在每个按钮上显示数量
- 样式：`rounded-full px-1.5 py-0.5 text-xs ml-1`
- 颜色：根据状态区分

### 状态映射

| 状态 | 值 | 显示文本 | 颜色主题 |
|------|------|----------|----------|
| 待审核 | pending | 待审核 | primary (蓝色) |
| 已通过 | published | 已通过 | success (绿色) |
| 已拒绝 | rejected | 已拒绝 | error (红色) |
| 已废弃 | abandoned | 已废弃 | tertiary (灰色) |

### 空状态提示

根据当前筛选状态显示不同提示：
- **待审核**: "暂无待审核的剧本"
- **已通过**: "还没有已发布的剧本"
- **已拒绝**: "没有已拒绝的剧本"
- **已废弃**: "没有已废弃的剧本"

## 技术实现

### URL 参数设计

```
/admin/scripts                    → 待审核（pending）
/admin/scripts?state=published    → 已通过
/admin/scripts?state=rejected     → 已拒绝
/admin/scripts?state=abandoned    → 已废弃
```

**注意**: 默认状态从"已发布"改为"待审核"（管理员最关心的）

### 组件修改

#### AdminScriptsPage
```typescript
// 默认显示待审核
const state = sp?.state || 'pending'

// 状态配置
const states = [
  { value: 'pending', label: '待审核', color: 'blue' },
  { value: 'published', label: '已通过', color: 'green' },
  { value: 'rejected', label: '已拒绝', color: 'red' },
  { value: 'abandoned', label: '已废弃', color: 'gray' },
]

// 渲染筛选按钮
{states.map(s => (
  <a 
    key={s.value}
    className={`m3-segmented-btn ${state === s.value ? 'm3-segmented-btn-active' : ''}`}
    href={`/admin/scripts?state=${s.value}`}
  >
    {s.label}
  </a>
))}
```

### 状态统计（可选增强）

如果需要显示每个状态的数量：

```typescript
// 预取各状态的数量
const counts = await prisma.script.groupBy({
  by: ['state'],
  _count: { id: true }
})

// 在按钮上显示
{s.label} 
{counts[s.value] && (
  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
    {counts[s.value]}
  </span>
)}
```

## API 依赖

- `GET /api/scripts?state={state}` - 已支持，无需修改

## 性能要求

- 状态切换响应 < 500ms
- 使用 Server Component（SSR）
- 分页保持正常

## 无障碍要求

- 筛选组有 `role="group"` 和 `aria-label="状态筛选"`
- 当前选中状态有 `aria-current="page"`
- 键盘可导航（Tab 切换）

## 成功标准

- ✅ 支持 4 种状态筛选
- ✅ 默认显示待审核
- ✅ 筛选按钮使用 M3 Segmented Button
- ✅ 空状态提示友好
- ✅ URL 参数正确
- ✅ 分页跳转保持筛选状态

## 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 默认状态改变影响用户习惯 | 中 | 低 | 文档说明，可配置 |
| 状态值不统一 | 高 | 低 | 验证数据库实际值 |

## 未来增强

- 状态数量徽章
- 组合筛选（状态 + 作者）
- 搜索功能
- 导出功能

## 参考

- [Material Design 3 - Segmented Button](https://m3.material.io/components/segmented-buttons)
- [规格 003 - 核心页面 M3](../003-pages-m3-redesign/)
- [规格 007 - 审核界面 M3](../007-review-interface-m3/)
