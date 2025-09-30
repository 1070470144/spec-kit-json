# 007: 审核剧本界面 Material Design 3 优化

## 📋 规格概览

优化管理员审核剧本界面，修复 UI 闪烁问题并应用 Material Design 3 设计系统。

**状态**: Draft → Ready for Implementation  
**优先级**: High  
**预估工作量**: ~4 hours  
**分支**: `007-review-interface-m3`

## 🐛 问题描述

### 主要问题
1. **UI 闪烁**: 点击通过/拒绝后整页刷新，白屏闪烁
2. **Modal 闪现**: 打开详情时内容从 "..." 突变为实际内容
3. **样式不统一**: 未遵循 M3 设计规范

### 影响
- ❌ 用户体验差（白屏等待）
- ❌ 审核效率低
- ❌ 视觉不一致

## 🎯 目标

1. ✅ 修复 UI 闪烁（router.refresh 替代 location.reload）
2. ✅ 添加 Modal Loading 状态
3. ✅ 应用 M3 设计系统
4. ✅ 优化审核操作体验

## 📁 文档结构

```
007-review-interface-m3/
├── README.md          # 本文档（概览）
├── spec.md            # 详细规格（问题分析、解决方案）
├── plan.md            # 实施计划（技术方案）
└── tasks.md           # 任务清单（13 个任务）
```

## 🎨 设计要点

### 审核列表
- **卡片**: M3 Elevated Card (hover 提升阴影)
- **标题**: Title Large (22px)
- **徽章**: M3 Badge (primary-container)
- **删除**: Filled Tonal Button (error)

### 详情 Modal (M3 Dialog)
- **容器**: Surface + elevation-5 + rounded-xl (28px)
- **背景**: Scrim (black/40 + backdrop-blur)
- **头部**: Title Large + Icon Button
- **按钮**: Filled (通过) + Outlined (拒绝)
- **动画**: fade-in + zoom-in

### 操作流程优化
```
Before:
点击通过 → 白屏闪烁 → 整页重载 → 更新
       ❌ 1-2s

After:
点击通过 → 平滑更新 → 列表刷新
       ✅ <500ms
```

## 🛠️ 技术方案

### 核心修复
```typescript
// 修复前
if (res.ok) location.reload()  // ❌ 白屏

// 修复后
import { useRouter } from 'next/navigation'
const router = useRouter()
if (res.ok) router.refresh()  // ✅ 平滑
```

### Modal Loading
```typescript
const [loading, setLoading] = useState(false)

useEffect(() => {
  setLoading(true)
  fetch(...)
    .then(data => setDetail(data))
    .finally(() => setLoading(false))
}, [open])

{loading && <Spinner />}
{!loading && detail && <Content />}
```

## 📝 任务清单

### Phase 1: CSS (T001)
- 添加 M3 Dialog 样式

### Phase 2: 修复闪烁 (T002-T004) [可并行]
- ReviewItem
- ReviewDetailModal  
- ReviewActions

### Phase 3: M3 样式 (T005-T008) [可并行]
- 审核页面
- ReviewItem
- ReviewDetailModal
- ReviewActions

### Phase 4: 优化 (T009-T010) [可并行]
- Modal 动画
- Loading UI

### Phase 5: 测试 (T011-T013)
- 功能测试
- 响应式测试
- 代码质量

## ⏱️ 预估工作量

- **总时长**: ~4 小时
- **核心修复**: 1.5h
- **M3 样式**: 1.5h
- **优化测试**: 1h

## ✅ 验收标准

### Bug 修复
- [ ] 审核操作无白屏闪烁
- [ ] Modal 有 Loading 状态
- [ ] 滚动位置保持

### 设计规范
- [ ] Modal 符合 M3 Dialog
- [ ] 卡片使用 M3 Elevated Card
- [ ] 按钮使用 M3 样式
- [ ] 排版系统一致

### 功能完整
- [ ] 通过审核正常
- [ ] 拒绝审核正常
- [ ] 删除操作正常
- [ ] 一键通过正常

## 🚀 快速开始

```bash
# 开始实施
# 输入 /implement
```

## 📚 参考

- [M3 Dialogs](https://m3.material.io/components/dialogs)
- [Next.js router.refresh](https://nextjs.org/docs/app/api-reference/functions/use-router#routerrefresh)
- [规格 006 - UI 闪烁修复](../006-review-ui-flicker-fix/)
