# Spec: 认证页面 Material Design 3 优化

**ID**: 004-auth-m3-redesign  
**Created**: 2025-09-30  
**Status**: Draft  
**Priority**: High

## 目标

按照 CONSTITUTION.md 中的 Material Design 3 规范，优化登录、注册、忘记密码和重置密码页面的视觉设计与交互体验，保持与其他页面一致的设计语言，同时保留玻璃拟态风格特色。

## 背景

首页、剧本列表、排行榜和上传页已完成 M3 优化（规格 002、003），建立了设计系统基础。认证页面已采用玻璃拟态（auth-hero + glass-card）风格，需要在保持该特色的同时应用 M3 规范。

当前问题：
1. 登录/注册页：已有玻璃拟态，但表单元素和按钮需要 M3 优化
2. 忘记/重置密码页：使用简单布局，缺少视觉吸引力
3. 反馈提示：Toast 样式不统一
4. 缺少明确的表单验证反馈

## 范围

### 包含
- ✅ 登录页（/login）
  - M3 表单样式（保持玻璃拟态背景）
  - M3 按钮样式
  - 优化错误提示

- ✅ 注册页（/register）
  - M3 表单样式
  - 验证码流程优化
  - Toast 通知统一

- ✅ 忘记密码页（/forgot）
  - 应用玻璃拟态布局
  - M3 表单和按钮
  - 优化反馈提示

- ✅ 重置密码页（/reset/[token]）
  - 应用玻璃拟态布局
  - M3 表单和按钮
  - 优化成功/失败反馈

### 不包含
- ❌ 邮箱验证页（/verify/[token]）（下一阶段）
- ❌ 社交登录（未计划）
- ❌ 双因素认证（未计划）

## 用户故事

### US-1: 用户登录
**作为** 用户  
**我想要** 在美观的界面中登录  
**以便于** 访问系统功能

**验收标准**:
- 使用玻璃拟态背景（auth-hero + glass-card）
- 表单使用 M3 Text Field 样式
- 登录按钮使用 M3 Filled Button
- 辅助按钮使用 M3 Text/Outlined Button
- 错误提示清晰友好
- 支持键盘导航（Enter 提交）

### US-2: 用户注册
**作为** 新用户  
**我想要** 便捷地创建账户  
**以便于** 使用平台功能

**验收标准**:
- 使用玻璃拟态布局
- 表单字段清晰标注（必填/可选）
- 验证码发送有明确反馈
- 冷却时间倒计时清晰
- Toast 通知使用 M3 Snackbar 样式
- 成功后自动跳转

### US-3: 密码找回
**作为** 忘记密码的用户  
**我想要** 通过邮箱重置密码  
**以便于** 重新访问账户

**验收标准**:
- 忘记密码页使用玻璃拟态布局
- 重置密码页使用玻璃拟态布局
- 表单简洁易用
- 发送/重置反馈明确
- 成功后引导登录

## 设计规范

### 布局系统

#### Auth Hero 背景
- 保持现有 `.auth-hero` 样式（渐变背景 + 居中）
- 渐变：`from-sky-50 via-white to-indigo-50`
- 最小高度：`min-h-screen`

#### Glass Card 容器
- 保持现有 `.glass-card` 样式（玻璃拟态效果）
- 背景：`bg-white/40 backdrop-blur-md`
- 边框：`border-white/60`
- 阴影：`shadow-[0_10px_30px_rgba(2,6,23,0.08)]`
- 圆角：`rounded-2xl` (16px，M3 Large)
- 最大宽度：`max-w-xl` (36rem)

### 排版系统

```
登录/注册页标题: Display Small (36px)
忘记/重置页标题: Headline Small (24px)
副标题: Body Medium (14px)
表单 Label: Body Medium + font-medium
输入框: Body Large (16px)
按钮: Label Large (14px, 500)
错误提示: Body Small (12px)
Toast: Body Small (12px)
```

### 表单元素

#### Text Field
- 基础样式：现有 `.input`
- Focus: ring-2 ring-primary
- Error: border-error focus:ring-error
- Placeholder: text-surface-on-variant

#### Button
- **Filled Button**: M3 Filled（登录/注册主按钮）
- **Outlined Button**: M3 Outlined（忘记密码、返回）
- **Text Button**: M3 Text（去登录/去注册）

### 颜色方案

```css
/* 背景（保持现有） */
auth-hero: gradient from-sky-50 via-white to-indigo-50
glass-card: white/40 + backdrop-blur

/* 表单元素（M3） */
Label: surface-on
Input: surface + outline border
Input Focus: primary ring
Input Error: error border

/* 按钮（M3） */
Primary: bg-primary text-primary-on
Outlined: border-outline text-surface-on
Text: text-primary

/* 反馈（M3） */
Success: green-50/200/700
Error: red-50/200/700
Info: blue-50/200/700
```

### Toast/Snackbar 样式

```tsx
<div className="rounded-sm border px-4 py-3 text-body-small">
  {/* Success */}
  className="bg-green-50 border-green-200 text-green-700"
  
  {/* Error */}
  className="bg-red-50 border-red-200 text-red-700"
  
  {/* Info */}
  className="bg-blue-50 border-blue-200 text-blue-700"
</div>
```

## 技术实现

### 登录页优化
**文件**: `app/login/page.tsx`

改动：
1. 标题：`text-3xl font-semibold` → `text-display-small text-surface-on`
2. 副标题：`.subtitle` → `text-body-medium text-surface-on-variant`
3. Label：`text-sm font-medium` → `text-body-medium font-medium text-surface-on`
4. 登录按钮：`btn btn-primary` → `m3-btn-filled`
5. 忘记密码：`btn btn-outline` → `m3-btn-outlined`
6. 去注册：`btn` → `m3-btn-text`
7. 错误提示：`.muted` → `text-body-small text-error` + border + bg

### 注册页优化
**文件**: `app/register/page.tsx`

改动：
1. 标题：`text-3xl font-semibold` → `text-display-small text-surface-on`
2. Toast：圆角 `rounded-lg` → `rounded-sm`，字体 `text-sm` → `text-body-small`
3. Label：`text-sm font-medium` → `text-body-medium font-medium text-surface-on`
4. 发送按钮：`btn btn-outline` → `m3-btn-outlined`
5. 注册按钮：`btn btn-primary` → `m3-btn-filled`
6. 去登录：`btn` → `m3-btn-text`
7. 关闭提示：优化样式，使用 M3 颜色

### 忘记密码页优化
**文件**: `app/forgot/page.tsx`

改动：
1. 布局：`container-page section` → `auth-hero + glass-card`
2. 标题：`text-2xl font-semibold` → `text-headline-small text-surface-on`
3. 添加副标题和说明
4. Label：添加明确的 label
5. 发送按钮：`btn btn-primary` → `m3-btn-filled`
6. 返回按钮：`btn btn-outline` → `m3-btn-text`
7. 反馈提示：Toast 样式

### 重置密码页优化
**文件**: `app/reset/[token]/page.tsx`

改动：
1. 布局：`container-page section` → `auth-hero + glass-card`
2. 标题：`text-2xl font-semibold` → `text-headline-small text-surface-on`
3. 添加副标题和说明
4. Label：添加明确的 label
5. 重置按钮：`btn btn-primary` → `m3-btn-filled`
6. 去登录：`btn btn-outline` → `m3-btn-text`
7. 反馈提示：Toast 样式

## 性能要求

- 客户端渲染（用户交互）
- 表单验证即时反馈
- Toast 动画流畅（3s 自动消失）
- 按钮禁用状态明确

## 无障碍要求

- 所有输入框有关联 label（id/htmlFor）
- 按钮有明确的禁用状态
- 错误提示有 role="alert"
- 键盘导航：Tab 遍历，Enter 提交
- Focus 状态清晰可见
- Toast 通知可被屏幕阅读器识别

## 成功指标

- ✅ 所有认证页面遵循 M3 设计系统
- ✅ 保持玻璃拟态特色风格
- ✅ 视觉风格与其他页面一致（按钮、排版）
- ✅ 无 TypeScript/ESLint 错误
- ✅ 响应式布局正常
- ✅ 无障碍访问符合 WCAG 2.1 AA
- ✅ 表单验证反馈清晰

## 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 玻璃拟态与 M3 样式冲突 | 低 | 低 | 保持背景样式，仅优化内部元素 |
| 表单验证逻辑复杂 | 中 | 中 | 保持现有逻辑，仅优化视觉 |
| Toast 多处使用不统一 | 中 | 低 | 统一 Toast 组件样式 |

## 未来增强

- 密码强度指示器
- 邮箱格式实时验证
- 社交登录集成
- 记住我功能
- 登录历史记录

## 参考

- [Material Design 3](https://m3.material.io/)
- [M3 Components - Text Fields](https://m3.material.io/components/text-fields)
- [M3 Components - Buttons](https://m3.material.io/components/buttons)
- [M3 Components - Snackbar](https://m3.material.io/components/snackbar)
- [项目宪法](../../CONSTITUTION.md)
- [首页 M3 优化](../002-homepage-m3-redesign/spec.md)
- [核心页面 M3 优化](../003-pages-m3-redesign/spec.md)
