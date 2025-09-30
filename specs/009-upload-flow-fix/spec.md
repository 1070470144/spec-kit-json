# Spec: 修复上传后无法查看记录问题

**ID**: 009-upload-flow-fix  
**Created**: 2025-09-30  
**Status**: Diagnosis  
**Priority**: High

## 问题描述

用户上传剧本后，在"我的上传"页面看不到刚上传的记录。

## 诊断计划

### 1. 检查上传流程
- 上传 API (`/api/scripts` POST) 是否正确创建记录
- 是否正确关联当前用户（createdById）
- 返回数据是否包含 id

### 2. 检查我的上传页面
- 查询条件是否正确（mine=1）
- 是否正确传递用户会话
- 数据筛选逻辑是否正确

### 3. 可能的原因
- [ ] 上传时未关联用户 ID
- [ ] 我的上传页面查询条件错误
- [ ] 会话 cookie 未正确传递
- [ ] 缓存问题导致数据不刷新
- [ ] 权限问题

## 诊断结果

### 代码分析

**上传 API (`/api/scripts` POST)** ✅
- 第88行：正确获取 session 和 admin session
- 第96行：正确设置 `createdById: ownerId`
- 第131行：返回剧本 ID
- ✅ 逻辑正常

**我的上传页面 (`/my/uploads/page.tsx`)** ✅
- 第12行：正确传递 `mine=1` 参数
- 第11行：正确传递 cookie
- 第13行：使用 `cache: 'no-store'`
- ✅ 逻辑正常

**API GET 逻辑** ✅
- 第27-33行：mine=1 时根据 `createdById` 筛选
- 第20行：mine 模式下不限制 state（可以看到所有状态）
- ✅ 逻辑正常

### 问题定位

**主要问题**：
1. ⚠️ 上传成功后跳转到 `/scripts` 而不是 `/my/uploads`
   - 用户需要手动导航到"我的上传"才能看到
   - 体验不佳

2. ⚠️ "我的上传"页面没有清晰的状态说明
   - 用户不知道 `pending` 是什么意思
   - 需要优化状态显示

## 解决方案

### 1. 上传成功后跳转到我的上传
**文件**: `app/upload/page.tsx`
- 第67行：`location.href = '/scripts'` 
- 改为：`location.href = '/my/uploads'`
- 并添加 Toast 提示

### 2. 优化我的上传页面
**文件**: `app/my/uploads/page.tsx`
- 优化页面标题和说明
- 优化状态徽章显示
- 添加状态说明
- 应用新的配色和 M3 样式
