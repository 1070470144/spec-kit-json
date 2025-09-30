# Tasks: 首页 Material Design 3 优化

**Input**: Design documents from `/specs/002-homepage-m3-redesign/`
**Prerequisites**: plan.md (required), spec.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: tech stack, M3 design tokens, component structure
2. Load spec.md:
   → Extract: user stories, design specs, component contracts
3. Generate tasks by category:
   → Setup: Tailwind M3 extensions
   → Components: Hero, Carousel, Features
   → Integration: Update homepage
   → Polish: A11y, responsive, performance
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Components before integration
5. Number tasks sequentially (T001, T002...)
6. Validate completeness
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Configuration

- [ ] T001 扩展 `xueran-juben-project/tailwind.config.ts`，添加 M3 elevation 阴影类（elevation-1 到 elevation-5）
- [ ] T002 [P] 在 `xueran-juben-project/app/globals.css` 中添加 M3 组件类（hero-section, feature-card, carousel-control）

## Phase 3.2: 组件开发（可并行）

### Hero Section
- [ ] T003 [P] 创建 `xueran-juben-project/app/_components/HeroSection.tsx`
  - Display Large 标题："血染钟楼资源平台"
  - Body Large 副标题：平台介绍
  - Filled Button CTA："浏览剧本" → /scripts
  - 应用 M3 排版令牌（text-display-large, text-body-large）
  - 颜色：bg-surface, text-surface-on, primary button

### Features Grid
- [ ] T004 [P] 创建 `xueran-juben-project/app/_components/FeaturesGrid.tsx`
  - 3 个功能卡片（Outlined Card）：
    1. 上传剧本 → /upload
    2. 浏览剧本 → /scripts
    3. 排行榜 → /leaderboard
  - 每卡片：图标 + Title Medium + Body Medium
  - Hover: elevation-1 → elevation-3
  - 响应式网格：grid-cols-1 md:grid-cols-3 gap-6

### Hot Carousel 优化
- [ ] T005 优化 `xueran-juben-project/app/_components/HotCarousel.tsx`
  - 应用 M3 Elevated Card 样式（shadow-elevation-2, rounded-md）
  - 控制按钮使用 M3 Icon Button 样式（圆形，bg-surface, elevation-1）
  - 指示器使用 M3 State Layer（白色，不同透明度）
  - 保持现有功能：自动播放、手动控制、响应式

## Phase 3.3: 集成与布局

- [ ] T006 更新 `xueran-juben-project/app/page.tsx`
  - 引入 HeroSection, FeaturesGrid
  - 布局顺序：Hero → HotCarousel → Features
  - 间距：section gap-8 md:gap-12
  - 保持 SSR fetchHot() 逻辑

## Phase 3.4: 样式与响应式

- [ ] T007 [P] 响应式优化（移动端测试）
  - Hero: 移动端 py-8, 桌面端 py-16
  - 轮播: 移动端隐藏左右按钮，保留滑动指示器
  - Features: 移动端单列，tablet 2列，desktop 3列

## Phase 3.5: 无障碍与性能

- [ ] T008 [P] 无障碍检查
  - Hero h1 语义化标签
  - CTA 按钮 focus 状态（ring-2 ring-primary）
  - 轮播控制 aria-label（"上一张"/"下一张"）
  - 功能卡片链接 hover/focus 状态
  - 颜色对比度验证（primary vs white ≥ 4.5:1）

- [ ] T009 [P] 性能验证
  - 确保 SSR 渲染 Hero 和 Features（无 'use client'）
  - 轮播图片使用 Next.js Image（如可行，或保持现有方案）
  - 检查客户端 JS bundle 增量 < 10KB
  - Lighthouse Performance 分数 ≥ 90

## Phase 3.6: 测试与文档

- [ ] T010 [P] 手动测试
  - 浏览器兼容性（Chrome/Firefox/Safari）
  - 响应式断点（mobile/tablet/desktop）
  - 键盘导航（Tab 顺序，Enter 激活）
  - 屏幕阅读器（NVDA/VoiceOver 基础测试）

- [ ] T011 [P] 更新文档
  - 在 `specs/002-homepage-m3-redesign/` 添加 `implementation-notes.md`
  - 记录 M3 令牌使用、组件结构、已知问题
  - 截图对比（优化前/后）

## Dependencies

```
T001 (Tailwind) → T003, T004, T005 (组件开发需要样式类)
T003, T004, T005 (组件) → T006 (集成)
T006 (集成) → T007, T008, T009 (测试)
```

## Parallel Execution Example

```bash
# Phase 3.2 可并行：
Task T003: 创建 HeroSection.tsx
Task T004: 创建 FeaturesGrid.tsx
# (同时进行，不同文件)

# Phase 3.5 可并行：
Task T008: 无障碍检查
Task T009: 性能验证
Task T010: 手动测试
Task T011: 更新文档
```

## Validation Checklist

- [ ] 所有组件使用 M3 设计令牌
- [ ] 排版遵循 M3 类型系统
- [ ] 颜色对比度 ≥ 4.5:1
- [ ] 响应式布局无破损
- [ ] 键盘导航顺序合理
- [ ] SSR 性能无退化
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 警告

## 实施优先级

### P0 (必须)
- T001-T006: 核心组件与集成
- T008: 无障碍基础要求

### P1 (重要)
- T007: 响应式优化
- T009: 性能验证

### P2 (增强)
- T010: 全面兼容性测试
- T011: 文档更新

## 预估工作量

| 任务 | 预估时间 | 复杂度 |
|------|---------|--------|
| T001-T002 Setup | 30 min | 低 |
| T003 Hero | 1 hour | 低 |
| T004 Features | 1.5 hours | 中 |
| T005 Carousel | 2 hours | 中 |
| T006 Integration | 30 min | 低 |
| T007 Responsive | 1 hour | 低 |
| T008 A11y | 1 hour | 中 |
| T009 Performance | 30 min | 低 |
| T010-T011 Test & Doc | 1 hour | 低 |
| **总计** | **~9 hours** | - |

## 风险与注意事项

1. **样式冲突**: 现有 globals.css 可能与新 M3 类冲突
   - 缓解：使用命名空间前缀（m3-hero, m3-feature）

2. **轮播性能**: 多图切换可能影响性能
   - 缓解：限制轮播数量 ≤ 5，优化图片加载

3. **TypeScript 类型**: 组件 Props 需要严格类型
   - 缓解：在 T003-T005 中明确定义 Props 接口

## Next Steps (Post-Implementation)

1. 收集用户反馈（内部测试）
2. A/B 测试转化率（CTA 点击率）
3. 扩展到其他页面（剧本列表、详情页）
4. 实施深色主题（下一阶段）

## 成功标准

- ✅ 所有任务完成并通过验证
- ✅ WCAG 2.1 AA 合规
- ✅ Lighthouse Performance ≥ 90
- ✅ 无回归错误（现有功能正常）
- ✅ 代码审查通过（遵循宪法规范）
