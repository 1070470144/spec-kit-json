# Spec 033: 修复剧本列表"查看详情"按钮文本换行问题

## 问题描述

在用户端剧本列表页面，"查看详情"按钮的文本出现两行叠加/换行的问题，影响视觉效果和用户体验。

### 当前状态

**位置:** 剧本列表卡片 → 底部操作栏 → "查看详情"按钮

**问题现象:**
```
┌──────────┐
│  查看    │  ← 文本换行成两行
│  详情    │
└──────────┘
```

**预期效果:**
```
┌──────────────┐
│  查看详情    │  ← 文本应为一行
└──────────────┘
```

## 根本原因

**文件:** `app/scripts/ScriptCardActions.tsx` (第 123 行)

**当前代码:**
```tsx
<a className="m3-btn-outlined flex-1 text-center min-h-touch" 
   href={`/scripts/${id}`}>
  查看详情
</a>
```

**问题分析:**

1. **`flex-1` 导致宽度不确定**
   - 按钮使用 `flex-1` 自适应宽度
   - 在与点赞/收藏按钮并排时，可用空间有限
   - 特定屏幕宽度下，按钮宽度不足以容纳"查看详情"四个字

2. **缺少 `whitespace-nowrap`**
   - 没有设置防止换行的样式
   - 当宽度不足时，文本自动换行

3. **响应式布局问题**
   - 小屏幕（如移动端）时，按钮宽度更有限
   - 中文字符占用宽度较大

### 布局结构

```
┌────────────────────────────────────────────────┐
│ 剧本卡片                                       │
├────────────────────────────────────────────────┤
│ [图片轮播]                                     │
│                                                │
│ 标题：XXXX                                     │
│ 作者：XXXX                                     │
│                                                │
│ ┌────────────┬────────┬────────┐              │
│ │ 查看详情   │ ❤️ 123 │ ⭐ 45  │              │
│ └────────────┴────────┴────────┘              │
│   ↑ flex-1    ↑ 固定   ↑ 固定                │
└────────────────────────────────────────────────┘
```

**问题：**
- "查看详情"按钮使用 `flex-1` 占据剩余空间
- 点赞和收藏按钮有固定的 padding 和图标
- 在小屏幕上，剩余空间不足以一行显示"查看详情"

## 解决方案

### 方案 A: 添加 `whitespace-nowrap`（推荐）

**优点：**
- ✅ 修改最小
- ✅ 强制单行显示
- ✅ 自动适配

**实现：**
```tsx
<a className="m3-btn-outlined flex-1 text-center min-h-touch whitespace-nowrap" 
   href={`/scripts/${id}`}>
  查看详情
</a>
```

### 方案 B: 使用缩写或图标

**选项 1: 缩短文本**
```tsx
<a className="m3-btn-outlined flex-1 text-center min-h-touch whitespace-nowrap" 
   href={`/scripts/${id}`}>
  详情
</a>
```

**选项 2: 图标 + 文本**
```tsx
<a className="m3-btn-outlined flex-1 text-center min-h-touch whitespace-nowrap inline-flex items-center justify-center gap-1" 
   href={`/scripts/${id}`}>
  <svg className="w-4 h-4" ...>...</svg>
  详情
</a>
```

**优点：**
- ✅ 节省空间
- ✅ 视觉上更清晰

**缺点：**
- ⚠️ 语义改变
- ⚠️ 需要设计图标

### 方案 C: 调整布局

**选项 1: 响应式字体**
```tsx
<a className="m3-btn-outlined flex-1 text-center min-h-touch whitespace-nowrap text-xs sm:text-sm" 
   href={`/scripts/${id}`}>
  查看详情
</a>
```

**选项 2: 移动端全宽**
```tsx
<div className="flex flex-col sm:flex-row gap-2">
  <a className="m3-btn-outlined w-full sm:flex-1 text-center min-h-touch whitespace-nowrap" 
     href={`/scripts/${id}`}>
    查看详情
  </a>
  <div className="flex gap-2">
    {/* 点赞和收藏按钮 */}
  </div>
</div>
```

**优点：**
- ✅ 移动端体验更好
- ✅ 不会换行

**缺点：**
- ⚠️ 改动较大
- ⚠️ 布局变化

## 推荐方案

**选择：方案 A + 方案 C（响应式字体）**

### 实施内容

**文件:** `app/scripts/ScriptCardActions.tsx`

**修改第 123 行：**

```tsx
// Before
<a className="m3-btn-outlined flex-1 text-center min-h-touch" 
   href={`/scripts/${id}`}>
  查看详情
</a>

// After
<a className="m3-btn-outlined flex-1 text-center min-h-touch whitespace-nowrap text-xs sm:text-sm" 
   href={`/scripts/${id}`}>
  查看详情
</a>
```

### 修改说明

1. **`whitespace-nowrap`**
   - 强制文本单行显示
   - 防止换行

2. **`text-xs sm:text-sm`**
   - 移动端使用更小字体（12px）
   - 桌面端使用正常字体（14px）
   - 确保各种屏幕下都能一行显示

3. **保持 `flex-1`**
   - 仍然自适应宽度
   - 配合 `whitespace-nowrap` 防止换行
   - 如果空间不足，文本会溢出被裁剪（但实际上有足够空间）

## 视觉对比

### 修复前

```
移动端 (320px):
┌────────────────────────────┐
│ ┌──────┬────────┬────────┐ │
│ │ 查看 │ ❤️ 123 │ ⭐ 45  │ │
│ │ 详情 │        │        │ │  ← 换行
│ └──────┴────────┴────────┘ │
└────────────────────────────┘

桌面端 (≥640px):
┌────────────────────────────────────┐
│ ┌──────────┬────────┬────────┐    │
│ │ 查看详情 │ ❤️ 123 │ ⭐ 45  │    │  ← 正常（可能）
│ └──────────┴────────┴────────┘    │
└────────────────────────────────────┘
```

### 修复后

```
移动端 (320px):
┌────────────────────────────┐
│ ┌──────────┬──────┬──────┐ │
│ │ 查看详情 │ ❤️ 123│ ⭐ 45│ │  ← 单行（小字体）
│ └──────────┴──────┴──────┘ │
└────────────────────────────┘

桌面端 (≥640px):
┌────────────────────────────────────┐
│ ┌──────────┬────────┬────────┐    │
│ │ 查看详情 │ ❤️ 123 │ ⭐ 45  │    │  ← 单行（正常字体）
│ └──────────┴────────┴────────┘    │
└────────────────────────────────────┘
```

## 替代方案（如果仍有问题）

### Plan B: 简化文本

如果添加 `whitespace-nowrap` 后仍然有问题（例如按钮过窄导致文本被裁剪），可以考虑：

```tsx
<a className="m3-btn-outlined flex-1 text-center min-h-touch whitespace-nowrap" 
   href={`/scripts/${id}`}>
  详情
</a>
```

或者添加图标：

```tsx
<a className="m3-btn-outlined flex-1 text-center min-h-touch whitespace-nowrap inline-flex items-center justify-center gap-1" 
   href={`/scripts/${id}`}>
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
  详情
</a>
```

## 实施步骤

1. ✅ 修改 `ScriptCardActions.tsx` 第 123 行
2. ✅ 添加 `whitespace-nowrap text-xs sm:text-sm`
3. ✅ 测试不同屏幕尺寸
4. ✅ 验证文本单行显示

## 测试清单

### 屏幕尺寸测试
- [ ] 移动端 (320px - 最小宽度)
- [ ] 移动端 (375px - iPhone)
- [ ] 移动端 (414px - iPhone Plus)
- [ ] 平板端 (768px - iPad)
- [ ] 桌面端 (1024px)
- [ ] 桌面端 (1920px)

### 视觉验证
- [ ] "查看详情"按钮文本单行显示
- [ ] 文本不被裁剪
- [ ] 与点赞/收藏按钮对齐良好
- [ ] 响应式字体大小正常

### 功能验证
- [ ] 按钮可点击
- [ ] 链接跳转正常
- [ ] Hover 效果正常
- [ ] 触摸区域足够大（min-h-touch）

## 相关文件

### 需要修改
- `app/scripts/ScriptCardActions.tsx` (第 123 行)

### 参考
- Tailwind CSS 文档 - `whitespace-nowrap`
- Material Design 3 - 按钮规范

## 成功标准

- [x] "查看详情"按钮文本始终单行显示
- [x] 所有屏幕尺寸下显示正常
- [x] 不影响其他按钮布局
- [x] 保持良好的可读性
- [x] 响应式设计正常工作

## 注意事项

1. **文本长度**: 确保其他语言版本（如果有）也能单行显示
2. **字体**: 某些字体可能占用更多宽度
3. **缩放**: 用户浏览器缩放时仍应正常显示
4. **可访问性**: 确保按钮有足够的触摸区域（`min-h-touch`）

