# Spec: 删除上传页面预览图功能提示

**ID**: 019-remove-upload-preview-tips  
**Created**: 2025-10-10  
**Status**: ✅ Completed  
**Priority**: Low

## 目标

删除上传页面中自动预览图功能的详细说明提示框，简化界面，减少视觉干扰。

## 背景

当前上传页面的自动预览图功能区域包含了一个详细的功能说明提示框，列出了以下内容：
- 💡 血染钟楼预览图功能：
  - 智能解析数组格式JSON文件
  - 显示角色名字、技能和类型分类
  - 显示JSON中的真实角色logo图片
  - 支持六种角色类型（镇民/外来者/爪牙/恶魔/旅行者/传奇）
  - ✨ 已优化：服务器自动下载图片并嵌入，完美显示角色logo！

这个提示框占用了较多的垂直空间，且对已熟悉功能的用户来说是冗余信息。

## 范围

### 包含
- ✅ 删除上传页面中的"血染钟楼预览图功能"说明提示框
- ✅ 保持其他所有功能不变（生成按钮、预览图显示等）

### 不包含
- ❌ 不删除其他任何提示信息（如状态提示、警告提示等）
- ❌ 不修改预览图生成功能本身
- ❌ 不修改页面其他部分

## 用户故事

### US-1: 简化上传界面
**作为** 用户  
**我想要** 一个更简洁的上传界面  
**以便于** 更快速地完成上传操作，减少视觉干扰

**验收标准**:
- 功能说明提示框已被删除
- 预览图生成功能正常工作
- 页面布局保持整洁
- 其他提示信息（如状态提示）正常显示

## 技术实现

### 需要修改的文件
- `xueran-juben-project/app/upload/page.tsx` (第 496-515 行)

### 具体修改
删除以下代码块：

```tsx
{/* 功能说明 */}
<div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
  <div className="flex items-start gap-2">
    <svg className="w-4 h-4 text-sky-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div className="text-xs sm:text-sm text-sky-800 space-y-1">
      <div className="font-medium">💡 血染钟楼预览图功能：</div>
      <ul className="space-y-0.5 list-disc list-inside ml-2">
        <li>智能解析数组格式JSON文件</li>
        <li>显示角色名字、技能和类型分类</li>
        <li>显示JSON中的真实角色logo图片</li>
        <li>支持六种角色类型（镇民/外来者/爪牙/恶魔/旅行者/传奇）</li>
      </ul>
      <div className="text-xs text-green-700 mt-2 bg-green-100 p-2 rounded">
        ✨ 已优化：服务器自动下载图片并嵌入，完美显示角色logo！
      </div>
    </div>
  </div>
</div>
```

### 影响范围
- **视觉**: 上传页面更简洁，减少约 100px 垂直空间
- **功能**: 无影响，所有功能保持不变
- **用户体验**: 界面更简洁，减少信息过载

## 验收标准

- ✅ 功能说明提示框已从页面中移除
- ✅ 生成预览图按钮正常工作
- ✅ 预览图生成后正常显示
- ✅ 状态提示（警告、成功）正常显示
- ✅ 页面无 TypeScript/ESLint 错误
- ✅ 页面布局无异常

## 成功指标

- ✅ 上传页面代码行数减少约 20 行
- ✅ 页面视觉更简洁
- ✅ 用户反馈界面更清爽

## 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 新用户不了解功能 | 低 | 中 | 功能按钮本身的文字已足够说明 |
| 误删其他提示 | 中 | 低 | 仔细审查代码，只删除指定部分 |

## 预估工作量

- **开发**: 5 分钟
- **测试**: 5 分钟
- **总计**: ~10 分钟

## 参考

- 相关文件: `xueran-juben-project/app/upload/page.tsx`
- 截图: 见用户提供的界面截图

