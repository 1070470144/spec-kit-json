# 项目宪法 (Project Constitution)

本文档定义项目的核心开发规范，所有功能实现必须遵守。

## UI 统一规范：Material Design 3

**所有 UI 组件必须遵循 Material Design 3 设计系统。**

### 核心原则
- **色彩**：使用 M3 颜色令牌（primary/secondary/tertiary/error/surface/background）
- **排版**：Display/Headline/Title/Body/Label 五级系统
- **形状**：圆角 4px/8px/12px/16px/28px
- **高度**：使用阴影表现层级（elevation-1 到 elevation-5）
- **无障碍**：对比度 ≥ 4.5:1（WCAG AA），支持键盘导航
- **主题**：支持浅色/深色模式

### 组件规范
- **按钮**：Filled（主操作）/ Outlined（次要）/ Text（低优先级）
- **输入**：Filled / Outlined，明确的 error/focus/disabled 状态
- **卡片**：Elevated（默认）/ Filled / Outlined
- **动效**：100ms（快速）/ 200-300ms（标准）/ 400-500ms（慢速）

### 实施要求
1. 在 `tailwind.config.ts` 中定义 M3 设计令牌
2. 使用语义化颜色名，禁止硬编码颜色值
3. 所有组件需有 hover/focus/disabled/error 状态
4. UI 相关 PR 必须说明设计规范符合性

**参考**：https://m3.material.io/

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

**版本**: 1.0.0 | **更新**: 2025-09-30