# Spec: 个人中心页面 Material Design 3 优化

**ID**: 006-profile-m3-redesign  
**Created**: 2025-09-30  
**Status**: In Progress  
**Priority**: High

## 目标

按照 CONSTITUTION.md 中的 Material Design 3 规范，优化个人中心相关页面（我的资料、我的上传、我的收藏、讲述者认证）的视觉设计与交互体验，保持与其他页面一致的设计语言。

## 背景

门户页面和管理员后台已完成 M3 优化（规格 002-005），建立了完整的设计系统基础。个人中心页面需要应用相同的 M3 规范以确保整体视觉一致性。

## 范围

### 包含
- ✅ 我的资料页（/profile）
  - M3 表单样式
  - 头像上传优化
  - 密码修改表单
  
- ✅ 我的上传页（/my/uploads）
  - M3 卡片网格
  - 状态标识优化
  - 操作按钮优化

- ✅ 我的收藏页（/my/favorites）
  - M3 卡片网格
  - 空状态优化
  - 收藏操作优化

- ✅ 讲述者认证页（/profile/storyteller）
  - M3 表单样式
  - 文件上传优化
  - 提交反馈优化

### 不包含
- ❌ 个人主页（其他用户查看）
- ❌ 消息通知系统
- ❌ 个人设置高级选项

## 用户故事

### US-1: 用户资料管理
**作为** 用户  
**我想要** 在清晰的界面中查看和编辑个人资料  
**以便于** 保持信息更新

**验收标准**:
- 表单使用 M3 Text Field 样式
- 头像上传有清晰的预览
- 提交按钮使用 M3 Filled Button
- 成功/错误反馈清晰

### US-2: 我的上传管理
**作为** 创作者  
**我想要** 查看和管理我上传的剧本  
**以便于** 跟踪审核状态和管理内容

**验收标准**:
- 卡片使用 M3 Elevated Card 样式
- 状态标识清晰（待审核/已发布/已拒绝）
- 操作按钮明确
- 空状态友好

### US-3: 收藏管理
**作为** 用户  
**我想要** 查看我收藏的剧本  
**以便于** 快速访问喜欢的内容

**验收标准**:
- 卡片网格整齐
- 取消收藏操作方便
- 空状态引导用户

### US-4: 讲述者认证
**作为** 用户  
**我想要** 申请成为认证讲述者  
**以便于** 获得身份标识

**验收标准**:
- 表单清晰易用
- 文件上传有进度反馈
- 提交结果明确

## 设计规范

### 布局系统

#### 页面结构
```
Container (max-w-5xl, mx-auto, p-6)
├── 页面标题区
│   ├── Headline Medium 标题
│   └── Body Small 描述
└── 内容区（card）
    ├── 表单/列表/网格
    └── 操作按钮
```

### 颜色方案

```css
/* 基础颜色 */
--surface: #FFFFFF
--surface-on: #1C1B1F
--surface-on-variant: #49454F
--primary: #2563EB
--outline: #E2E8F0

/* 状态颜色 */
--success: bg-green-50 text-green-700 border-green-200
--warning: bg-yellow-50 text-yellow-700 border-yellow-200
--error: bg-red-50 text-red-700 border-red-200
--info: bg-blue-50 text-blue-700 border-blue-200
```

### 组件规范

#### 表单
```tsx
<div>
  <label className="block text-body-medium font-medium text-surface-on mb-2">
    字段名称
  </label>
  <input className="input" />
  <p className="text-body-small text-surface-on-variant mt-1">
    辅助说明
  </p>
</div>
```

#### 卡片
```tsx
<div className="card hover:shadow-md transition-shadow">
  <div className="card-body">
    <!-- 内容 -->
  </div>
</div>
```

#### 状态徽章
```tsx
<span className="inline-flex items-center px-2 py-1 rounded-full text-body-small font-medium bg-green-50 text-green-700 border border-green-200">
  已发布
</span>
```

## 技术实现

### 1. 我的资料页优化
**文件**: `app/profile/page.tsx`

改动：
1. 页面标题使用 Headline Medium
2. 表单使用 M3 Text Field 样式
3. 头像上传优化（预览 + 进度）
4. 提交按钮使用 m3-btn-filled
5. Toast 通知使用 M3 颜色

### 2. 我的上传页优化
**文件**: `app/my/uploads/page.tsx`

改动：
1. 页面标题结构优化
2. 卡片使用 M3 Elevated 样式
3. 状态徽章优化
4. 操作按钮使用 M3 样式
5. 空状态设计

### 3. 我的收藏页优化
**文件**: `app/my/favorites/page.tsx`

改动：
1. 页面标题优化
2. 卡片网格统一
3. 空状态优化
4. 取消收藏按钮优化

### 4. 讲述者认证页优化
**文件**: `app/profile/storyteller/page.tsx`

改动：
1. 表单样式统一
2. 文件上传优化
3. 等级选择优化
4. 提交反馈清晰

## 性能要求

- 保持现有性能
- 头像上传有进度反馈
- 表单验证即时
- 操作响应 < 300ms

## 无障碍要求

- 所有表单有 label
- 文件上传有 aria-label
- 按钮有明确的文字/图标
- 状态徽章有文字内容
- 键盘可导航

## 成功指标

- ✅ 所有页面遵循 M3 设计系统
- ✅ 视觉风格统一
- ✅ 表单易用性提升
- ✅ 无 TypeScript/ESLint 错误
- ✅ 响应式布局正常
- ✅ 无障碍访问符合 WCAG 2.1 AA

## 参考

- [Material Design 3](https://m3.material.io/)
- [项目宪法](../../CONSTITUTION.md)
- [管理员界面 M3 优化](../005-admin-m3-redesign/)
