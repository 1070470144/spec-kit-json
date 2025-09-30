# Tasks: 认证页面 Material Design 3 优化

**Input**: Design documents from `/specs/004-auth-m3-redesign/`
**Prerequisites**: plan.md (required), spec.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: M3 design patterns, auth page structures
2. Load spec.md:
   → Extract: user stories, design specs
3. Generate tasks by category:
   → Pages: Login/Register/Forgot/Reset
   → Polish: Responsive/A11y/Quality
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
5. Number tasks sequentially (T001, T002...)
6. Validate completeness
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: 认证页面优化（可并行）

### 登录页
- [ ] T001 [P] 优化 `xueran-juben-project/app/login/page.tsx`
  - 标题：`text-3xl font-semibold` → `text-display-small text-surface-on`
  - 副标题：`.subtitle` → `text-body-medium text-surface-on-variant`
  - Label：`text-sm font-medium` → `text-body-medium font-medium text-surface-on`
  - 关联输入框：添加 `id` 和 `htmlFor`
  - 登录按钮：`btn btn-primary` → `m3-btn-filled`
  - 忘记密码：`btn btn-outline` → `m3-btn-outlined`
  - 去注册：`btn` → `m3-btn-text`
  - 错误提示：`.muted` → Toast 样式（`rounded-sm border px-4 py-3 text-body-small`）

### 注册页
- [ ] T002 [P] 优化 `xueran-juben-project/app/register/page.tsx`
  - 标题：`text-3xl font-semibold` → `text-display-small text-surface-on`
  - 副标题：`.subtitle` → `text-body-medium text-surface-on-variant`
  - Label：`text-sm font-medium` → `text-body-medium font-medium text-surface-on`
  - Toast：`rounded-lg text-sm` → `rounded-sm text-body-small`
  - 关闭提示：优化样式（统一警告样式）
  - 关联输入框：添加 `id` 和 `htmlFor`
  - 发送验证码：`btn btn-outline` → `m3-btn-outlined`
  - 注册按钮：`btn btn-primary` → `m3-btn-filled`
  - 去登录：`btn` → `m3-btn-text`

### 忘记密码页
- [ ] T003 [P] 优化 `xueran-juben-project/app/forgot/page.tsx`
  - 布局：`container-page section` → `auth-hero` + `glass-card`
  - 标题：`text-2xl font-semibold` → `text-headline-small text-surface-on`
  - 添加副标题（说明文字）
  - 添加 Label：`text-body-medium font-medium text-surface-on`
  - 关联输入框：添加 `id` 和 `htmlFor`
  - 发送按钮：`btn btn-primary` → `m3-btn-filled`
  - 返回登录：`btn btn-outline` → `m3-btn-text`
  - 反馈提示：`.muted` → Toast 样式

### 重置密码页
- [ ] T004 [P] 优化 `xueran-juben-project/app/reset/[token]/page.tsx`
  - 布局：`container-page section` → `auth-hero` + `glass-card`
  - 标题：`text-2xl font-semibold` → `text-headline-small text-surface-on`
  - 添加副标题（说明文字）
  - 添加 Label：`text-body-medium font-medium text-surface-on`
  - 关联输入框：添加 `id` 和 `htmlFor`
  - 重置按钮：`btn btn-primary` → `m3-btn-filled`
  - 去登录：`btn btn-outline` → `m3-btn-text`
  - 反馈提示：`.muted` → Toast 样式

## Phase 3.2: 细节优化与验证

- [ ] T005 [P] 响应式优化
  - 登录/注册页：玻璃卡片在移动端宽度适配
  - 忘记/重置页：表单宽度适配
  - 按钮组：移动端可能换行，确保间距合理
  - 测试各断点（375px, 640px, 1024px）

- [ ] T006 [P] 无障碍增强
  - 所有输入框有关联 label（id/htmlFor）
  - 所有按钮有明确的禁用状态
  - 错误提示有适当的 role
  - 键盘导航：Tab 顺序，Enter 提交
  - Focus 状态清晰可见
  - Toast 通知可识别

- [ ] T007 [P] 代码质量检查
  - 运行 `npm run lint`
  - 运行 `npx tsc --noEmit`
  - 确保无 TypeScript 错误
  - 确保无 ESLint 警告
  - 验证所有认证流程正常

- [ ] T008 [P] 视觉一致性检查
  - 对比其他页面 M3 样式
  - 验证颜色令牌使用正确
  - 验证排版系统一致
  - 验证按钮样式一致
  - 验证 Toast 样式统一

## Dependencies

```
T001, T002, T003, T004 (页面优化) 可并行
T005, T006, T007, T008 (验证) 依赖页面完成，可并行执行
```

## Parallel Execution Example

```bash
# Phase 3.1 全部并行：
Task T001: 优化登录页
Task T002: 优化注册页
Task T003: 优化忘记密码页
Task T004: 优化重置密码页

# Phase 3.2 可并行：
Task T005: 响应式优化
Task T006: 无障碍增强
Task T007: 代码质量检查
Task T008: 视觉一致性检查
```

## Validation Checklist

- [ ] 所有页面使用 M3 设计令牌
- [ ] 按钮样式符合 M3 规范
- [ ] 排版系统一致（与其他页面）
- [ ] Toast 样式统一
- [ ] 玻璃拟态效果保持
- [ ] 响应式布局无破损
- [ ] 键盘导航顺序合理
- [ ] 无 TypeScript/ESLint 错误
- [ ] 所有认证流程正常

## 实施优先级

### P0 (必须)
- T001: 登录页优化
- T002: 注册页优化
- T007: 代码质量检查

### P1 (重要)
- T003: 忘记密码页优化
- T004: 重置密码页优化
- T006: 无障碍增强
- T008: 视觉一致性

### P2 (增强)
- T005: 响应式细节优化

## 预估工作量

| 任务 | 预估时间 | 复杂度 |
|------|---------|--------|
| T001 登录页 | 1 hour | 低 |
| T002 注册页 | 1.5 hours | 中 |
| T003 忘记页 | 1 hour | 低 |
| T004 重置页 | 1 hour | 低 |
| T005 响应式 | 30 min | 低 |
| T006 无障碍 | 45 min | 中 |
| T007 质量 | 30 min | 低 |
| T008 视觉 | 30 min | 低 |
| **总计** | **~6.5 hours** | - |

## 风险与注意事项

1. **玻璃拟态保持**: 确保 M3 样式不破坏玻璃效果
   - 缓解：仅修改内部元素，保持容器样式

2. **Toast 位置**: 注册页 Toast 在顶部，需保持
   - 缓解：保持现有位置，仅优化样式

3. **验证逻辑**: 不要修改现有验证逻辑
   - 缓解：仅修改视觉呈现

4. **认证流程**: 确保登录/注册/重置流程不受影响
   - 缓解：充分测试所有认证流程

## Next Steps (Post-Implementation)

1. 用户测试（内部）
2. 邮箱验证页优化（/verify/[token]）
3. 管理员登录页优化（/admin/login）
4. 深色主题支持（全站）

## 成功标准

- ✅ 所有任务完成并通过验证
- ✅ M3 设计系统一致应用
- ✅ 玻璃拟态特色保持
- ✅ WCAG 2.1 AA 合规
- ✅ 无回归错误（认证流程正常）
- ✅ 视觉风格与其他页面一致
- ✅ 代码审查通过（遵循宪法规范）
