# 004: 认证页面 Material Design 3 优化

## 📋 规格概览

按照项目宪法中的 Material Design 3 规范，优化登录、注册、忘记密码和重置密码页面，在保持玻璃拟态特色的同时应用 M3 设计系统。

**状态**: Draft → Ready for Implementation  
**优先级**: High  
**预估工作量**: ~6.5 hours  
**分支**: `004-auth-m3-redesign`  
**依赖**: 规格 002 (首页)、003 (核心页面)

## 🎯 目标

1. ✅ 在保持玻璃拟态风格的同时应用 M3 规范
2. ✅ 统一认证页面的视觉风格
3. ✅ 优化表单输入和按钮样式
4. ✅ 统一 Toast 反馈样式

## 📁 文档结构

```
004-auth-m3-redesign/
├── README.md          # 本文档（概览）
├── spec.md            # 详细规格（用户故事、设计规范）
├── plan.md            # 实施计划（技术上下文、M3 映射）
└── tasks.md           # 任务清单（8 个任务，可并行）
```

## 🎨 设计要点

### 布局结构（保持特色）

```tsx
// 玻璃拟态布局（已有，保持）
<div className="auth-hero">
  {/* 渐变背景 */}
  <div className="glass-card w-full max-w-xl">
    {/* 玻璃效果 + M3 内部元素 */}
  </div>
</div>
```

### 登录页 (/login)

**保持**:
- ✅ 玻璃拟态背景和容器
- ✅ 居中布局
- ✅ 渐变背景（from-sky-50 via-white to-indigo-50）

**优化**:
- 📝 **标题**: Display Small (36px)
- 📝 **表单**: M3 Text Field
- 🔘 **按钮**: M3 Filled (登录) + Outlined (忘记) + Text (注册)
- 💬 **反馈**: M3 Toast 样式

### 注册页 (/register)

**优化**:
- 📝 **标题**: Display Small
- 📝 **Toast**: 统一样式（rounded-sm + body-small）
- 🔘 **发送验证码**: M3 Outlined + 倒计时
- 🔘 **注册按钮**: M3 Filled
- ⚠️ **关闭提示**: M3 警告样式

### 忘记/重置密码页

**升级**:
- 🎨 **布局**: container-page → auth-hero + glass-card
- 📝 **标题**: Headline Small (24px)
- 📝 **表单**: M3 Text Field + Label
- 🔘 **按钮**: M3 Filled + Text
- 💬 **反馈**: Toast 样式统一

## 🛠️ 技术实现

### 页面结构

```
登录页 (login/page.tsx)
├── Auth Hero 背景（保持）
├── Glass Card 容器（保持）
└── M3 表单元素（优化）
    ├── Display Small 标题
    ├── M3 Text Field
    └── M3 Buttons

注册页 (register/page.tsx)
├── Auth Hero + Glass Card（保持）
├── M3 Toast（统一样式）
└── M3 表单 + 验证码流程

忘记/重置页
├── Auth Hero + Glass Card（新增）
├── M3 表单
└── M3 Buttons
```

## 📝 任务清单

### Phase 1: 页面优化 (T001-T004) [可并行]
- **T001**: 登录页优化
- **T002**: 注册页优化
- **T003**: 忘记密码页优化（布局升级）
- **T004**: 重置密码页优化（布局升级）

### Phase 2: 验证与优化 (T005-T008) [可并行]
- **T005**: 响应式优化
- **T006**: 无障碍增强
- **T007**: 代码质量检查
- **T008**: 视觉一致性检查

## ✅ 验收标准

### 设计规范
- [ ] 所有页面遵循 M3 设计系统
- [ ] 玻璃拟态效果保持
- [ ] 按钮样式与其他页面一致
- [ ] Toast 样式统一
- [ ] 排版系统一致

### 功能完整性
- [ ] 登录流程正常
- [ ] 注册 + 验证码流程正常
- [ ] 忘记密码流程正常
- [ ] 重置密码流程正常
- [ ] 表单验证正常
- [ ] 错误提示清晰

### 无障碍
- [ ] 所有输入有关联 label
- [ ] 按钮禁用状态明确
- [ ] 键盘导航正常
- [ ] Focus 状态清晰

### 性能
- [ ] 客户端渲染流畅
- [ ] 无 linter 错误
- [ ] 认证流程无延迟

## 🚀 快速开始

```bash
# 1. 创建功能分支
git checkout -b 004-auth-m3-redesign

# 2. 按顺序执行任务
# T001-T004: 优化各页面（可并行）
# T005-T008: 测试与验证（可并行）

# 3. 验证
npm run build
npm run lint
npm run dev
```

## 🎯 设计对比

### 优化前
- 简单的表单样式
- 不统一的按钮
- 基础的错误提示
- 忘记/重置页布局简单

### 优化后
- M3 表单元素
- 统一的 M3 按钮（Filled/Outlined/Text）
- 统一的 Toast 反馈
- 所有页面玻璃拟态布局
- 清晰的排版层次

## 📚 参考资源

- [Material Design 3 - Text Fields](https://m3.material.io/components/text-fields)
- [Material Design 3 - Buttons](https://m3.material.io/components/buttons)
- [Material Design 3 - Snackbar](https://m3.material.io/components/snackbar)
- [项目宪法](../../CONSTITUTION.md)
- [首页 M3 优化](../002-homepage-m3-redesign/)
- [核心页面 M3 优化](../003-pages-m3-redesign/)

## 🔗 相关规格

- **前置**: [002 - 首页](../002-homepage-m3-redesign/), [003 - 核心页面](../003-pages-m3-redesign/)
- **后续**: 邮箱验证页、管理员登录页（待创建）

## 📊 预估工作量

| 阶段 | 任务 | 时间 |
|------|------|------|
| 页面优化 | T001-T004 | 4.5h |
| 验证优化 | T005-T008 | 2h |
| **总计** | - | **~6.5h** |

## 🎨 视觉要点

### 保持的特色
- ✅ 玻璃拟态效果（auth-hero + glass-card）
- ✅ 渐变背景
- ✅ 毛玻璃质感
- ✅ 居中布局

### 优化的元素
- 📝 标题排版（Display/Headline）
- 📝 表单样式（M3 Text Field）
- 🔘 按钮样式（M3 Filled/Outlined/Text）
- 💬 Toast 反馈（统一样式）
- 🏷️ Label 样式（M3 Body Medium）

## 🔄 后续计划

1. 邮箱验证页 M3 优化
2. 管理员登录页 M3 优化
3. 密码强度指示器
4. 社交登录集成（如需要）
