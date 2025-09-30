# Implementation Plan: 首页 Material Design 3 优化

**Branch**: `[002-homepage-m3-redesign]` | **Date**: 2025-09-30 | **Spec**: specs/002-homepage-m3-redesign/spec.md

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
3. Fill the Constitution Check section based on the constitution
4. Evaluate Constitution Check
5. Execute Phase 0 → research.md
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
7. Re-evaluate Constitution Check
8. Plan Phase 2 → Describe task generation approach
9. STOP - Ready for /tasks
```

## Summary
按照 Material Design 3 规范优化首页，包括 Hero 区域、热门轮播和特色功能入口。应用 M3 颜色、排版、形状和高度系统，提升视觉吸引力和可用性。保持 SSR 性能，确保无障碍访问。

## Technical Context
- Language: TypeScript (Node.js 20+)
- Framework: Next.js (App Router, Server Components)
- UI: React + Tailwind CSS + Material 3 Design Tokens
- Data: Prisma (已有 fetchHot 逻辑，无需更改)
- Performance: Next.js Image, SSR, minimal client JS
- A11y: WCAG 2.1 AA, semantic HTML, ARIA labels

## UI Design (Material 3 Implementation)

### 颜色令牌
在 `tailwind.config.ts` 中已定义（按 CONSTITUTION.md）：
- Primary: `#6750A4` (主色)
- Surface: `#FFFBFE` (表面)
- Background: `#FFFBFE` (背景)
- On-Surface: `#1C1B1F` (文本)
- Outline: `#79747E` (边框)

### 排版规范
- Hero 标题: `text-display-large` (57px/64px)
- Hero 副标题: `text-body-large` (16px/24px)
- 卡片标题: `text-headline-small` (24px/32px)
- 功能卡标题: `text-title-medium` (16px/24px)
- 描述: `text-body-medium` (14px/20px)

### 形状系统
- 轮播卡片: `rounded-md` (12px)
- 功能卡片: `rounded-sm` (8px)
- 按钮: `rounded-sm` (8px)

### 高度层级
- Hero: 无阴影
- 轮播: `shadow-elevation-2`
- 功能卡片: `shadow-elevation-1` → `hover:shadow-elevation-3`

### 布局
- Hero: 全宽容器，垂直居中内容，py-12 md:py-16
- 轮播: aspect-[16/6]，保持现有比例
- 功能网格: grid-cols-1 md:grid-cols-3，gap-6

## Constitution Check (门槛)

### ✅ Material 3 统一
- 所有颜色使用 M3 令牌（primary/surface/on-surface）
- 排版遵循 M3 类型系统（Display/Headline/Title/Body/Label）
- 形状使用 M3 圆角规范（4/8/12/16/28px）
- 高度应用 M3 阴影系统（elevation-1 到 elevation-5）

### ✅ 无障碍
- 对比度 ≥ 4.5:1（已验证 primary vs white）
- 语义化标签（h1/h2/nav/button）
- ARIA 属性（aria-label for icon buttons）
- 键盘可达（轮播控制、CTA 按钮）

### ✅ 性能
- SSR 渲染静态内容（Hero/Features）
- 仅轮播使用 Client Component
- 图片优化（Next.js Image，lazy loading）
- 无不必要的第三方库

### ✅ 代码质量
- TypeScript 严格模式
- 组件拆分清晰（Hero/Carousel/Features）
- Tailwind 类复用（通过 @layer components）

评估：符合宪法要求，可执行。

## Project Structure (相关文件)

```
xueran-juben-project/
├── app/
│   ├── page.tsx                    # 首页（需优化）
│   ├── _components/
│   │   ├── HeroSection.tsx         # 新增 Hero 组件
│   │   ├── HotCarousel.tsx         # 优化现有轮播
│   │   └── FeaturesGrid.tsx        # 新增功能入口
│   └── globals.css                 # 已有 M3 变量，需扩展
├── tailwind.config.ts              # 已有 M3 令牌（已配置）
└── specs/002-homepage-m3-redesign/
    ├── spec.md                     # 本规格
    ├── plan.md                     # 本文档
    └── tasks.md                    # 待生成
```

## Phase 0: Research (Completed in Spec)

### 设计决策
- **Hero 布局**: 中心对齐，简洁明了，单列布局（移动优先）
- **轮播**: 保持现有 aspect-[16/6]，优化控制按钮样式（M3 Icon Button）
- **功能卡片**: 3 列网格（desktop），卡片式入口（图标 + 文案）

### M3 令牌映射
| 元素 | M3 令牌 | Tailwind 类 |
|------|---------|------------|
| Hero 背景 | Surface | `bg-surface` |
| Hero 标题 | On-Surface | `text-surface-on` |
| CTA 按钮 | Primary | `bg-primary text-primary-on` |
| 轮播卡片 | Surface + Elevation-2 | `bg-surface shadow-elevation-2` |
| 功能卡片 | Surface-Variant + Outline | `bg-surface-variant border border-outline` |

## Phase 1: Design & Contracts

### 组件契约

#### HeroSection
```typescript
// app/_components/HeroSection.tsx
export default function HeroSection(): JSX.Element
// Props: 无（静态内容）
// 输出: Hero 区域（标题/副标题/CTA）
```

#### HotCarousel (优化)
```typescript
// app/_components/HotCarousel.tsx
export type HotItem = { scriptId: string; title: string; cover?: string; downloads: number }
export default function HotCarousel({ items }: { items: HotItem[] }): JSX.Element | null
// 已有，需应用 M3 样式
```

#### FeaturesGrid
```typescript
// app/_components/FeaturesGrid.tsx
export default function FeaturesGrid(): JSX.Element
// Props: 无（静态功能入口）
// 输出: 3 个功能卡片（上传/浏览/排行）
```

### 数据契约
- 无新增 API
- 复用现有 `fetchHot()` (app/page.tsx)

## Phase 2: Task Planning Approach

### 任务生成策略
1. **Setup Tasks**: 扩展 Tailwind 配置（M3 阴影类）
2. **Component Tasks**: 
   - 创建 HeroSection（新组件）
   - 优化 HotCarousel（M3 样式）
   - 创建 FeaturesGrid（新组件）
3. **Integration Tasks**: 更新 app/page.tsx 集成组件
4. **Polish Tasks**: 无障碍测试、响应式验证、性能检查

### 任务顺序
- Setup → Components (可并行) → Integration → Polish
- 优先级: HeroSection > FeaturesGrid > HotCarousel 优化

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
- 实施 M3 组件（优先 Hero）
- 无障碍测试与性能验证
