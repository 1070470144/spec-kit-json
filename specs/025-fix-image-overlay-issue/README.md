# Spec 025: 修复上传图片覆盖按钮问题

## 问题描述
用户在上传页面上传图片后，图片预览卡片的 hover 覆盖层遮挡了"生成预览图"按钮，导致无法点击该按钮。

## 根本原因
图片预览卡片的父容器缺少 `relative` 定位，导致内部的 `absolute` 定位元素（hover 覆盖层）相对于更外层的元素定位，延伸到卡片外部，遮挡了下方的按钮。

## 解决方案
在图片预览卡片的父容器添加 `relative` 类，确保 `absolute` 定位的覆盖层相对于卡片定位，不会延伸到外部。

## 修改的文件
- `app/upload/page.tsx`
  - 第 361 行：添加 `relative` 到 className

## 修改内容

### 修改前
```tsx
<div 
  key={i} 
  className="m3-card-elevated overflow-hidden aspect-square cursor-pointer hover:shadow-lg transition-shadow"
  onClick={() => openPreviewModal(src)}
>
```

### 修改后
```tsx
<div 
  key={i} 
  className="relative m3-card-elevated overflow-hidden aspect-square cursor-pointer hover:shadow-lg transition-shadow"
  onClick={() => openPreviewModal(src)}
>
```

## 验收检查
- [x] 创建 spec 文档
- [ ] 添加 `relative` 类
- [ ] 测试按钮可点击性
- [ ] 测试 hover 效果

## 相关文档
- [完整规格说明](./spec.md)

