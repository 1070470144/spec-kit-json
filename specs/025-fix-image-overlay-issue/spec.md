# Spec 025: 修复上传图片覆盖按钮问题

## 概述
**规格编号**: 025  
**创建日期**: 2025-10-11  
**状态**: 实施中  

## 目标
修复上传页面中，用户上传图片后，图片预览卡片的 hover 覆盖层遮挡"生成预览图"按钮的问题。

## 背景
用户反馈：在上传页面上传图片后，无法点击"生成预览图"按钮，因为图片预览卡片的点击区域覆盖了按钮区域。

## 问题分析

### 根本原因
在 `app/upload/page.tsx` 的第 359-370 行：

```tsx
<div 
  key={i} 
  className="m3-card-elevated overflow-hidden aspect-square cursor-pointer hover:shadow-lg transition-shadow"
  onClick={() => openPreviewModal(src)}
>
  <img src={src} alt={`预览 ${i+1}`} className="object-cover w-full h-full" />
  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all">
    <svg className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
    </svg>
  </div>
</div>
```

**问题**：
1. ❌ 父容器缺少 `relative` 定位
2. ❌ 子元素使用了 `absolute inset-0` 绝对定位
3. ❌ 由于父容器不是 `relative`，`absolute` 元素相对于更外层的定位上下文定位
4. ❌ 导致覆盖层可能延伸到父容器外部，遮挡下方的按钮

### CSS 定位原理
- `absolute` 定位元素相对于最近的 `relative`/`absolute`/`fixed` 父元素定位
- 如果没有定位父元素，则相对于 `<body>` 或其他定位上下文定位
- `inset-0` 等价于 `top: 0; right: 0; bottom: 0; left: 0`

## 解决方案

### 修改代码
在父容器添加 `relative` 类：

```tsx
<div 
  key={i} 
  className="relative m3-card-elevated overflow-hidden aspect-square cursor-pointer hover:shadow-lg transition-shadow"
  onClick={() => openPreviewModal(src)}
>
  <img src={src} alt={`预览 ${i+1}`} className="object-cover w-full h-full" />
  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all">
    {/* ... */}
  </div>
</div>
```

**修改内容**：
- ✅ 添加 `relative` 到父容器的 className
- ✅ 确保 `absolute` 子元素相对于父容器定位
- ✅ 覆盖层不会延伸到卡片外部

## 实现步骤

### Phase 1: 修复定位问题
- [x] 找到问题代码位置
- [x] 添加 `relative` 类到父容器
- [x] 确认不影响其他样式

### Phase 2: 测试验证
- [ ] 上传图片后测试按钮可点击性
- [ ] 测试图片 hover 效果是否正常
- [ ] 测试响应式布局（移动端/桌面端）

## 验收标准

### 功能验收
1. ✅ 上传图片后，"生成预览图"按钮可以正常点击
2. ✅ 图片预览卡片的 hover 效果正常工作
3. ✅ 图片点击放大功能正常

### 视觉验收
1. ✅ 覆盖层不延伸到卡片外部
2. ✅ hover 时黑色半透明蒙层正常显示
3. ✅ 放大镜图标正常显示

### 兼容性验收
1. ✅ Chrome/Edge/Firefox 正常工作
2. ✅ 移动端布局正常

## 风险分析

### 已知风险
无，这是标准的 CSS 定位修复

### 影响范围
- 仅影响上传页面的图片预览卡片
- 不影响其他页面或功能

## 相关资源
- MDN: CSS Position: https://developer.mozilla.org/en-US/docs/Web/CSS/position
- Tailwind CSS Position: https://tailwindcss.com/docs/position

## 变更历史
- 2025-10-11: 初始创建

