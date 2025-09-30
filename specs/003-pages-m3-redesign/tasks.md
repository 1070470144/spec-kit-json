# Tasks: 核心页面 Material Design 3 优化

**Input**: Design documents from `/specs/003-pages-m3-redesign/`
**Prerequisites**: plan.md (required), spec.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: M3 design patterns, page structures
2. Load spec.md:
   → Extract: user stories, design specs
3. Generate tasks by category:
   → Setup: CSS extensions
   → Pages: Scripts/Leaderboard/Upload
   → Components: Actions/Carousel
   → Polish: Responsive/A11y/Performance
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
5. Number tasks sequentially (T001, T002...)
6. Validate completeness
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Styles

- [ ] T001 在 `xueran-juben-project/app/globals.css` 中添加 M3 组件类
  - `.m3-segmented-btn` 和 `.m3-segmented-btn-active` (分段按钮)
  - `.m3-rank-badge` (排名徽章)
  - 优化 `.input` 的 M3 样式（保持兼容性）

## Phase 3.2: 剧本列表页优化

- [ ] T002 优化 `xueran-juben-project/app/scripts/page.tsx`
  - 搜索栏应用 M3 Text Field 样式
  - 搜索按钮使用 `m3-btn-filled`
  - 清除按钮使用 M3 Text Button 样式
  - 卡片容器应用 `m3-card-elevated`
  - 分页按钮应用 M3 Outlined Button 样式
  - 优化响应式网格（grid-cols-1 md:grid-cols-2 lg:grid-cols-3）

- [ ] T003 [P] 优化 `xueran-juben-project/app/scripts/ScriptCardActions.tsx`
  - 点赞/收藏按钮应用 M3 Icon Button 样式
  - 统计数字使用 `text-body-small`
  - 优化 hover/active 状态
  - 添加适当的 transition

## Phase 3.3: 排行榜页优化

- [ ] T004 优化 `xueran-juben-project/app/leaderboard/page.tsx`
  - 页面标题使用 `text-headline-small`
  - 切换按钮组应用 `m3-segmented-btn` 样式
  - 活跃按钮应用 `m3-segmented-btn-active`
  - 排名徽章应用 `m3-rank-badge` + M3 颜色
  - Top 1/2/3 使用不同的背景色和阴影
  - 列表项优化 hover 状态
  - 统计徽章应用 M3 样式

## Phase 3.4: 上传页优化

- [ ] T005 优化 `xueran-juben-project/app/upload/page.tsx`
  - 页面标题使用 `text-headline-small`
  - 副标题使用 `text-body-medium text-surface-on-variant`
  - 所有输入框应用 M3 Text Field 样式
  - 文件选择按钮使用 M3 Outlined Button 样式
  - 图片预览卡片应用 `m3-card-elevated`
  - 提交按钮使用 `m3-btn-filled`
  - 返回按钮使用 M3 Text Button 样式
  - Toast 通知优化样式（M3 Snackbar 风格）

## Phase 3.5: 响应式与细节

- [ ] T006 [P] 响应式优化
  - 剧本列表：mobile 单列，tablet 2列，desktop 3列
  - 排行榜：mobile 精简显示，desktop 完整信息
  - 上传页：mobile 垂直布局，desktop 水平布局
  - 测试各断点（375px, 768px, 1024px, 1440px）

- [ ] T007 [P] 无障碍增强
  - 搜索框添加 `aria-label="搜索剧本"`
  - 分页按钮添加 `aria-disabled` 状态
  - 文件输入关联 label（id/for）
  - 排名徽章确保有文本内容
  - 所有 Icon Button 添加 `aria-label`
  - 键盘导航测试（Tab 顺序）

## Phase 3.6: 性能与验证

- [ ] T008 [P] 性能验证
  - 确保 SSR 正常（剧本列表/排行榜）
  - 客户端组件最小化（仅轮播、操作按钮）
  - 检查 bundle 大小无显著增长
  - 卡片轮播流畅度测试（≥ 60fps）

- [ ] T009 [P] 代码质量检查
  - 运行 `npm run lint`
  - 运行 `npx tsc --noEmit`
  - 确保无 TypeScript 错误
  - 确保无 ESLint 警告

- [ ] T010 [P] 视觉一致性检查
  - 对比首页 M3 样式
  - 验证颜色令牌使用正确
  - 验证排版系统一致
  - 验证圆角和阴影一致

## Dependencies

```
T001 (CSS) → T002, T003, T004, T005 (页面需要新样式类)
T002, T003, T004, T005 (页面优化) → T006, T007, T008 (测试验证)
```

## Parallel Execution Example

```bash
# Phase 3.2-3.4 部分并行：
Task T002: 优化剧本列表页
Task T003: 优化 ScriptCardActions (不同文件)
Task T004: 优化排行榜页 (不同文件)
Task T005: 优化上传页 (不同文件)

# Phase 3.5-3.6 可并行：
Task T006: 响应式优化
Task T007: 无障碍增强
Task T008: 性能验证
Task T009: 代码质量检查
Task T010: 视觉一致性检查
```

## Validation Checklist

- [ ] 所有页面使用 M3 设计令牌
- [ ] 卡片、按钮、输入框符合 M3 规范
- [ ] 排版系统一致（与首页）
- [ ] 颜色对比度 ≥ 4.5:1
- [ ] 响应式布局无破损
- [ ] 键盘导航顺序合理
- [ ] SSR 性能无退化
- [ ] 无 TypeScript/ESLint 错误
- [ ] 所有现有功能正常

## 实施优先级

### P0 (必须)
- T001: CSS 样式扩展
- T002: 剧本列表页优化
- T005: 上传页优化
- T009: 代码质量检查

### P1 (重要)
- T003: ScriptCardActions 优化
- T004: 排行榜页优化
- T007: 无障碍增强
- T010: 视觉一致性

### P2 (增强)
- T006: 响应式细节优化
- T008: 性能深度测试

## 预估工作量

| 任务 | 预估时间 | 复杂度 |
|------|---------|--------|
| T001 CSS | 30 min | 低 |
| T002 剧本列表 | 2 hours | 中 |
| T003 Actions | 1 hour | 低 |
| T004 排行榜 | 1.5 hours | 中 |
| T005 上传页 | 1.5 hours | 中 |
| T006 响应式 | 1 hour | 低 |
| T007 无障碍 | 1 hour | 中 |
| T008 性能 | 30 min | 低 |
| T009 质量 | 30 min | 低 |
| T010 视觉 | 30 min | 低 |
| **总计** | **~10 hours** | - |

## 风险与注意事项

1. **卡片样式冲突**: 现有 `.card` 类可能与 M3 样式冲突
   - 缓解：优先使用 `m3-card-elevated`，保持 `.card` 作为回退

2. **分段按钮布局**: 首尾圆角需要特殊处理
   - 缓解：使用 `:first-child` 和 `:last-child` 伪类

3. **文件选择器样式**: 原生 input 难以样式化
   - 缓解：使用隐藏 input + 自定义按钮（已有实现）

## Next Steps (Post-Implementation)

1. 收集用户反馈（内部测试）
2. 优化剧本详情页（下一规格）
3. 优化用户个人页面
4. 实施深色主题（全站）

## 成功标准

- ✅ 所有任务完成并通过验证
- ✅ M3 设计系统一致应用
- ✅ WCAG 2.1 AA 合规
- ✅ 无回归错误（现有功能正常）
- ✅ 视觉风格与首页一致
- ✅ 代码审查通过（遵循宪法规范）
