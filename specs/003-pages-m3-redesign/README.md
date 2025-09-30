# 003: 核心页面 Material Design 3 优化

## 📋 规格概览

按照项目宪法中的 Material Design 3 规范，优化剧本列表、排行榜和上传页面，保持与首页的视觉一致性。

**状态**: Draft → Ready for Implementation  
**优先级**: High  
**预估工作量**: ~10 hours  
**分支**: `003-pages-m3-redesign`  
**依赖**: 规格 002 (首页 M3 优化)

## 🎯 目标

1. ✅ 应用 M3 设计系统到核心功能页面
2. ✅ 确保与首页视觉一致性
3. ✅ 优化用户体验和交互反馈
4. ✅ 保持 SSR 性能和功能完整性

## 📁 文档结构

```
003-pages-m3-redesign/
├── README.md          # 本文档（概览）
├── spec.md            # 详细规格（用户故事、设计规范）
├── plan.md            # 实施计划（技术上下文、宪法检查）
└── tasks.md           # 任务清单（10 个任务，含依赖关系）
```

## 🎨 设计要点

### 剧本列表页 (/scripts)

**优化内容**:
- 🔍 **搜索栏**: M3 Outlined Text Field
- 📇 **卡片**: M3 Elevated Card (shadow-elevation-2)
- 🔘 **操作按钮**: M3 Icon Button (点赞/收藏)
- 📄 **分页**: M3 Outlined Button

**M3 应用**:
```tsx
<div className="m3-card-elevated">
  <img className="aspect-[4/3]" />
  <div className="p-4">
    <h3 className="text-title-large">{title}</h3>
    <p className="text-body-small text-surface-on-variant">{author}</p>
  </div>
</div>
```

### 排行榜页 (/leaderboard)

**优化内容**:
- 🔄 **切换组**: M3 Segmented Button
- 🏆 **排名徽章**: M3 Badge (Top 1/2/3 不同颜色)
- 📊 **列表项**: M3 交互状态
- 📈 **统计**: M3 Badge 样式

**M3 应用**:
```tsx
{/* 切换组 */}
<button className="m3-segmented-btn m3-segmented-btn-active">按点赞</button>
<button className="m3-segmented-btn">按收藏</button>

{/* 排名徽章 */}
<span className="m3-rank-badge bg-amber-500 text-white">1</span>
```

### 上传页 (/upload)

**优化内容**:
- 📝 **表单输入**: M3 Text Field
- 📁 **文件选择**: M3 Outlined Button
- 🖼️ **图片预览**: M3 Elevated Card
- ✅ **提交按钮**: M3 Filled Button
- 💬 **反馈提示**: M3 Snackbar

**M3 应用**:
```tsx
{/* 输入框 */}
<input className="input" placeholder="例如：隐舟暗渡" />

{/* 文件按钮 */}
<button className="m3-btn-outlined" onClick={handlePick}>选择文件</button>

{/* 预览卡片 */}
<div className="m3-card-elevated">
  <img className="rounded object-cover" />
</div>

{/* 提交按钮 */}
<button className="m3-btn-filled" type="submit">提交</button>
```

## 🛠️ 技术实现

### 页面结构

```
剧本列表页 (scripts/page.tsx)
├── 搜索栏 (Server Component)
├── 卡片网格 (Server Component)
│   ├── 图片轮播 (Client Component)
│   └── 操作按钮 (Client Component)
└── 分页控件 (Server Component)

排行榜页 (leaderboard/page.tsx)
├── 切换组 (Server Component + 链接)
└── 排行列表 (Server Component)

上传页 (upload/page.tsx)
├── 表单 (Client Component)
├── 文件选择 (Client Component)
└── 图片预览 (Client Component)
```

### 性能要求
- SSR 渲染静态内容
- 客户端 JS 仅用于交互
- 卡片轮播 ≥ 60fps
- 搜索响应 < 500ms

## 📝 任务清单

### Phase 1: Setup (T001)
- 扩展 globals.css M3 样式

### Phase 2: 页面优化 (T002-T005) [部分可并行]
- T002: 剧本列表页
- T003: ScriptCardActions  
- T004: 排行榜页
- T005: 上传页

### Phase 3: 优化与验证 (T006-T010) [可并行]
- T006: 响应式优化
- T007: 无障碍增强
- T008: 性能验证
- T009: 代码质量
- T010: 视觉一致性

## ✅ 验收标准

### 设计规范
- [ ] 所有卡片使用 M3 样式
- [ ] 所有按钮使用 M3 样式
- [ ] 所有输入使用 M3 Text Field
- [ ] 排版系统与首页一致
- [ ] 颜色令牌使用正确

### 功能完整性
- [ ] 剧本搜索正常
- [ ] 分页跳转正常
- [ ] 点赞/收藏功能正常
- [ ] 排行榜切换正常
- [ ] 文件上传正常
- [ ] 图片预览正常

### 无障碍
- [ ] 搜索框有 aria-label
- [ ] 分页按钮有 aria-disabled
- [ ] 文件输入有关联 label
- [ ] 键盘导航正常

### 性能
- [ ] SSR 正常
- [ ] 无额外 bundle
- [ ] 无 linter 错误

## 🚀 快速开始

```bash
# 1. 基于首页优化分支创建新分支
git checkout 002-homepage-m3-redesign
git checkout -b 003-pages-m3-redesign

# 2. 按顺序执行任务
# T001: 扩展 CSS 样式
# T002-T005: 优化各页面（可部分并行）
# T006-T010: 测试与验证（可并行）

# 3. 验证
npm run build
npm run lint
npm run dev
```

## 📚 参考资源

- [Material Design 3 - Cards](https://m3.material.io/components/cards)
- [Material Design 3 - Text Fields](https://m3.material.io/components/text-fields)
- [Material Design 3 - Buttons](https://m3.material.io/components/buttons)
- [项目宪法](../../CONSTITUTION.md)
- [首页 M3 优化](../002-homepage-m3-redesign/)

## 🔗 相关规格

- **前置**: [002 - 首页 M3 优化](../002-homepage-m3-redesign/)
- **后续**: 剧本详情页 M3 优化（待创建）

## 🎯 成功指标

完成后应达到：
- ✅ 三个核心页面视觉统一
- ✅ 用户体验流畅自然
- ✅ 无障碍访问达标
- ✅ 性能无退化
- ✅ 代码质量良好

## 📊 预估工作量

| 阶段 | 任务 | 时间 |
|------|------|------|
| Setup | T001 | 0.5h |
| 页面优化 | T002-T005 | 6h |
| 优化验证 | T006-T010 | 3.5h |
| **总计** | - | **~10h** |

## 🔄 后续计划

1. 剧本详情页 M3 优化
2. 用户个人页面 M3 优化
3. 管理后台 M3 优化
4. 深色主题实施（全站）
