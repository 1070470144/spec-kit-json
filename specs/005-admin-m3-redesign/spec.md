# Spec: 管理员界面 Material Design 3 优化

**ID**: 005-admin-m3-redesign  
**Created**: 2025-09-30  
**Status**: In Progress  
**Priority**: High

## 目标

按照 CONSTITUTION.md 中的 Material Design 3 规范，优化管理员后台所有界面的视觉设计与交互体验，保持与门户页面一致的设计语言，同时体现后台管理的专业性。

## 背景

门户页面已完成 M3 优化（规格 002、003、004），建立了完整的设计系统基础。管理员后台目前使用简单的卡片布局，需要应用 M3 规范以提升视觉一致性和用户体验。

## 范围

### 包含
- ✅ 管理员登录页（/admin/login）
  - M3 表单样式（保持玻璃拟态背景）
  - M3 按钮样式

- ✅ 管理员布局（layout.tsx）
  - 侧边栏优化
  - 顶栏优化
  - 导航优化

- ✅ 审核管理页（/admin/review）
  - M3 卡片网格
  - 审核按钮优化
  - 操作反馈优化

- ✅ 剧本管理页（/admin/scripts）
  - M3 卡片样式
  - 状态切换优化
  - 批量操作优化

- ✅ 用户管理页（/admin/users）
  - M3 表格样式
  - 操作按钮优化

- ✅ 讲述者管理页（/admin/storytellers）
  - M3 列表样式
  - 级别按钮优化

- ✅ 评论管理页（/admin/comments）
  - M3 列表样式
  - 操作按钮优化

- ✅ 数据分析页（/admin/analytics）
  - M3 卡片布局
  - 图表样式优化

- ✅ 系统设置页（/admin/settings）
  - M3 表单样式
  - 配置项优化

### 不包含
- ❌ 权限细粒度控制（下一阶段）
- ❌ 审计日志可视化（下一阶段）
- ❌ 深色主题（统一在全局主题时实现）

## 设计规范

### 布局系统

#### 管理员登录页
- 使用 auth-hero + glass-card（与门户登录一致）
- 标题：Display Small（36px）
- 副标题：Body Medium（14px）
- 按钮：M3 Filled Button

#### 管理员布局
```
Grid Layout: md:grid-cols-[260px_1fr]
├── 侧边栏（sticky, h-screen）
│   ├── Logo/标题区（p-4, border-b）
│   └── 导航区（p-3）
│       └── 导航项（M3 列表项样式）
└── 主内容区
    ├── 顶栏（sticky, z-10, border-b）
    │   ├── 页面标题
    │   └── 用户菜单
    └── 内容区（p-6）
```

#### 侧边栏导航
- 一级分类：font-medium, hover:bg-blue-50
- 二级项目：ml-2, pl-2, border-l
- 活跃状态：bg-blue-100 + 左侧蓝色竖线
- 展开图标：▸/▾
- Focus: ring-2 ring-blue-200

### 颜色系统

```css
/* 管理员专用（基于 M3） */
--admin-surface: #FFFFFF
--admin-surface-variant: #E7E0EC
--admin-primary: #2563EB (blue-600)
--admin-on-primary: #FFFFFF
--admin-border: #E2E8F0
--admin-hover: #F0F9FF (blue-50)
--admin-active: #DBEAFE (blue-100)
--admin-active-text: #1E40AF (blue-800)
```

### 组件规范

#### 卡片
- 基础：`.card` (bg-white, border, rounded-xl, shadow-sm)
- 悬浮：`hover:shadow-md`
- 标题：`.card-title` (text-lg font-semibold)
- 内容：`.card-body` (p-4 md:p-6)

#### 按钮
- 主操作：`m3-btn-filled` (bg-primary, text-white)
- 次要操作：`m3-btn-outlined` (border, text-surface-on)
- 危险操作：`btn-danger` (bg-error, text-white)
- 状态切换：`m3-segmented-btn`

#### 表格
- 使用现有 `.table-admin`
- 斑马纹：`tr:nth-child(2n):bg-gray-50/60`
- 悬浮：`tr:hover:bg-blue-50/50`
- 表头：`thead text-gray-600 text-left`

#### 表单
- Text Field: `.input` (M3 Outlined 样式)
- Textarea: `.textarea`
- Label: `text-body-medium font-medium`
- Error: `.input-error` + `.help-error`

## 技术实现

### 1. 优化管理员登录页
**文件**: `app/admin/login/page.tsx`

改动：
1. 应用 auth-hero + glass-card 布局
2. 标题使用 text-display-small
3. 按钮使用 m3-btn-filled
4. 错误提示优化

### 2. 优化管理员布局
**文件**: `app/admin/layout.tsx`

改动：
1. 侧边栏背景：bg-white
2. 顶栏：优化间距和对比
3. 响应式优化

### 3. 优化侧边栏导航
**文件**: `app/admin/_components/AdminSidebar.tsx`

改动：
1. 导航项应用 M3 交互状态
2. 优化活跃状态指示
3. 改进展开/收起动效

### 4. 优化审核管理页
**文件**: `app/admin/review/page.tsx`

改动：
1. 卡片网格使用 M3 样式
2. 一键通过按钮优化
3. 分页控件优化

### 5. 优化剧本管理页
**文件**: `app/admin/scripts/page.tsx`

改动：
1. 状态切换使用 m3-segmented-btn
2. 卡片样式统一
3. 操作按钮优化

### 6. 优化用户管理页
**文件**: `app/admin/users/page.tsx`

改动：
1. 表格应用 .table-admin
2. 操作按钮优化
3. 表单样式统一

### 7. 优化其他管理页面
- storytellers: 级别按钮使用 m3-segmented-btn
- comments: 列表样式优化
- analytics: 图表卡片优化
- settings: 表单统一

## 性能要求

- 保持现有 SSR 性能
- 导航交互流畅（< 100ms）
- 表格排序/筛选响应 < 200ms
- 图表渲染 < 500ms

## 无障碍要求

- 所有导航项键盘可达
- 活跃状态有清晰视觉指示
- 表格有语义化标记
- 操作按钮有明确的 aria-label
- 颜色对比度 ≥ 4.5:1

## 成功指标

- ✅ 所有管理页面遵循 M3 设计系统
- ✅ 视觉风格与门户页面一致
- ✅ 无 TypeScript/ESLint 错误
- ✅ 响应式布局正常
- ✅ 无障碍访问符合 WCAG 2.1 AA
- ✅ 保持现有功能完整性

## 参考

- [Material Design 3](https://m3.material.io/)
- [项目宪法](../../CONSTITUTION.md)
- [首页 M3 优化](../002-homepage-m3-redesign/spec.md)
- [核心页面 M3 优化](../003-pages-m3-redesign/spec.md)
- [认证页面 M3 优化](../004-auth-m3-redesign/spec.md)
