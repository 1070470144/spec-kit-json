# Tasks: 血染钟楼资源聚合与索引 MVP

**Input**: Design documents from `/specs/001-collect-botc-resources/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions (Next.js App Router, TS)
- API（集合）: `xueran-juben-project/app/api/scripts/route.ts`
- API（详情）: `xueran-juben-project/app/api/scripts/[id]/route.ts`
- API（动作）: `xueran-juben-project/app/api/scripts/[id]/submit/route.ts`
- API（审核）: `xueran-juben-project/app/api/scripts/[id]/review/route.ts`
- API（下载）: `xueran-juben-project/app/api/scripts/[id]/download/route.ts`
- Auth: `xueran-juben-project/app/api/auth/login/route.ts`
- Prisma schema: `xueran-juben-project/prisma/schema.prisma`
- Tests: `xueran-juben-project/tests/**`

## Phase 3.1: Setup
- [ ] T001 Create project structure per plan in `xueran-juben-project/` (app/, prisma/, tests/, docker/)
- [ ] T002 Initialize Next.js (TypeScript, App Router, Tailwind) with npm scripts
- [ ] T003 [P] Configure ESLint & Prettier rules and scripts
- [ ] T004 Add Prisma; create `prisma/schema.prisma` baseline and `.env.local`
- [ ] T005 [P] Add storage interface `src/storage/Storage.ts` + local adapter `src/storage/local.ts`
- [ ] T006 Set up NextAuth config `src/auth/config.ts` (credentials provider, session strategy)
- [ ] T007 [P] Add Dockerfile (`docker/Dockerfile`) and Compose (`docker-compose.yml`) + `.env.docker`
- [ ] T008 [P] Add Zod, Vitest, Playwright; init `vitest.config.ts` and `playwright.config.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
- [ ] T009 [P] Contract test POST /api/auth/login in `tests/contract/api.auth.login.test.ts`
- [ ] T010 [P] Contract test POST /api/scripts in `tests/contract/api.scripts.post.test.ts`
- [ ] T011 [P] Contract test GET /api/scripts in `tests/contract/api.scripts.list.test.ts`
- [ ] T012 [P] Contract test GET /api/scripts/{id} in `tests/contract/api.scripts.get.test.ts`
- [ ] T013 [P] Contract test POST /api/scripts/{id}/submit in `tests/contract/api.scripts.submit.test.ts`
- [ ] T014 [P] Contract test POST /api/scripts/{id}/review in `tests/contract/api.scripts.review.test.ts`
- [ ] T015 [P] Contract test GET /api/scripts/{id}/download in `tests/contract/api.scripts.download.test.ts`
- [ ] T016 [P] Integration test auth flow in `tests/integration/auth.flow.test.ts`
- [ ] T017 [P] Integration test upload JSON+images & schema errors in `tests/integration/upload.flow.test.ts`
- [ ] T018 [P] Integration test review approve/reject & audit in `tests/integration/review.flow.test.ts`
- [ ] T019 [P] Integration test public detail & carousel & download in `tests/integration/detail.flow.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T020 [P] Prisma models User/Role in `prisma/schema.prisma` + migrations
- [ ] T021 [P] Prisma models Script/ScriptJSON/ImageAsset/Review/AuditLog/DownloadEvent/Source
- [ ] T022 [P] NextAuth credentials provider `src/auth/config.ts` + password hashing util
- [ ] T023 Implement POST /api/auth/login in `app/api/auth/login/route.ts`
- [ ] T024 Implement upload handler `src/upload/handler.ts` (MIME/size checks, image meta)
- [ ] T025 Implement POST /api/scripts in `app/api/scripts/route.ts` (create Script + ScriptJSON)
- [ ] T026 Implement GET /api/scripts in `app/api/scripts/route.ts` (filters, pagination)
- [ ] T027 Implement GET /api/scripts/[id] in `app/api/scripts/[id]/route.ts` (detail + images)
- [ ] T028 Implement POST /api/scripts/{id}/submit in `app/api/scripts/[id]/submit/route.ts`
- [ ] T029 Implement POST /api/scripts/{id}/review in `app/api/scripts/[id]/review/route.ts`
- [ ] T030 Implement GET /api/scripts/{id}/download in `app/api/scripts/[id]/download/route.ts`
- [ ] T031 [P] Implement audit logger `src/audit/logger.ts` + middleware wiring
- [ ] T032 [P] Implement rate limiting `src/middleware/rateLimit.ts` and apply to auth/upload/download

## Phase 3.4: Integration
- [ ] T033 Storage provider abstraction: add S3 adapter `src/storage/s3.ts` (MinIO-compatible)
- [ ] T034 Wire endpoints to storage provider and generate signed URLs for public display
- [ ] T035 Structured logging with request id `src/logging/index.ts` and integrate in API routes

## Phase 3.5: Polish
- [ ] T036 [P] Unit tests for validation (Zod schemas, upload validator) in `tests/unit/validation.test.ts`
- [ ] T037 [P] E2E: upload→review→publish→download in `tests/e2e/core.flow.spec.ts`
- [ ] T038 [P] Seed script `scripts/seed.ts` for demo users/roles/scripts/images`
- [ ] T039 [P] Docs: update `specs/.../quickstart.md` with commands + API overview `docs/api.md`
- [ ] T040 Performance smoke tests: 列表 p95 < 200ms，上传限制验证 in `tests/perf/smoke.test.ts`

## Dependencies
- Tests (T009–T019) before implementation (T020–T035)
- T020 blocks T021, T025–T030
- T022 blocks T023
- Upload handler (T024) blocks T025
- Storage provider (T033) blocks T034

## Parallel Example
```
# Launch T009–T015 (contract) and T016–T019 (integration) together:
Task: "Contract test POST /api/scripts in tests/contract/api.scripts.post.test.ts"
Task: "Contract test GET /api/scripts in tests/contract/api.scripts.list.test.ts"
Task: "Integration test auth flow in tests/integration/auth.flow.test.ts"
Task: "Integration test upload flow in tests/integration/upload.flow.test.ts"
```

## Validation Checklist
- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task

## Next Sprint (Top 10)
- [ ] NS-01 引入 Zod 请求体验证与统一错误响应助手，覆盖现有 API（auth/scripts/images）。
- [ ] NS-02 集成 JSON Schema 校验（剧本 JSON），返回字段定位与可读错误。
- [ ] NS-03 会话与 RBAC 中间件：统一保护 `/admin/**` 与敏感 `/api/**`（审核/上传/下载）。
- [ ] NS-04 审计落地：登录/上传/审核/下载写入 `AuditLog`，添加查询工具方法。
- [ ] NS-05 限流落地：在登录、上传、下载端点应用速率限制与配额（基于内存或KV）。
- [ ] NS-06 S3 适配器 `src/storage/s3.ts`（MinIO 兼容），基于环境变量在本地/云端切换。
- [ ] NS-07 图片上传校验完善：MIME 白名单、单文件/批量大小限制、最大张数、错误提示。
- [ ] NS-08 契约/集成测试补齐并转绿（T009–T019）；新增端点测试样例与 CI 脚本占位。
- [ ] NS-09 E2E 冒烟：Playwright 脚本覆盖“创建→上传→提交→审核→下载”全链路。
- [ ] NS-10 详情页操作组件：提交审核、上传图片（多图）、管理员审核通过/驳回 UI 与反馈。

## Upload UI 改造（新增）
- [ ] U001 更新前端 `app/upload/page.tsx`：改为选择文件（input type=file）上传 JSON（单文件）+ 图片（0-3），新增“名字（标题）”“作者”输入。
- [ ] U002 将 `/api/scripts` 改为接收 `multipart/form-data`：字段 `jsonFile`、`images[]`、`title`、`authorName`。
- [ ] U003 校验：JSON 文件类型与体积上限、图片类型（JPG/PNG/WebP）、单张 ≤10MB、总数 ≤3。
- [ ] U004 服务端解析 JSON 文件内容，执行 schema 校验，失败返回字段定位错误。
- [ ] U005 将 `authorName` 写入 `Script`（新增字段），并与登录用户做最小一致性检查（可不同但做审计）。
- [ ] U006 成功后返回 `id`，前端跳转到 `/scripts/{id}`；失败在表单显示统一错误信息。

## Admin 独立登录（新增）
- [ ] A001 创建管理员登录页 `app/admin/login/page.tsx`（独立表单与成功跳转 `/admin/review`）。
- [ ] A002 新增管理员登录端点 `app/api/admin/auth/login/route.ts`（独立 Cookie 名：`admin_session`）。
- [ ] A003 新增管理员登出端点 `app/api/admin/auth/logout/route.ts`。
- [ ] A004 中间件/守卫：仅 `admin_session` 有效会话可访问 `/admin/**`；门户 `session` 不具管理员权限。
- [ ] A005 更新导航与入口：仅在检测到管理员会话时显示“审核”快捷入口（或在未登录时显示“管理员登录”）。
- [ ] A006 契约：在 `contracts/README.md` 增加 Admin 登录/登出接口说明与错误码。
- [ ] A007 测试：契约测试 `tests/contract/api.admin.login.test.ts` 与集成测试 `tests/integration/admin.guard.test.ts`。
- [ ] A008 种子/角色：确保存在管理员账号（admin@example.com），文档化如何升级普通账号为管理员（临时策略或角色表）。

## Auth（注册/邮箱验证/重置）
- [ ] AU01 Prisma：新增表 `VerificationToken(id, userId, token, expiresAt)`、`PasswordResetToken(id, userId, token, expiresAt)`
- [ ] AU02 API：`POST /api/auth/register`（创建用户并发验证邮件）
- [ ] AU03 API：`POST /api/auth/email/send-verification`（登录后或未验证用户可触发，限流）
- [ ] AU04 API：`GET /api/auth/email/verify?token=...`（校验并标记已验证）
- [ ] AU05 API：`POST /api/auth/password/forgot`（发重置邮件，限流）
- [ ] AU06 API：`POST /api/auth/password/reset`（携带 token 与新密码，完成重置）
- [ ] AU07 Pages：`/register`、`/verify/[token]`、`/forgot`、`/reset/[token]` 表单与提示
- [ ] AU08 邮件发送：`src/auth/mailer.ts`（SMTP/本地捕获），模板与链接生成
- [ ] AU09 速率限制：注册/发信/忘记接口（IP+邮箱），统一错误码 `RATE_LIMITED`
- [ ] AU10 测试：契约/集成覆盖注册→验证、忘记→重置 happy path 与失败场景

## UI（Material 3）与导航调整
- [ ] UI01 建立主题与色板（Tailwind 变量/类），按钮/输入/卡片的 hover/focus/disabled/error 状态
- [ ] UI02 门户导航移除“审核”，保留“首页/剧本列表/上传/登录/注册”
- [ ] UI03 管理端导航：`/admin/login` 未登录时可见，“审核”登录后可见
- [ ] UI04 列表与详情页样式美化（卡片、轮播、留白）
- [ ] UI05 表单页（上传/登录/注册/忘记/重置）间距与错误提示统一
- [ ] UI06 可访问性：对比度、aria 属性、键盘可达
