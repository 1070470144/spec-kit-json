# Implementation Plan: 认证页面 Material Design 3 优化

**Branch**: `[004-auth-m3-redesign]` | **Date**: 2025-09-30 | **Spec**: specs/004-auth-m3-redesign/spec.md

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
2. Fill Technical Context
3. Fill Constitution Check section
4. Evaluate Constitution Check
5. Execute Phase 0 → research.md (optional)
6. Execute Phase 1 → contracts, data-model.md
7. Re-evaluate Constitution Check
8. Plan Phase 2 → Task generation approach
9. STOP - Ready for /tasks
```

## Summary
按照 Material Design 3 规范优化登录、注册、忘记密码和重置密码页面。在保持玻璃拟态（auth-hero + glass-card）特色的同时，应用 M3 表单、按钮和排版系统，确保与其他页面（规格 002、003）的视觉一致性。

## Technical Context
- Language: TypeScript (Node.js 20+)
- Framework: Next.js (App Router, Client Components)
- UI: React + Tailwind CSS + Material 3 Design Tokens（已在 002/003 中配置）
- Auth Flow: 邮箱/密码 + 验证码（注册）
- Styling: 玻璃拟态背景 + M3 内部元素
- A11y: WCAG 2.1 AA, semantic HTML, ARIA labels

## UI Design (Material 3 Implementation)

### 布局结构（保持现有）
```tsx
<div className="auth-hero">
  {/* 渐变背景：from-sky-50 via-white to-indigo-50 */}
  <div className="glass-card w-full max-w-xl">
    {/* 玻璃拟态：bg-white/40 backdrop-blur-md */}
    <div className="p-6 space-y-6">
      {/* M3 内部元素 */}
    </div>
  </div>
</div>
```

### 登录页 (/login)

#### 排版
- 标题: `text-display-small` (36px) instead of `text-3xl`
- 副标题: `text-body-medium text-surface-on-variant`
- Label: `text-body-medium font-medium text-surface-on`

#### 按钮
- 登录: `m3-btn-filled`
- 忘记密码: `m3-btn-outlined`
- 去注册: `m3-btn-text`

### 注册页 (/register)

#### 特殊元素
- Toast: `rounded-sm` + `text-body-small` (统一样式)
- 发送验证码: `m3-btn-outlined` + disabled 状态
- 冷却倒计时: 显示在按钮内
- 关闭提示: M3 警告样式（黄色）

### 忘记/重置密码页

#### 布局升级
- 从 `container-page` → `auth-hero + glass-card`
- 统一玻璃拟态风格

#### 元素
- 标题: `text-headline-small`
- 按钮: `m3-btn-filled` + `m3-btn-text`
- Toast: 统一样式

## Constitution Check (门槛)

### ✅ Material 3 统一
- 所有按钮使用 M3 样式（Filled/Outlined/Text）
- 所有表单输入使用 M3 Text Field
- 所有排版遵循 M3 类型系统
- Toast 通知使用统一的 M3 Snackbar 样式
- 颜色使用 M3 令牌（primary/surface/error）

### ✅ 无障碍
- 所有输入框有关联 label（id/htmlFor）
- 按钮禁用状态有 aria-disabled
- 错误提示可被屏幕阅读器识别
- 键盘导航（Tab 遍历，Enter 提交）
- Focus 状态清晰

### ✅ 性能
- 客户端组件（用户交互需求）
- 无额外第三方库
- 表单验证即时反馈

### ✅ 代码质量
- TypeScript 严格模式
- 保持现有认证逻辑
- 仅优化视觉呈现

评估：符合宪法要求，可执行。

## Project Structure (相关文件)

```
xueran-juben-project/
├── app/
│   ├── login/
│   │   └── page.tsx                 # 需优化
│   ├── register/
│   │   └── page.tsx                 # 需优化
│   ├── forgot/
│   │   └── page.tsx                 # 需优化（布局升级）
│   ├── reset/
│   │   └── [token]/
│   │       └── page.tsx             # 需优化（布局升级）
│   └── globals.css                  # M3 样式已配置
├── tailwind.config.ts               # M3 令牌已配置
└── specs/004-auth-m3-redesign/
    ├── spec.md
    ├── plan.md (本文档)
    └── tasks.md (待生成)
```

## Phase 0: Research (Completed in Spec)

### 设计决策
- **保持玻璃拟态**: 认证页面的特色，区别于其他页面
- **统一按钮样式**: 与其他页面保持一致（M3 Filled/Outlined/Text）
- **统一 Toast**: 所有反馈通知使用相同样式
- **优化布局**: 忘记/重置密码页升级到玻璃拟态布局

### M3 元素映射
| 页面元素 | M3 组件 | Tailwind 类 |
|---------|---------|------------|
| 登录/注册标题 | Display Small | `text-display-small` |
| 忘记/重置标题 | Headline Small | `text-headline-small` |
| 副标题 | Body Medium | `text-body-medium text-surface-on-variant` |
| Label | Body Medium | `text-body-medium font-medium` |
| Input | Text Field | `.input` (已有) |
| 主按钮 | Filled Button | `m3-btn-filled` |
| 次要按钮 | Outlined Button | `m3-btn-outlined` |
| 文本按钮 | Text Button | `m3-btn-text` |
| Toast | Snackbar | 自定义，统一样式 |

## Phase 1: Design & Contracts

### 无新增组件
本次优化主要是应用 M3 样式到现有页面，无需创建新组件。

### Toast 组件统一
建议提取为共享组件（可选，本次可内联）：
```tsx
// 统一的 Toast 样式
<div className={`rounded-sm border px-4 py-3 text-body-small ${
  type === 'success' 
    ? 'bg-green-50 border-green-200 text-green-700' 
    : type === 'error' 
    ? 'bg-red-50 border-red-200 text-red-700' 
    : 'bg-blue-50 border-blue-200 text-blue-700'
}`}>
  {text}
</div>
```

## Phase 2: Task Planning Approach

### 任务生成策略
1. **Page Tasks**: 逐页面优化
   - 登录页（M3 样式应用）
   - 注册页（M3 样式 + Toast 统一）
   - 忘记密码页（布局升级 + M3 样式）
   - 重置密码页（布局升级 + M3 样式）
2. **Polish Tasks**: 无障碍、响应式、代码质量检查

### 任务顺序
- 登录 → 注册 → 忘记 → 重置 → 验证
- 可并行（不同文件）

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
- 实施 M3 认证页面优化
- 验证视觉一致性与功能完整性
