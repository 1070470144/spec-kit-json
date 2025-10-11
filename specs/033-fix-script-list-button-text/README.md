# 033: 修复剧本列表"查看详情"按钮文本换行

## 状态
✅ **已完成**

## 问题
剧本列表页面的"查看详情"按钮文本出现两行叠加/换行，影响视觉效果。

## 原因
- 按钮使用 `flex-1` 自适应宽度
- 在小屏幕上，可用空间不足
- 缺少防止换行的样式

## 解决方案

### 修改内容

**文件:** `app/scripts/ScriptCardActions.tsx` (第 123 行)

**Before:**
```tsx
<a className="m3-btn-outlined flex-1 text-center min-h-touch" 
   href={`/scripts/${id}`}>
  查看详情
</a>
```

**After:**
```tsx
<a className="m3-btn-outlined flex-1 text-center min-h-touch whitespace-nowrap text-xs sm:text-sm" 
   href={`/scripts/${id}`}>
  查看详情
</a>
```

### 关键修改

1. **`whitespace-nowrap`** - 强制文本单行显示
2. **`text-xs sm:text-sm`** - 响应式字体
   - 移动端: 12px（更小，确保能一行显示）
   - 桌面端: 14px（正常大小）

## 视觉对比

### Before
```
┌──────────┐
│  查看    │  ← 两行
│  详情    │
└──────────┘
```

### After
```
┌──────────────┐
│  查看详情    │  ← 单行
└──────────────┘
```

## 测试清单

- [x] 移动端 (320px) - 单行显示 ✅
- [x] 移动端 (375px) - 单行显示 ✅
- [x] 平板端 (768px) - 单行显示 ✅
- [x] 桌面端 (1024px+) - 单行显示 ✅
- [x] 文本不被裁剪 ✅
- [x] 按钮可点击 ✅
- [x] 布局保持协调 ✅

## 相关文档
- [spec.md](./spec.md) - 详细技术分析

