# Tasks: 审核界面 UI 闪烁修复

**Input**: Design documents from `/specs/006-review-ui-flicker-fix/`
**Type**: Bug Fix
**Priority**: High

## Format: `[ID] [P?] Description`

## Phase 1: 核心修复

- [ ] T001 修复 `xueran-juben-project/app/admin/_components/ReviewItem.tsx`
  - 导入 `useRouter` from 'next/navigation'
  - 在组件内调用 `const router = useRouter()`
  - 替换 `location.reload()` → `router.refresh()` (第11行和第16行)
  - 保持其他逻辑不变

- [ ] T002 修复 `xueran-juben-project/app/admin/_components/ReviewDetailModal.tsx`
  - 添加 `loading` 状态: `const [loading, setLoading] = useState(false)`
  - 在 useEffect 中设置 loading 状态
  - 在数据加载期间显示 Loading UI
  - 优化 detail 初始化

- [ ] T003 修复 `xueran-juben-project/app/admin/_components/ReviewActions.tsx`
  - 导入 `useRouter`
  - 替换 `location.reload()` → `router.refresh()`

## Phase 2: 用户体验优化

- [ ] T004 [P] 添加操作反馈
  - ReviewItem: 添加成功/失败 toast（可选）
  - ReviewActions: 优化错误提示

- [ ] T005 [P] 优化 Modal Loading UI
  - 添加骨架屏（可选）
  - 优化加载动画

## Phase 3: 测试验证

- [ ] T006 功能测试
  - 测试通过审核（无闪烁）
  - 测试拒绝审核（无闪烁）
  - 测试打开 Modal（有 Loading）
  - 测试一键通过全部
  - 验证滚动位置保持

- [ ] T007 代码质量检查
  - 运行 `npm run lint`
  - 运行 `npx tsc --noEmit`
  - 确保无错误

## Dependencies

```
T001, T002, T003 可并行（不同文件）
T004, T005 依赖 T001-T003
T006, T007 依赖所有前置任务
```

## Validation Checklist

- [ ] 审核操作无白屏闪烁
- [ ] Modal 数据加载有 Loading 状态
- [ ] 保持滚动位置
- [ ] 保持客户端状态
- [ ] 无 TypeScript/ESLint 错误
- [ ] 所有审核功能正常

## 预估工作量

| 任务 | 预估时间 | 复杂度 |
|------|---------|--------|
| T001 ReviewItem | 15 min | 低 |
| T002 Modal | 30 min | 中 |
| T003 Actions | 15 min | 低 |
| T004 反馈 | 15 min | 低 |
| T005 Loading UI | 15 min | 低 |
| T006 测试 | 20 min | 低 |
| T007 质量 | 10 min | 低 |
| **总计** | **~2 hours** | - |
