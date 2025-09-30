# Spec: 剧本详情页 Material Design 3 优化

**ID**: 007-script-detail-m3-redesign  
**Created**: 2025-09-30  
**Status**: In Progress  
**Priority**: High

## 目标

按照 CONSTITUTION.md 中的 Material Design 3 规范，优化剧本详情页面的视觉设计与交互体验，提升内容展示效果和用户操作体验。

## 背景

门户其他页面和管理后台已完成 M3 优化（规格 002-006），剧本详情页作为核心内容展示页面，需要应用相同的 M3 规范以确保整体视觉一致性，同时优化图片展示和 JSON 预览体验。

## 范围

### 包含
- ✅ 剧本详情页（/scripts/[id]）
  - M3 页面布局优化
  - 图片轮播区域优化
  - 剧本信息展示优化
  - JSON 预览区域优化
  - 操作按钮优化（下载、点赞、收藏）
  - 评论区域优化

### 不包含
- ❌ 剧本编辑功能（管理员功能）
- ❌ 剧本上传流程
- ❌ 剧本搜索功能

## 用户故事

### US-1: 剧本内容浏览
**作为** 用户  
**我想要** 在清晰的界面中查看剧本详情  
**以便于** 了解剧本内容和信息

**验收标准**:
- 页面布局清晰，信息层次分明
- 图片展示美观，支持放大查看
- JSON 预览易读，支持复制
- 操作按钮清晰明确

### US-2: 剧本操作
**作为** 用户  
**我想要** 方便地下载、点赞或收藏剧本  
**以便于** 保存和分享内容

**验收标准**:
- 下载按钮醒目
- 点赞/收藏有即时反馈
- 操作统计数字清晰
- 按钮状态明确

### US-3: 社区互动
**作为** 用户  
**我想要** 查看和发表评论  
**以便于** 与其他用户交流

**验收标准**:
- 评论区域清晰
- 发表评论表单简洁
- 评论展示美观

## 设计规范

### 布局系统

#### 页面结构
```
Container (max-w-5xl, mx-auto, p-6)
├── 面包屑导航
├── 图片轮播区（M3 Elevated Card）
│   ├── 图片展示
│   └── 轮播控制
├── 剧本信息区（Card）
│   ├── 标题（Headline Large）
│   ├── 作者信息
│   ├── 操作按钮组（点赞/收藏/下载）
│   └── 统计信息
├── JSON 预览区（Card）
│   ├── 区块标题
│   ├── 代码区域
│   └── 操作按钮（复制/下载）
└── 评论区域（Card）
    ├── 评论列表
    └── 发表评论表单
```

### 颜色方案

```css
/* 基础颜色 */
--surface: #FFFFFF
--surface-on: #1C1B1F
--surface-on-variant: #49454F
--primary: #2563EB
--outline: #E2E8F0

/* 交互颜色 */
--action-hover: bg-blue-50
--action-active: bg-blue-100
```

### 组件规范

#### 图片轮播
- M3 Elevated Card（shadow-md）
- 宽高比 16:9 或 4:3
- 轮播指示器清晰
- 点击放大支持

#### 操作按钮
```tsx
<div className="flex items-center gap-3">
  <button className="m3-btn-outlined">
    <Icon />
    <span>操作</span>
    <span className="text-surface-on-variant">数量</span>
  </button>
</div>
```

#### JSON 预览
```tsx
<pre className="bg-gray-50 border border-outline rounded-lg p-4 overflow-auto">
  <code className="text-body-small font-mono">
    {jsonContent}
  </code>
</pre>
```

## 技术实现

### 剧本详情页优化
**文件**: `app/scripts/[id]/page.tsx`

改动：
1. 添加面包屑导航
2. 图片轮播使用 M3 Elevated Card
3. 标题使用 Headline Large
4. 作者信息优化排版
5. 操作按钮使用 M3 Outlined Button
6. JSON 预览区域优化
7. 下载按钮使用 M3 Filled Button
8. 评论区域样式优化

## 性能要求

- 图片懒加载
- JSON 大文件分块显示
- 评论分页加载
- 操作响应 < 200ms

## 无障碍要求

- 图片有 alt 属性
- 按钮有 aria-label
- 轮播控制键盘可操作
- 代码区域可复制
- 评论表单有 label

## 成功指标

- ✅ 页面遵循 M3 设计系统
- ✅ 视觉风格统一
- ✅ 交互体验提升
- ✅ 响应式布局正常
- ✅ 无障碍访问符合 WCAG 2.1 AA
- ✅ 保持现有功能完整性

## 参考

- [Material Design 3](https://m3.material.io/)
- [项目宪法](../../CONSTITUTION.md)
- [核心页面 M3 优化](../003-pages-m3-redesign/)
