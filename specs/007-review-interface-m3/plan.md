# Implementation Plan: 审核剧本界面 M3 优化

**Branch**: `[007-review-interface-m3]` | **Date**: 2025-09-30 | **Spec**: specs/007-review-interface-m3/spec.md

## Summary
按照 Material Design 3 规范优化管理员审核剧本界面，包括待审核列表、详情 Modal 和审核操作。同时修复 UI 闪烁问题（使用 router.refresh 替代 location.reload），提升审核效率和体验。

## Technical Context
- Language: TypeScript (Node.js 20+)
- Framework: Next.js (App Router, Server + Client Components)
- UI: React + Tailwind CSS + Material 3
- Issue: location.reload() 导致白屏闪烁
- Solution: router.refresh() + Loading 状态 + M3 样式

## UI Design (Material 3 Implementation)

### 审核页面主体

#### 页面标题区
- 标题: `text-headline-medium` (28px)
- 说明: `text-body-small text-surface-on-variant`
- 待审核徽章: M3 Badge (`bg-primary-container text-primary-on-container`)

#### 待审核卡片
- 容器: `m3-card-elevated hover:shadow-elevation-3`
- 标题: `text-title-large`
- 作者: `text-body-small text-surface-on-variant`
- 删除按钮: M3 Filled Tonal Button (error)
- Hover: 阴影提升

### 详情 Modal (M3 Dialog)

#### 结构
```
Dialog Container (m3-dialog)
├── Header (dialog-header)
│   ├── 标题 (text-title-large)
│   └── 关闭按钮 (m3-icon-btn)
├── Content (dialog-content, grid 2列)
│   ├── 左列
│   │   ├── 剧本标题 (text-title-medium)
│   │   ├── 作者 (text-body-small)
│   │   └── 图片网格 (grid-cols-2)
│   └── 右列
│       ├── JSON 代码块
│       ├── 拒绝理由输入 (M3 Text Field)
│       └── 操作按钮 (Filled + Outlined)
└── Scrim (bg-black/40)
```

#### 样式规范
- 背景遮罩: `bg-black/40 backdrop-blur-sm`
- Dialog 容器: `bg-surface rounded-xl shadow-elevation-5`
- 最大宽度: `max-w-4xl`
- 内容高度: `max-h-[70vh] overflow-auto`
- 动画: `animate-in fade-in zoom-in-95 duration-standard`

### 按钮样式

| 按钮 | M3 类型 | 样式类 |
|------|---------|--------|
| 通过 | Filled Button | `m3-btn-filled` |
| 拒绝 | Outlined Button | `m3-btn-outlined` |
| 删除 | Filled Tonal (Error) | `m3-btn-filled-tonal-error` |
| 关闭 | Icon Button | `m3-icon-btn` |
| 一键通过 | Outlined Button | `m3-btn-outlined` |

### 输入框样式

- 拒绝理由: `textarea` + M3 增强
- Placeholder: `text-surface-on-variant`
- Focus: `ring-2 ring-primary`

## Constitution Check

### ✅ Material 3 统一
- Modal 使用 M3 Dialog 规范
- 卡片使用 M3 Elevated Card
- 按钮使用 M3 样式（Filled/Outlined/Icon）
- 排版遵循 M3 类型系统

### ✅ 性能优化
- 使用 router.refresh() 避免整页刷新
- 添加 Loading 状态避免内容闪现
- 减少不必要的重渲染

### ✅ 用户体验
- 消除白屏闪烁
- 平滑的状态过渡
- 即时的操作反馈
- 清晰的 Loading 指示

### ✅ 无障碍
- Dialog 有正确的 ARIA 属性
- 键盘可操作（Esc 关闭）
- Focus trap
- 按钮有明确的禁用状态

评估：符合宪法要求，可执行。

## Project Structure

```
xueran-juben-project/
├── app/
│   └── admin/
│       ├── review/
│       │   └── page.tsx              # 需优化（M3 样式）
│       └── _components/
│           ├── ReviewItem.tsx        # 需修复（闪烁 + M3）
│           ├── ReviewDetailModal.tsx # 需修复（闪烁 + M3）
│           └── ReviewActions.tsx     # 需修复（闪烁 + M3）
├── app/globals.css                   # 需添加 Dialog 样式
└── specs/007-review-interface-m3/
```

## Implementation Steps

### Phase 1: CSS 扩展
- 添加 `.m3-dialog` 样式
- 添加 `.dialog-header` 和 `.dialog-content`
- 添加 `.m3-badge-pending`
- 添加 `.m3-btn-filled-tonal-error`

### Phase 2: 修复闪烁
- ReviewItem: router.refresh()
- ReviewDetailModal: Loading 状态
- ReviewActions: router.refresh()

### Phase 3: M3 样式应用
- 审核页面: M3 排版和按钮
- 待审核卡片: M3 Elevated Card
- Modal: M3 Dialog
- 操作按钮: M3 Filled/Outlined

### Phase 4: 动画优化
- Modal 打开/关闭动画
- 卡片 hover 动画
- Loading spinner

## Complexity Tracking
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 无复杂性偏离 | - | - |

## Progress Tracking
**Phase Status**:
- [x] Phase 0: Problem Analysis
- [x] Phase 1: Design Complete
- [ ] Phase 2: Tasks Generated
- [ ] Phase 3: Implementation Complete
- [ ] Phase 4: Testing Complete

**Gate Status**:
- [x] Constitution Check: PASS
- [ ] Implementation Complete
- [ ] No Regression
