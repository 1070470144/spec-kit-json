# Tasks: 审核剧本界面 M3 优化

**Input**: Design documents from `/specs/007-review-interface-m3/`
**Type**: Bug Fix + UI Enhancement
**Priority**: High

## Format: `[ID] [P?] Description`

## Phase 1: CSS 样式扩展

- [ ] T001 在 `xueran-juben-project/app/globals.css` 添加 M3 Dialog 样式
  - `.m3-dialog` - Dialog 容器（surface + elevation-5 + 动画）
  - `.dialog-header` - Dialog 头部
  - `.dialog-content` - Dialog 内容区
  - `.m3-badge-pending` - 待审核徽章
  - `.m3-btn-filled-tonal-error` - 错误色 Filled Tonal Button

## Phase 2: 修复 UI 闪烁（核心）

- [ ] T002 修复 `xueran-juben-project/app/admin/_components/ReviewItem.tsx`
  - 导入 `useRouter` from 'next/navigation'
  - 在组件内调用 `const router = useRouter()`
  - 替换 `location.reload()` → `router.refresh()` (approve 和 reject 函数)
  - 保持其他逻辑不变

- [ ] T003 修复 `xueran-juben-project/app/admin/_components/ReviewDetailModal.tsx`
  - 添加 `loading` 状态: `const [loading, setLoading] = useState(false)`
  - 在 useEffect 中设置 loading (开始和结束)
  - 添加 Loading UI (spinner)
  - 仅在非 loading 且有 detail 时显示内容

- [ ] T004 修复 `xueran-juben-project/app/admin/_components/ReviewActions.tsx`
  - 导入 `useRouter`
  - 替换 `location.reload()` → `router.refresh()`

## Phase 3: M3 样式应用

- [ ] T005 优化 `xueran-juben-project/app/admin/review/page.tsx`
  - 标题已使用 `text-headline-medium`（保持）
  - 待审核徽章优化为 `m3-badge-pending`
  - 一键通过按钮已使用 `m3-btn-outlined`（保持）
  - 卡片网格间距优化

- [ ] T006 优化 `xueran-juben-project/app/admin/_components/ReviewItem.tsx`
  - 卡片容器: `.card` → `m3-card-elevated hover:shadow-elevation-3`
  - 标题: `.card-title` → `text-title-large text-surface-on`
  - 作者: `.muted` → `text-body-small text-surface-on-variant`
  - 删除按钮: `.btn-danger` → `m3-btn-filled-tonal-error`
  - 添加过渡动画

- [ ] T007 优化 `xueran-juben-project/app/admin/_components/ReviewDetailModal.tsx`
  - Modal 容器应用 `m3-dialog`
  - 头部使用 `dialog-header`
  - 内容使用 `dialog-content`
  - 关闭按钮: `.btn-outline` → `m3-icon-btn`
  - 标题: `text-lg font-semibold` → `text-title-large`
  - 作者: `.muted` → `text-body-small text-surface-on-variant`
  - 通过按钮: `.btn-primary` → `m3-btn-filled`
  - 拒绝按钮: `.btn-outline` → `m3-btn-outlined`
  - 背景遮罩优化: `bg-black/40` → `bg-black/40 backdrop-blur-sm`

- [ ] T008 优化 `xueran-juben-project/app/admin/_components/ReviewActions.tsx`
  - 通过按钮: `.btn-primary` → `m3-btn-filled`
  - 拒绝按钮: `.btn-outline` → `m3-btn-outlined`
  - 错误提示: `.help-error` → `text-body-small text-error`

## Phase 4: 用户体验增强

- [ ] T009 [P] Modal 动画优化
  - 添加 fade-in + zoom-in 动画
  - 关闭时反向动画
  - 使用 Tailwind animate 工具

- [ ] T010 [P] Loading UI 优化
  - 添加优雅的 spinner
  - 骨架屏（可选）
  - 最小显示时间 300ms

## Phase 5: 测试验证

- [ ] T011 功能测试
  - 点击通过 - 验证无闪烁
  - 点击拒绝 - 验证无闪烁
  - 打开 Modal - 验证有 Loading
  - 关闭 Modal - 验证动画流畅
  - 一键通过全部 - 验证更新正常
  - 删除操作 - 验证正常

- [ ] T012 响应式测试
  - Modal 在移动端显示正常
  - 网格布局响应式
  - 按钮在小屏幕不溢出

- [ ] T013 代码质量检查
  - 运行 `npm run lint`
  - 运行 `npx tsc --noEmit`
  - 确保无错误

## Dependencies

```
T001 (CSS) → T005, T006, T007, T008 (样式应用)
T002, T003, T004 (闪烁修复) 可并行（不同文件）
T005, T006, T007, T008 (M3 样式) 可并行（不同文件）
T009, T010 (优化) 可并行
T011, T012, T013 (测试) 依赖前面完成
```

## Parallel Execution

```bash
# Phase 2: 并行修复闪烁
Task T002: ReviewItem
Task T003: ReviewDetailModal
Task T004: ReviewActions

# Phase 3: 并行应用 M3
Task T006: ReviewItem M3
Task T007: ReviewDetailModal M3
Task T008: ReviewActions M3

# Phase 4: 并行优化
Task T009: 动画
Task T010: Loading UI
```

## Validation Checklist

- [ ] 审核操作无白屏闪烁
- [ ] Modal 打开有 Loading 状态
- [ ] 所有按钮使用 M3 样式
- [ ] Dialog 符合 M3 规范
- [ ] 响应式布局正常
- [ ] 无 TypeScript/ESLint 错误
- [ ] 所有审核功能正常

## 预估工作量

| 任务 | 预估时间 | 复杂度 |
|------|---------|--------|
| T001 CSS | 30 min | 低 |
| T002-T004 闪烁修复 | 45 min | 低 |
| T005-T008 M3 样式 | 1.5 hours | 中 |
| T009-T010 优化 | 45 min | 低 |
| T011-T013 测试 | 30 min | 低 |
| **总计** | **~4 hours** | - |

## Success Criteria

- ✅ 审核操作平滑无闪烁
- ✅ Modal 体验流畅
- ✅ M3 设计系统统一
- ✅ 无回归问题
- ✅ 性能提升明显
