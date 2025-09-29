# Implementation Plan: 血染钟楼资源聚合与索引 MVP

**Branch**: `[001-collect-botc-resources]` | **Date**: 2025-09-29 | **Spec**: specs/001-collect-botc-resources/spec.md
**Input**: Feature specification from `/specs/001-collect-botc-resources/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
3. Fill the Constitution Check section based on the constitution
4. Evaluate Constitution Check
5. Execute Phase 0 → research.md
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
7. Re-evaluate Constitution Check
8. Plan Phase 2 → Describe task generation approach
9. STOP - Ready for /tasks
```

## Summary
集中收集与索引血染钟楼剧本 JSON 与图片，支持上传/下载、多图轮播、审核发布、门户与后台。管理员面板使用独立登录与会话（与门户分离）。新增注册/邮箱验证/重置密码流程。

## Technical Context
- Language: TypeScript (Node.js 20+)
- Framework: Next.js(App Router)
- Data: Prisma + SQLite(Dev) / PostgreSQL(Prod)
- Validation: Zod (+ JSON Schema 计划)
- Storage: 本地文件(Dev) / S3 兼容对象存储(Prod, MinIO)
- Email: SMTP（.env：SMTP_HOST/PORT/USER/PASS/FROM），Dev 可用本地捕获服务（如 MailHog）
- Tokens: 验证/重置 token 存 DB（字符串+过期时间），使用加盐随机串
- Testing: Vitest + Playwright（计划恢复）
- Deploy: Docker/Compose

## UI Design（Material 3 指南）
- 主题与色板：浅色为主，强调色用于主按钮与链接；暗色主题可选（后续）
- 排版与密度：标题/正文采用系统无衬线字体；页面栅格宽度 max-w-5xl，段落行高 ≥ 1.5
- 组件态：按钮/输入/卡片需具备 hover/focus/disabled/error 状态；错误提示统一样式
- 间距：区块间距 16–24px；表单项垂直间距 ≥ 8px；列表项内边距 ≥ 12px
- 可访问性：对比度 AA，表单控件 aria-label/aria-invalid；键盘可达
- 导航调整：门户导航仅保留“首页/剧本列表/上传”；“审核”入口仅在管理员侧可见（登录后进入后台）。管理员登录入口在门户顶部导航中隐藏，仅通过直达链接 `/admin/login` 访问。管理员面板采用独立布局：左侧为功能列表（用户管理、剧本列表管理、审核），右侧为功能内容区。
 - Auth 页面风格（已采纳玻璃拟态方案）：
   - 背景：`auth-hero` 渐变背景（from-sky-50 via-white to-indigo-50），铺满视窗
   - 卡片：`glass-card` 毛玻璃（backdrop-blur、白色半透明、轻阴影、圆角 16px）
   - 结构：单卡片内包含“注册表单 + 验证码输入/重发”，单邮箱输入不重复
   - 字体：`next/font` 在模块作用域以 `const` 方式加载（如 `Inter`），避免构建错误
   - 文案与可用性：主标题+副标题；按钮加载/禁用态，错误提示清晰，验证码输入为 6 位

## Constitution Check（门槛）
- 安全与隐私：上传类型/大小校验、鉴权下载、管理员独立会话、邮件链接一次性与过期
- 规格驱动与测试先行：补齐注册/验证/重置与核心 API 的契约与测试
- 契约与兼容：接口统一错误结构；破坏性变更版本化
- 审核与权限：草稿→待审→发布/驳回；后台可审计（落地中）
- 可观测与简洁：统一日志与错误码（下一阶段完善）
 - UI 统一：采用 Material 3 准则与玻璃拟态 Auth 风格；禁止在组件内部动态调用字体加载器

评估：当前实现基本遵循；测试、审计、S3 与邮件投递需补齐；UI 按 M3 执行。

## Project Structure（要点）
- app/：
  - 门户：`/`、`/scripts/**`、`/upload`、`/login`、`/register`、`/forgot`、`/reset/[token]`
  - 管理：`/admin/login`、`/admin/review`、`/admin/users`、`/admin/scripts`（管理员面板左侧菜单 + 右侧内容区）
- src/：
  - `auth/`：密码/会话/邮件发送器
  - `api/`：响应与校验助手
  - `storage/`：本地与 S3 适配（计划）
- prisma/：schema 与迁移（VerificationToken/PasswordResetToken）
- specs/：plan/spec/tasks/contracts 等文档

## Phase 0: Outline & Research
- 邮件服务与发信域名（发信速率/退信/黑名单）
- token 过期（建议：验证 24h、重置 2h），重放与并发防护
- 链接域名与多环境配置（本地/生产）

## Phase 1: Design & Contracts
- 上传（multipart）、审核（JSON）、列表/详情/下载、登录/管理员登录、注册/验证/重置 的契约与错误码
- 速率限制：注册/发信/忘记接口限流（IP+邮箱维度）

## Phase 2: Task Planning Approach
- 从 contracts/data-model 生成任务；TDD 顺序：测试→实现→回归

## Complexity Tracking
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|

## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete (/plan)
- [x] Phase 1: Design complete (/plan)
- [x] Phase 2: Task planning complete (/plan)
- [ ] Phase 3: Tasks generated (/tasks)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

## Next Focus
- 测试与 CI：补齐契约/集成/E2E，保障回归
- 存储：接入 S3/MinIO，统一本地/云端
- 安全：审计日志与限流策略落地
