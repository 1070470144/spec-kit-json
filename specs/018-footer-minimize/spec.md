# Feature Specification: Footer区域最小化

**Feature Branch**: `master`  
**Created**: 2025-10-10  
**Status**: UI Optimization  
**Input**: "红框高度缩小"

## 问题

Footer区域（红框部分）高度仍然过高，在移动端占用过多屏幕空间，影响用户体验。

## 优化目标

1. 大幅缩减Footer内边距
2. 简化Footer内容布局
3. 移动端优先考虑，极简设计
4. 保留核心信息，减少次要内容

## 方案

- 内边距从py-4 sm:py-6缩减到py-2 sm:py-3
- 内容间距进一步缩小
- 移动端可考虑单行布局
- 字号进一步缩小
