# 006: 审核界面 UI 闪烁修复

## 📋 问题概览

**类型**: Bug Fix + UX Improvement  
**优先级**: High  
**预估工作量**: ~2 hours  
**分支**: `006-review-ui-flicker-fix`

## 🐛 问题描述

剧本审核界面在操作（通过/拒绝）后会出现明显的白屏闪烁，影响用户体验。

**闪烁场景**:
- ❌ 点击"通过"/"拒绝"按钮后 → 白屏闪烁
- ❌ 打开详情 Modal → 内容闪现（"..." → 实际内容）
- ❌ 一键通过全部 → 页面重载闪烁

## 🎯 根本原因

### 原因 1: location.reload() 整页刷新
```typescript
// ReviewItem.tsx
if (res.ok) location.reload()  // ❌ 导致白屏
```

### 原因 2: Modal 无 Loading 状态
```typescript
// ReviewDetailModal.tsx
const [detail, setDetail] = useState<Detail | null>(null)
// 打开时 detail 为 null，显示 "..."
<div>{detail?.title || '...'}</div>  // ❌ 闪现
```

## ✅ 解决方案

### 核心修复
1. **使用 router.refresh()** 替代 location.reload()
   - 仅刷新 Server Component 数据
   - 保持客户端状态
   - 无白屏闪烁

2. **添加 Modal Loading 状态**
   - 数据加载期间显示 Loading UI
   - 平滑的状态过渡

### 修复效果对比

**修复前**:
```
点击通过 → 白屏闪烁 → 页面重载 → 列表更新
       ❌ 1-2秒   ❌ 失去状态
```

**修复后**:
```
点击通过 → 平滑更新 → 列表刷新
       ✅ <500ms  ✅ 保持状态
```

## 📁 文档结构

```
006-review-ui-flicker-fix/
├── README.md          # 本文档（问题概览）
├── spec.md            # 详细规格（原因分析、解决方案）
├── plan.md            # 实施计划（技术方案）
└── tasks.md           # 任务清单（7 个任务）
```

## 📝 任务清单

### Phase 1: 核心修复 (3 任务)
- **T001**: 修复 ReviewItem（router.refresh）
- **T002**: 修复 ReviewDetailModal（Loading 状态）
- **T003**: 修复 ReviewActions（router.refresh）

### Phase 2: 优化 (2 任务)
- **T004**: 添加操作反馈
- **T005**: 优化 Modal Loading UI

### Phase 3: 测试 (2 任务)
- **T006**: 功能测试
- **T007**: 代码质量检查

## ⏱️ 预估工作量

- **总时长**: ~2 小时
- **核心修复**: 1 hour
- **优化测试**: 1 hour

## 🚀 快速开始

需要我开始实施修复吗？输入 `/implement` 开始。

## 📚 参考

- [Next.js useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router)
- [Next.js router.refresh()](https://nextjs.org/docs/app/api-reference/functions/use-router#routerrefresh)
