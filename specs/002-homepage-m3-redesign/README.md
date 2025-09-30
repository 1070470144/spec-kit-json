# 002: 首页 Material Design 3 优化

## 📋 规格概览

按照项目宪法中的 Material Design 3 规范，优化首页视觉设计与用户体验。

**状态**: Draft → Ready for Implementation  
**优先级**: High  
**预估工作量**: ~9 hours  
**分支**: `002-homepage-m3-redesign`

## 🎯 目标

1. ✅ 应用 M3 设计令牌（颜色、排版、形状、高度）
2. ✅ 提升视觉吸引力和品牌感知
3. ✅ 保持 SSR 性能
4. ✅ 确保无障碍访问（WCAG 2.1 AA）

## 📁 文档结构

```
002-homepage-m3-redesign/
├── README.md          # 本文档（概览）
├── spec.md            # 详细规格（用户故事、设计规范）
├── plan.md            # 实施计划（技术上下文、宪法检查）
└── tasks.md           # 任务清单（11 个任务，含依赖关系）
```

## 🎨 设计要点

### 颜色系统
- Primary: `#6750A4` (主色调)
- Surface: `#FFFBFE` (卡片背景)
- On-Surface: `#1C1B1F` (文本)

### 排版层级
- Display Large (57px) → Hero 标题
- Body Large (16px) → Hero 副标题
- Title Medium (16px) → 功能卡标题
- Label Large (14px) → 按钮文本

### 组件样式
- **Hero**: 平面设计，中心对齐，Filled Button CTA
- **轮播**: Elevated Card (elevation-2)，圆角 12px
- **功能卡**: Outlined Card，Hover 提升阴影

## 🛠️ 技术实现

### 组件结构
```tsx
HomePage (Server Component)
├── HeroSection (新增)
│   ├── 标题 + 副标题
│   └── CTA 按钮 → /scripts
├── HotCarousel (优化)
│   ├── M3 卡片样式
│   └── M3 控制按钮
└── FeaturesGrid (新增)
    └── 3 功能卡片
```

### 性能要求
- SSR 渲染静态内容
- 客户端 JS < 10KB 增量
- Lighthouse Performance ≥ 90
- LCP < 2.5s

## 📝 任务清单

### Phase 1: Setup (T001-T002)
- Tailwind M3 扩展
- globals.css 组件类

### Phase 2: 组件开发 (T003-T005) [可并行]
- T003: HeroSection
- T004: FeaturesGrid  
- T005: HotCarousel 优化

### Phase 3: 集成 (T006-T007)
- 更新 page.tsx
- 响应式优化

### Phase 4: 验证 (T008-T011) [可并行]
- 无障碍检查
- 性能验证
- 兼容性测试
- 文档更新

## ✅ 验收标准

- [ ] 所有组件遵循 M3 设计令牌
- [ ] WCAG 2.1 AA 合规
- [ ] 响应式布局正常（mobile/tablet/desktop）
- [ ] 键盘导航可用
- [ ] 无 TypeScript/ESLint 错误
- [ ] Lighthouse Performance ≥ 90

## 🚀 快速开始

```bash
# 1. 创建功能分支
git checkout -b 002-homepage-m3-redesign

# 2. 按顺序执行任务
# T001: 扩展 Tailwind 配置
# T003-T005: 创建/优化组件（可并行）
# T006: 集成到首页
# T007-T011: 测试与优化

# 3. 验证
npm run build
npm run lint
```

## 📚 参考资源

- [Material Design 3](https://m3.material.io/)
- [WCAG 2.1 快速参考](https://www.w3.org/WAI/WCAG21/quickref/)
- [项目宪法](../../CONSTITUTION.md)

## 🔄 后续计划

1. 扩展到其他页面（剧本列表、详情）
2. 实施深色主题
3. 添加动画过渡效果
4. A/B 测试 CTA 转化率
