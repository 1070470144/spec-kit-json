# Spec: 核心页面 Material Design 3 优化

**ID**: 003-pages-m3-redesign  
**Created**: 2025-09-30  
**Status**: Draft  
**Priority**: High

## 目标

按照 CONSTITUTION.md 中的 Material Design 3 规范，优化剧本列表、排行榜和上传页面的视觉设计与交互体验，保持与首页一致的设计语言。

## 背景

首页已完成 M3 优化（规格 002），建立了设计系统基础。现需将 M3 规范应用到核心功能页面，确保整体视觉一致性。

当前问题：
1. 剧本列表：卡片样式不统一，缺少视觉层次
2. 排行榜：排名展示可优化，状态指示不明确
3. 上传页面：表单布局可改进，缺少步骤引导

## 范围

### 包含
- ✅ 剧本列表页（/scripts）
  - M3 卡片样式
  - 搜索栏优化
  - 分页控件优化
  - 图片轮播优化

- ✅ 排行榜页（/leaderboard）
  - M3 列表项样式
  - 排名徽章优化
  - 切换按钮组优化
  - 数据可视化增强

- ✅ 上传页面（/upload）
  - M3 表单样式
  - 文件选择器优化
  - 图片预览优化
  - 提交反馈优化

### 不包含
- ❌ 剧本详情页（下一阶段）
- ❌ 用户个人页面（下一阶段）
- ❌ 管理后台（单独规格）

## 用户故事

### US-1: 剧本列表浏览
**作为** 用户  
**我想要** 在清晰的卡片列表中浏览剧本  
**以便于** 快速找到感兴趣的内容

**验收标准**:
- 卡片使用 M3 Elevated Card 样式
- 缩略图轮播流畅自然
- 点赞/收藏操作按钮清晰
- 搜索栏使用 M3 Text Field 样式
- 分页控件符合 M3 规范

### US-2: 排行榜查看
**作为** 用户  
**我想要** 查看不同维度的排行榜  
**以便于** 发现热门和优质内容

**验收标准**:
- 排名使用 M3 徽章样式
- Top 3 有明显的视觉区分
- 切换按钮使用 M3 Segmented Button
- 列表项有清晰的交互反馈
- 数据统计展示直观

### US-3: 剧本上传
**作为** 创作者  
**我想要** 便捷地上传剧本和图片  
**以便于** 分享我的作品

**验收标准**:
- 表单使用 M3 Text Field 样式
- 文件选择器有清晰的状态反馈
- 图片预览使用 M3 卡片样式
- 提交按钮使用 M3 Filled Button
- 错误提示清晰友好

## 设计规范

### 剧本列表页

#### 布局
- 搜索栏：顶部，M3 Outlined Text Field
- 卡片网格：grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- 分页：底部居中，M3 按钮样式

#### 卡片设计
```
M3 Elevated Card (shadow-elevation-2)
├── 图片轮播（aspect-[4/3]）
├── 内容区（p-4）
│   ├── 标题（text-title-large）
│   ├── 作者（text-body-small, surface-on-variant）
│   └── 操作栏（点赞/收藏，M3 Icon Button）
```

#### 颜色
- 卡片背景：surface
- 标题：surface-on
- 次要文本：surface-on-variant
- 操作按钮：primary

### 排行榜页

#### 布局
- 标题 + 切换组：顶部
- 排行列表：单列，卡片内

#### 排名徽章
- Top 1: primary, elevation-2, 金色背景
- Top 2: surface-variant, elevation-1, 银色背景
- Top 3: tertiary-container, 铜色背景
- 其他: surface, outline border

#### 切换按钮组
- 使用 M3 Segmented Button 样式
- 活跃状态：primary 背景
- 非活跃：outline 边框

### 上传页面

#### 布局
- 标题 + 说明：顶部
- 表单：max-w-3xl，居中
- 字段：label + input 水平排列

#### 表单元素
- Text Field: M3 Outlined 样式
- 文件选择器：M3 Outlined Button + 状态文本
- 图片预览：grid-cols-3，M3 卡片
- 提交按钮：M3 Filled Button

#### 反馈机制
- Toast 通知：M3 Snackbar 样式
- 加载状态：按钮禁用 + 文本变化
- 错误提示：error 颜色 + icon

## 技术实现

### 剧本列表页优化

**文件**: `app/scripts/page.tsx`

改动：
1. 搜索栏使用 M3 Text Field 样式
2. 卡片应用 `m3-card-elevated` 类
3. 分页按钮应用 M3 样式
4. 优化响应式网格

**文件**: `app/scripts/ScriptCardActions.tsx`

改动：
1. 按钮使用 M3 Icon Button 样式
2. 统计数字使用 M3 排版

### 排行榜页优化

**文件**: `app/leaderboard/page.tsx`

改动：
1. 切换组使用 M3 Segmented Button
2. 排名徽章应用 M3 徽章样式
3. 列表项优化交互状态
4. Top 3 使用 M3 颜色令牌

### 上传页优化

**文件**: `app/upload/page.tsx`

改动：
1. 表单输入使用 M3 Text Field
2. 文件选择器按钮使用 M3 Outlined Button
3. 图片预览卡片应用 M3 样式
4. Toast 通知使用 M3 Snackbar 样式
5. 提交按钮应用 `m3-btn-filled`

## 性能要求

- 保持现有 SSR 性能
- 卡片轮播流畅度 ≥ 60fps
- 搜索响应时间 < 500ms
- 图片预览生成 < 100ms

## 无障碍要求

- 搜索框有 `aria-label`
- 分页按钮有 `aria-disabled` 状态
- 文件输入有关联 label
- 排名徽章有文本内容（非仅视觉）
- 所有交互元素键盘可达

## 成功指标

- ✅ 所有页面遵循 M3 设计系统
- ✅ 视觉风格与首页一致
- ✅ 无 TypeScript/ESLint 错误
- ✅ 响应式布局正常
- ✅ 无障碍访问符合 WCAG 2.1 AA
- ✅ 保持现有功能完整性

## 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 卡片轮播性能问题 | 中 | 低 | 限制图片大小，优化渲染 |
| 表单样式与验证冲突 | 低 | 低 | 分离样式与逻辑 |
| 上传进度反馈不足 | 中 | 中 | 添加 loading 状态 |

## 未来增强

- 剧本列表筛选器（类型、标签）
- 排行榜数据可视化（图表）
- 上传页面拖拽上传
- 批量操作支持

## 参考

- [Material Design 3](https://m3.material.io/)
- [M3 Components - Cards](https://m3.material.io/components/cards)
- [M3 Components - Text Fields](https://m3.material.io/components/text-fields)
- [M3 Components - Buttons](https://m3.material.io/components/buttons)
- [项目宪法](../../CONSTITUTION.md)
- [首页 M3 优化](../002-homepage-m3-redesign/spec.md)
