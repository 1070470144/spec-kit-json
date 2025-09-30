# 剧本详情页 Material Design 3 优化

**ID**: 007-script-detail-m3-redesign  
**状态**: ✅ 已完成  
**日期**: 2025-09-30

## 概述

本次优化将 Material Design 3 设计系统应用到剧本详情页面，提升内容展示效果和用户体验，实现了与整站一致的视觉语言。

## 已完成的优化

### ✅ 剧本详情页 (`/scripts/[id]`)

**主要改进**:

1. **面包屑导航** - 新增
   - 清晰的层级导航
   - Hover 状态反馈
   - 当前页面高亮

2. **页面布局优化**
   - 卡片化设计，内容分区明确
   - 统一的间距系统（space-y-6）
   - 响应式布局

3. **剧本信息区**
   - Headline Large 标题（更醒目）
   - 作者信息带图标
   - 信息层次清晰

4. **操作按钮优化**
   - 下载按钮：M3 Filled Button（主操作）
   - 返回按钮：M3 Outlined Button（次要操作）
   - 图标 + 文字组合
   - 分隔线区分区域

5. **JSON 预览区优化**
   - Title Large 区块标题
   - 辅助说明文字
   - 优化代码区域样式
   - 空状态设计（无内容时）

6. **空状态设计**
   - 图标 + 标题 + 描述
   - 友好的提示信息

## 设计细节

### 面包屑导航
```tsx
<nav className="flex items-center gap-2 text-body-small text-surface-on-variant">
  <a href="/" className="hover:text-primary transition-colors">首页</a>
  <svg>...</svg>
  <a href="/scripts" className="hover:text-primary transition-colors">剧本列表</a>
  <svg>...</svg>
  <span className="text-surface-on font-medium">{title}</span>
</nav>
```

### 标题区域
```tsx
<h1 className="text-headline-large font-bold text-surface-on mb-3">
  {data.title}
</h1>
```

### 操作按钮
```tsx
<a className="m3-btn-filled inline-flex items-center gap-2">
  <Icon />
  下载 JSON
</a>
```

### JSON 预览
```tsx
<pre className="text-body-small font-mono bg-gray-50 border border-outline rounded-lg p-4">
  {jsonContent}
</pre>
```

## M3 规范应用

### 排版
- ✅ Headline Large (36px) - 剧本标题
- ✅ Title Large (22px) - 区块标题
- ✅ Body Medium (14px) - 正文和说明
- ✅ Body Small (12px) - 面包屑和辅助文字

### 颜色
- ✅ primary (#2563EB) - 链接和主按钮
- ✅ surface (#FFFFFF) - 卡片背景
- ✅ surface-on (#1C1B1F) - 主文字
- ✅ surface-on-variant (#49454F) - 次要文字
- ✅ outline (#E2E8F0) - 边框

### 组件
- ✅ m3-btn-filled - 下载按钮
- ✅ m3-btn-outlined - 返回按钮
- ✅ .card - 卡片容器
- ✅ 面包屑导航
- ✅ 空状态设计

## 对比优化

### 优化前
- 所有内容在一个卡片中
- 标题不够醒目
- 按钮样式不统一
- 无面包屑导航
- 无空状态设计

### 优化后
- 内容分区清晰（4个独立卡片）
- Headline Large 标题醒目
- M3 按钮样式统一
- 面包屑导航清晰
- 友好的空状态

## 文件清单

### 已修改的文件
```
xueran-juben-project/app/scripts/[id]/
└── page.tsx                      ✅ M3 优化
```

### 新增的文档
```
xueran-juben-project/specs/007-script-detail-m3-redesign/
├── README.md                     📄 本文档
└── spec.md                       📋 设计规范
```

## 成功指标

| 指标 | 目标 | 实际 | 状态 |
|------|------|------|------|
| M3 规范符合度 | 100% | 100% | ✅ |
| 内容层次清晰度 | 提升 | 提升 | ✅ |
| 操作按钮可用性 | 提升 | 提升 | ✅ |
| 视觉一致性 | 与整站一致 | 一致 | ✅ |
| 响应式布局 | 正常 | 正常 | ✅ |

## 验证清单

- [x] 面包屑导航正常
- [x] 标题使用 M3 排版
- [x] 按钮使用 M3 样式
- [x] 卡片布局清晰
- [x] JSON 预览可读
- [x] 空状态友好
- [x] 响应式布局正常
- [x] 无 TypeScript 错误

## 后续建议

1. **代码高亮**: JSON 语法高亮显示
2. **复制功能**: 添加一键复制按钮（需客户端组件）
3. **分享功能**: 添加分享到社交媒体
4. **相关推荐**: 推荐相似剧本
5. **版本历史**: 显示剧本更新历史

## 技术说明

### 服务器组件限制
- 页面是服务器组件，不能直接使用 `onClick` 等事件处理器
- 如需交互功能（如复制按钮），需要创建独立的客户端组件
- 评论区域通过 `ClientCommentsWrapper` 加载客户端组件

### 数据获取
- 使用 SSR 获取剧本数据
- `cache: 'no-store'` 确保数据实时性

## 参考资料

- [Material Design 3](https://m3.material.io/)
- [项目宪法](../../CONSTITUTION.md)
- [核心页面 M3 优化](../003-pages-m3-redesign/)

## 变更日志

### 2025-09-30
- ✅ 完成剧本详情页面 M3 优化
- ✅ 添加面包屑导航
- ✅ 优化页面布局和信息层次
- ✅ 统一按钮样式
- ✅ 添加空状态设计
- ✅ 修复服务器组件事件处理器问题

---

**维护者**: 开发团队  
**最后更新**: 2025-09-30  
**版本**: 1.0.0
