# Spec: 首页 Material Design 3 优化

**ID**: 002-homepage-m3-redesign  
**Created**: 2025-09-30  
**Status**: Draft  
**Priority**: High

## 目标

按照 CONSTITUTION.md 中的 Material Design 3 规范，优化首页视觉设计与交互体验，提升品牌感知和用户参与度。

## 背景

当前首页采用简单的卡片布局，缺乏视觉层次和品牌特色。需要：
1. 应用 M3 设计令牌（颜色、排版、形状、高度）
2. 增强视觉吸引力和可用性
3. 保持性能（SSR + 轻量交互）
4. 遵循无障碍访问标准

## 范围

### 包含
- ✅ Hero 区域（标题、副标题、主要 CTA）
- ✅ 热门剧本轮播（M3 卡片样式 + 改进控制）
- ✅ 特色功能入口（上传、浏览、排行榜）
- ✅ 应用 M3 颜色令牌、排版、圆角、阴影
- ✅ 深色/浅色主题适配（仅浅色主题，深色模式后续）
- ✅ 响应式布局优化

### 不包含
- ❌ 深色主题实现（下一阶段）
- ❌ 动画过渡效果（保持简洁）
- ❌ 个性化推荐（数据不足）

## 用户故事

### US-1: 清晰的价值主张
**作为** 新访客  
**我想要** 快速了解平台的核心价值  
**以便于** 决定是否继续使用

**验收标准**:
- Hero 区域包含主标题、副标题和主 CTA
- 视觉层次清晰（Display → Body → Button）
- CTA 按钮使用 M3 Filled Button 样式

### US-2: 发现热门内容
**作为** 用户  
**我想要** 浏览近期热门剧本  
**以便于** 快速找到优质内容

**验收标准**:
- 轮播使用 M3 Elevated Card（elevation-2）
- 显示封面、标题、下载量
- 支持自动播放、手动切换、指示器
- 移动端可滑动

### US-3: 快速导航功能
**作为** 用户  
**我想要** 快速访问核心功能  
**以便于** 完成目标任务

**验收标准**:
- 特色功能卡片使用 M3 Outlined Card
- 包含图标、标题、描述
- Hover 状态有视觉反馈（elevation 变化）
- 移动端响应式网格

## 设计规范

### 颜色系统（基于 M3）
```css
/* 浅色主题 */
--md-sys-color-primary: #6750A4
--md-sys-color-on-primary: #FFFFFF
--md-sys-color-primary-container: #EADDFF
--md-sys-color-on-primary-container: #21005D

--md-sys-color-surface: #FFFBFE
--md-sys-color-on-surface: #1C1B1F
--md-sys-color-surface-variant: #E7E0EC
--md-sys-color-on-surface-variant: #49454F

--md-sys-color-background: #FFFBFE
--md-sys-color-on-background: #1C1B1F
```

### 排版系统
- **Hero 标题**: Display Large (57px/64px, -0.25px)
- **Hero 副标题**: Body Large (16px/24px, 0.5px)
- **卡片标题**: Headline Small (24px/32px)
- **功能卡标题**: Title Medium (16px/24px, 0.15px)
- **描述文本**: Body Medium (14px/20px, 0.25px)
- **CTA 按钮**: Label Large (14px/20px, 0.1px, 500)

### 形状
- **Hero 容器**: 无圆角或 Extra Small (4px)
- **轮播卡片**: Medium (12px)
- **功能卡片**: Small (8px)
- **按钮**: Small (8px)

### 高度
- **Hero**: Level 0（平面）
- **轮播**: Level 2（明显阴影）
- **功能卡片**: Level 1（轻微阴影）
- **功能卡片 Hover**: Level 3（提升阴影）

## 技术实现

### 组件结构
```
HomePage (Server Component)
├── HeroSection
│   ├── Heading (Display Large)
│   ├── Subtitle (Body Large)
│   └── CTAButton (Filled Button)
├── HotCarousel (Client Component)
│   ├── CarouselCard (Elevated Card)
│   ├── Navigation Buttons (Icon Buttons)
│   └── Indicators (State Layer)
└── FeaturesGrid
    ├── FeatureCard × 3 (Outlined Card)
    │   ├── Icon
    │   ├── Title (Title Medium)
    │   └── Description (Body Medium)
```

### 性能要求
- SSR 渲染 Hero 和 Features
- 轮播使用 Client Component（交互需求）
- 图片使用 Next.js Image 优化
- LCP < 2.5s
- CLS < 0.1

### 无障碍
- Hero 标题使用 `<h1>`
- 轮播控制按钮有 `aria-label`
- 颜色对比度 ≥ 4.5:1
- 键盘可导航（Tab 顺序合理）
- 图片有 `alt` 属性

## API 依赖

- `fetchHot()`: 获取热门剧本（已有，保持不变）
- `/api/files?path=...`: 封面图片（已有）

## 数据流

```
1. HomePage (SSR) → fetchHot() → Prisma
2. 渲染 Hero + Features（静态）
3. 渲染 HotCarousel（hydration）
4. 轮播自动播放（4s 间隔）
```

## 成功指标

- ✅ 通过 WCAG 2.1 AA 验证
- ✅ Lighthouse Performance ≥ 90
- ✅ 所有组件遵循 M3 设计令牌
- ✅ 响应式测试通过（mobile/tablet/desktop）
- ✅ 浏览器兼容（Chrome/Firefox/Safari 最新两版本）

## 非功能需求

### 性能
- SSR 响应时间 < 500ms
- 客户端 JS bundle 增量 < 10KB

### 兼容性
- 支持 Chrome 100+、Firefox 100+、Safari 15+
- 移动端 iOS 15+、Android 10+

### 可维护性
- 使用 Tailwind 类实现 M3 令牌
- 组件代码行数 < 200 行
- CSS 类复用率 > 80%

## 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| M3 令牌与现有样式冲突 | 中 | 中 | 渐进迁移，保留回退样式 |
| 轮播性能问题（多图） | 低 | 低 | 图片懒加载，限制轮播数量 ≤ 5 |
| 无障碍测试不通过 | 高 | 低 | 使用 axe-core 自动化测试 |

## 未来增强

- 深色主题支持
- 动画过渡效果（M3 Motion）
- 个性化内容推荐
- A/B 测试不同布局

## 参考

- [Material Design 3](https://m3.material.io/)
- [Material 3 Color System](https://m3.material.io/styles/color/overview)
- [Material 3 Typography](https://m3.material.io/styles/typography/overview)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
