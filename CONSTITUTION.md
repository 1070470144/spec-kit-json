# 项目宪法 (Project Constitution)

本文档定义项目的核心开发规范，所有功能实现必须遵守。

## UI 统一规范：Material Design 3 + 高端视觉设计

**所有 UI 组件必须遵循 Material Design 3 设计系统，同时追求大气、高端的视觉表现。**

### 核心原则
- **色彩**：使用 M3 颜色令牌 + 高端配色方案
- **排版**：Display/Headline/Title/Body/Label 五级系统 + 衬线体标题
- **形状**：圆角 8px/12px/16px/24px（更大更柔和）
- **高度**：使用阴影表现层级（shadow-lg/xl/2xl，增强立体感）
- **无障碍**：对比度 ≥ 4.5:1（WCAG AA），支持键盘导航
- **主题**：支持浅色/深色模式

### 高端视觉设计规范

#### 配色方案（优雅深蓝 - 官方配色）
```css
--primary: #0EA5E9 (sky-500) 天空蓝
--primary-dark: #0284C7 (sky-600)
--accent: #06B6D4 (cyan-500) 青色

/* 渐变组合 */
--gradient-primary: from-sky-500 to-cyan-600
--gradient-hero: from-slate-900 via-blue-900 to-cyan-900
--gradient-brand: from-sky-600 to-cyan-600

/* 光晕效果 */
--glow-primary: bg-sky-500/30
--glow-accent: bg-cyan-500/30

/* 交互颜色 */
--hover-primary: sky-600
--hover-bg: sky-50
--focus-ring: sky-300
```

**配色原则**：
- 主操作使用天空蓝到青色渐变
- hover 效果使用 sky-600
- Logo 和品牌元素使用 sky-cyan 渐变
- 背景渐变使用深蓝色系（slate-blue-cyan）
- 保持绿色用于成功状态，红色用于错误/危险操作
- 黄色/橙色用于特殊徽章（如讲述者等级）

#### 字体系统
- **英文标题**：Inter（无衬线，现代感）
- **中文标题**：系统字体栈（保持加载性能）
- **字重对比**：标题 font-bold (700)，正文 font-normal (400)
- **字号升级**：
  - Display Large: 72px (原 48px)
  - Headline Large: 48px (原 36px)
  - Title Large: 28px (原 22px)

#### 间距系统（增强空间感）
```css
Hero 区域：py-20 md:py-32 (原 py-12)
Section 间距：space-y-12 md:space-y-20 (原 space-y-8)
卡片内边距：p-8 md:p-12 (原 p-6)
容器最大宽度：max-w-7xl (原 max-w-5xl)
```

#### 阴影系统（增强立体感）
```css
卡片默认：shadow-lg (原 shadow-sm)
卡片悬浮：shadow-2xl (原 shadow-md)
悬浮位移：hover:-translate-y-2
悬浮缩放：hover:scale-[1.02]
过渡时长：duration-300
```

#### Hero 区域设计规范
- 最小高度：min-h-screen（全屏视觉冲击）
- 渐变背景：深色渐变 + 光晕效果
- 标题：超大字号 + 渐变色文字
- CTA 按钮：大尺寸 (px-12 py-6) + 渐变背景
- 装饰元素：光晕、网格、渐变叠加

#### 卡片设计规范
- 基础：rounded-2xl + shadow-lg + border-gray-100
- 顶部装饰条：h-1 渐变色
- 悬浮效果：shadow-2xl + -translate-y-2
- 内容间距：p-8
- 图标背景：渐变色 + rounded-2xl

#### 按钮设计规范
- **Filled（主操作）**：渐变背景 + 大尺寸 + 阴影
- **Outlined（次要）**：边框 + backdrop-blur
- **CTA 按钮**：px-12 py-6 + rounded-full + 图标
- **悬浮效果**：scale-105 + 阴影增强

### 组件规范
- **按钮**：Filled（主操作）/ Outlined（次要）/ Text（低优先级）
- **输入**：Filled / Outlined，明确的 error/focus/disabled 状态
- **卡片**：Elevated（默认）/ Filled / Outlined
- **动效**：100ms（快速）/ 200-300ms（标准）/ 400-500ms（慢速）

### 实施要求
1. 在 `tailwind.config.ts` 中定义 M3 设计令牌 + 自定义配色
2. 使用语义化颜色名，禁止硬编码颜色值
3. 所有组件需有 hover/focus/disabled/error 状态
4. Hero 区域必须全屏且有视觉冲击力
5. 关键页面标题必须使用大字号 + 粗字重
6. 卡片必须有悬浮效果和阴影变化
7. UI 相关 PR 必须说明设计规范符合性

**参考**：
- Material Design 3: https://m3.material.io/
- 高端网站案例：Stripe, Linear, Vercel

---

## 技术栈约束

- **语言**：TypeScript（严格模式，禁用 `any`）
- **框架**：Next.js App Router + React Server Components
- **数据**：Prisma + SQLite(Dev) / PostgreSQL(Prod)
- **校验**：Zod + JSON Schema
- **存储**：本地文件(Dev) / S3(Prod)
- **样式**：Tailwind CSS + M3 令牌

---

## 开发规范

### 命名约定
- 组件文件：`PascalCase.tsx`
- 工具函数：`camelCase.ts`
- 常量：`UPPER_SNAKE_CASE`

### 代码质量
- 所有公共 API 必须有类型定义
- 优先使用函数组件 + Hooks
- 破坏性变更需版本化

### Git 提交
遵循 Conventional Commits：
```
feat: 新功能
fix: 错误修复
docs: 文档
style: UI样式（不影响功能）
refactor: 重构
test: 测试
chore: 构建/工具
```

---

## 安全与隐私

- ✅ 上传文件类型/大小校验
- ✅ 管理员独立会话（与门户分离）
- ✅ 邮件链接一次性使用 + 过期时间
- ✅ 所有用户输入必须验证与消毒
- ✅ 敏感信息使用环境变量

---

## 测试要求

- 契约测试：所有 API 端点
- 集成测试：关键业务流程
- E2E 测试：核心用户路径
- 测试先行（TDD）：先写测试再实现

---

## 性能标准

- 列表接口 p95 < 200ms
- 图片使用 Next.js Image 优化
- 懒加载非关键资源
- 最小化客户端 JavaScript

---

**版本**: 2.0.0 | **更新**: 2025-09-30 | **变更**: 增加高端视觉设计规范