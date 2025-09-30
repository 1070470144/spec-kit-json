# Implementation Plan: 核心页面 Material Design 3 优化

**Branch**: `[003-pages-m3-redesign]` | **Date**: 2025-09-30 | **Spec**: specs/003-pages-m3-redesign/spec.md

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
2. Fill Technical Context
3. Fill Constitution Check section
4. Evaluate Constitution Check
5. Execute Phase 0 → research.md
6. Execute Phase 1 → contracts, data-model.md
7. Re-evaluate Constitution Check
8. Plan Phase 2 → Task generation approach
9. STOP - Ready for /tasks
```

## Summary
按照 Material Design 3 规范优化剧本列表、排行榜和上传页面。应用 M3 卡片、表单、按钮和排版系统，确保与首页（规格 002）的视觉一致性。保持 SSR 性能和功能完整性。

## Technical Context
- Language: TypeScript (Node.js 20+)
- Framework: Next.js (App Router, Server Components + Client Components)
- UI: React + Tailwind CSS + Material 3 Design Tokens（已在 002 中配置）
- Data: Prisma (已有查询逻辑，无需更改)
- Performance: SSR, 客户端状态管理（点赞/收藏）
- A11y: WCAG 2.1 AA, semantic HTML, ARIA labels

## UI Design (Material 3 Implementation)

### 剧本列表页 (/scripts)

#### 搜索栏
- M3 Outlined Text Field
- 圆角：`rounded-sm` (8px)
- Focus: ring-2 ring-primary
- 搜索按钮：M3 Filled Button
- 清除按钮：M3 Text Button

#### 剧本卡片
- M3 Elevated Card: `m3-card-elevated`
- 图片轮播：aspect-[4/3], 保持现有功能
- 标题：`text-title-large`
- 作者：`text-body-small text-surface-on-variant`
- 操作按钮：M3 Icon Button (点赞/收藏)

#### 分页控件
- 上一页/下一页：M3 Outlined Button
- 页码信息：`text-body-medium`
- 禁用状态：opacity-60, cursor-not-allowed

### 排行榜页 (/leaderboard)

#### 切换按钮组
- M3 Segmented Button 风格
- 活跃状态：`bg-primary text-primary-on`
- 非活跃：`border border-outline text-surface-on`
- 间距：gap-0，首尾圆角

#### 排名徽章
- Top 1: 圆形，`bg-amber-500 text-white shadow-elevation-2`
- Top 2: 圆形，`bg-gray-400 text-white shadow-elevation-1`
- Top 3: 圆形，`bg-orange-400 text-white`
- 其他：`bg-surface border border-outline`

#### 列表项
- 容器：`m3-card-outlined` 内，divided list
- Hover: `bg-surface-variant`
- 标题：`text-title-medium`
- 作者：`text-body-small`
- 统计：badge 样式

### 上传页面 (/upload)

#### 表单布局
- 容器：max-w-3xl，glass-card（保持现有风格）
- 字段：label (w-28) + input (flex-1)
- 间距：space-y-4

#### 输入框
- Text Field: M3 Outlined 样式
- 占位符：`text-surface-on-variant`
- Focus: ring-2 ring-primary

#### 文件选择
- 按钮：M3 Outlined Button
- 状态文本：`text-body-small text-surface-on-variant`
- 预览卡片：`m3-card-elevated`，grid-cols-3

#### 提交按钮
- 主按钮：`m3-btn-filled`
- 取消按钮：M3 Text Button
- Loading: 禁用 + 文本变化

## Constitution Check (门槛)

### ✅ Material 3 统一
- 所有卡片使用 M3 卡片样式（Elevated/Outlined）
- 所有按钮使用 M3 按钮样式（Filled/Outlined/Text/Icon）
- 所有输入使用 M3 Text Field 样式
- 排版遵循 M3 类型系统
- 颜色使用 M3 令牌（primary/surface/outline）

### ✅ 无障碍
- 搜索框有 placeholder 和 label
- 分页按钮有 aria-disabled
- 文件输入有关联 label
- 所有交互元素键盘可达
- 颜色对比度 ≥ 4.5:1

### ✅ 性能
- 保持现有 SSR 性能
- 客户端组件仅用于交互（轮播、点赞/收藏）
- 无额外第三方库

### ✅ 代码质量
- TypeScript 严格模式
- 复用现有组件（轮播、操作按钮）
- 保持现有功能逻辑

评估：符合宪法要求，可执行。

## Project Structure (相关文件)

```
xueran-juben-project/
├── app/
│   ├── scripts/
│   │   ├── page.tsx                 # 需优化
│   │   ├── ScriptCardActions.tsx    # 需优化
│   │   └── ScriptImagesCarousel.tsx # 保持现有
│   ├── leaderboard/
│   │   └── page.tsx                 # 需优化
│   ├── upload/
│   │   └── page.tsx                 # 需优化
│   └── globals.css                  # 可能需添加新类
├── tailwind.config.ts               # 已配置 M3（002）
└── specs/003-pages-m3-redesign/
    ├── spec.md
    ├── plan.md (本文档)
    └── tasks.md (待生成)
```

## Phase 0: Research (Completed in Spec)

### 设计决策
- **剧本列表**: 保持网格布局，优化卡片样式和交互
- **排行榜**: 简化排名展示，使用 M3 徽章系统
- **上传页**: 保持表单布局，优化输入和反馈

### M3 组件映射
| 页面元素 | M3 组件 | Tailwind 类 |
|---------|---------|------------|
| 剧本卡片 | Elevated Card | `m3-card-elevated` |
| 搜索框 | Outlined Text Field | `input` + M3 增强 |
| 分页按钮 | Outlined Button | M3 button 样式 |
| 排名徽章 | Badge | 自定义，M3 颜色 |
| 切换组 | Segmented Button | 自定义，M3 样式 |
| 上传输入 | Outlined Text Field | `input` + M3 增强 |
| 文件按钮 | Outlined Button | M3 button 样式 |

## Phase 1: Design & Contracts

### 无新增组件
本次优化主要是应用 M3 样式到现有页面，无需创建新组件。

### 样式增强清单

#### globals.css 新增类
```css
/* M3 Text Field (Outlined) */
.m3-text-field {
  @apply input; /* 复用现有，增强 focus 样式 */
}

/* M3 Segmented Button */
.m3-segmented-btn {
  @apply inline-flex items-center px-4 py-2 text-label-large;
  @apply border border-outline transition-all duration-standard;
}
.m3-segmented-btn-active {
  @apply bg-primary text-primary-on border-primary;
}

/* M3 Rank Badge */
.m3-rank-badge {
  @apply inline-flex items-center justify-center rounded-full font-medium;
}
```

## Phase 2: Task Planning Approach

### 任务生成策略
1. **Setup Tasks**: 扩展 globals.css（新增 M3 组件类）
2. **Page Tasks**: 逐页面优化
   - 剧本列表页（搜索 + 卡片 + 分页）
   - 排行榜页（切换组 + 列表）
   - 上传页（表单 + 文件选择 + 预览）
3. **Component Tasks**: 优化交互组件
   - ScriptCardActions（点赞/收藏按钮）
4. **Polish Tasks**: 响应式、无障碍、性能检查

### 任务顺序
- Setup → Pages (可部分并行) → Component → Polish
- 优先级: 剧本列表 > 上传页 > 排行榜

## Complexity Tracking
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 无复杂性偏离 | - | - |

## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete (/plan)
- [x] Phase 1: Design complete (/plan)
- [ ] Phase 2: Task planning complete (/plan)
- [ ] Phase 3: Tasks generated (/tasks)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (无偏离)

## Next Focus
- 生成详细任务列表 (/tasks)
- 实施 M3 页面优化（优先剧本列表）
- 验证视觉一致性与功能完整性
