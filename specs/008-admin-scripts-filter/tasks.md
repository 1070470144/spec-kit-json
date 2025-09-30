# Tasks: 管理员剧本列表状态筛选增强

**Input**: Design documents from `/specs/008-admin-scripts-filter/`
**Type**: Feature Enhancement
**Priority**: High

## Format: `[ID] Description`

## Phase 1: 核心实现

- [ ] T001 修改 `xueran-juben-project/app/admin/scripts/page.tsx`
  - 定义状态配置数组：
    ```typescript
    const states = [
      { value: 'pending', label: '待审核' },
      { value: 'published', label: '已通过' },
      { value: 'rejected', label: '已拒绝' },
      { value: 'abandoned', label: '已废弃' },
    ]
    ```
  - 修改默认状态：`const state = sp?.state || 'pending'`
  - 替换筛选按钮组为 map 渲染
  - 优化空状态提示文案（根据当前状态）
  - 确保分页链接包含 state 参数

## Phase 2: 测试验证

- [ ] T002 功能测试
  - 测试默认显示待审核
  - 测试切换到已通过
  - 测试切换到已拒绝
  - 测试切换到已废弃
  - 测试分页保持筛选状态
  - 测试空状态显示

- [ ] T003 代码质量检查
  - 运行 `npm run lint`
  - 运行 `npx tsc --noEmit`
  - 确保无错误

## Dependencies

```
T001 → T002 → T003
```

## Validation Checklist

- [ ] 支持 4 种状态筛选
- [ ] 默认显示待审核
- [ ] 筛选按钮使用 M3 Segmented Button
- [ ] 空状态提示正确
- [ ] 分页保持筛选状态
- [ ] 无 TypeScript/ESLint 错误

## 预估工作量

| 任务 | 预估时间 | 复杂度 |
|------|---------|--------|
| T001 核心实现 | 30 min | 低 |
| T002 功能测试 | 15 min | 低 |
| T003 质量检查 | 10 min | 低 |
| **总计** | **~1 hour** | - |
