# Feature Specification: 移动端下拉菜单

**Feature Branch**: `master`  
**Created**: 2025-10-10  
**Status**: Quick Fix  
**Input**: "手机版右上角三条杠点击之后，菜单列表出现下拉列表效果"

## 目标

将当前的侧边抽屉菜单改为**从右上角下拉的列表菜单**，更符合移动端常见的交互模式。

## 需求

1. 点击三条杠后，菜单从右上角向下展开
2. 菜单宽度适中，不占满屏幕
3. 保持现有的菜单项内容
4. 点击外部区域或菜单项后关闭
5. 平滑的下拉动画效果

## 实施方案

修改 SiteHeader.tsx 中的菜单定位和动画：
- 从 `fixed inset-y-0 left-0` 改为 `absolute top-full right-0`
- 从滑动动画改为下拉缩放动画
- 调整菜单宽度和样式
