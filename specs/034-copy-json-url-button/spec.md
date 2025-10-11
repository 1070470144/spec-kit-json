# Spec 034: 剧本详情页添加"复制JSON地址"按钮

## 需求概述

在用户端剧本详情页面增加"复制JSON内容"按钮，点击后**直接将剧本的JSON内容复制到剪贴板**，用户可以直接粘贴到血染钟楼官方网站使用，无需下载文件。

**核心需求：** 用户需要快速将剧本导入血染钟楼官网，传统的"下载→选择文件→上传"流程过于繁琐，直接复制JSON内容可以大幅简化操作。

## 当前状态

### 现有功能

**文件:** `app/scripts/[id]/page.tsx`

**操作按钮区域 (第 67-87 行):**
```tsx
<div className="flex flex-wrap items-center gap-4">
  <a className="m3-btn-filled" 
     href={`${base}/api/scripts/${data.id}/download`} 
     download>
    下载 JSON
  </a>
  <a className="m3-btn-outlined" href="/scripts">
    返回列表
  </a>
</div>
```

**现有API:**
- `GET /api/scripts/[id]` - 获取剧本详情和JSON数据
- `GET /api/scripts/[id]/download` - 下载JSON文件

## 目标设计

### 功能需求

添加一个"复制JSON内容"按钮，点击后：
1. **自动获取** JSON数据（从API）
2. **格式化** JSON内容（便于阅读）
3. **复制** 格式化的JSON字符串到剪贴板
4. **显示** 加载中、成功或失败的状态反馈

### UI 设计

#### 按钮位置

```
┌────────────────────────────────────────────────┐
│ 剧本标题                                       │
│ 作者：XXX                                      │
├────────────────────────────────────────────────┤
│ [下载 JSON] [复制JSON内容] [返回列表]         │  ← 新增
└────────────────────────────────────────────────┘
```

#### 按钮样式

```tsx
<button className="m3-btn-outlined inline-flex items-center gap-2">
  <svg>📋</svg>  {/* 复制图标 */}
  复制 JSON 内容
</button>
```

#### 交互状态

**默认状态:**
```
┌────────────────────┐
│ 📋 复制 JSON 内容  │
└────────────────────┘
```

**点击后（加载中）:**
```
┌────────────────────┐
│ ⏳ 加载中...       │  ← 获取JSON数据
└────────────────────┘
```

**加载完成（成功）:**
```
┌──────────────────────────┐
│ ✅ 已复制到剪贴板！      │  ← 临时显示 2 秒
└──────────────────────────┘
```

**加载失败（失败）:**
```
┌───────────────────┐
│ ❌ 复制失败       │  ← 临时显示 2 秒
└───────────────────┘
```

### 复制内容格式

#### 格式化的JSON字符串

点击按钮后，剪贴板中的内容：

```json
{
  "meta": {
    "scriptName": "示例剧本",
    "rounds": 3,
    "playerCount": 7,
    "author": "作者名"
  },
  "roles": [
    {
      "id": 1,
      "name": "角色A",
      "type": "好人",
      "ability": "..."
    },
    {
      "id": 2,
      "name": "角色B",
      "type": "坏人",
      "ability": "..."
    }
  ],
  "rounds": [
    {
      "round": 1,
      "events": [...]
    }
  ]
}
```

**格式化说明：**
- 使用 `JSON.stringify(data, null, 2)` 生成
- 缩进 2 个空格
- 便于阅读和粘贴

#### 使用流程

```
1. 用户点击"复制 JSON 内容"
   ↓
2. 组件显示"加载中..."
   ↓
3. fetch('/api/scripts/{id}/download')
   ↓
4. JSON.stringify(data, null, 2)
   ↓
5. navigator.clipboard.writeText(jsonString)
   ↓
6. 显示"已复制到剪贴板！"
   ↓
7. 用户打开血染钟楼官网
   ↓
8. 按 Ctrl+V 或 Cmd+V 粘贴
   ↓
9. 完成导入！
```

## 详细设计

### 1. 组件实现

由于需要使用浏览器 Clipboard API，必须创建客户端组件。

#### 创建新组件

**文件:** `app/scripts/[id]/CopyJsonUrlButton.tsx`

```tsx
'use client'
import { useState } from 'react'

export default function CopyJsonUrlButton({ 
  scriptId, 
  baseUrl 
}: { 
  scriptId: string
  baseUrl: string 
}) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCopy() {
    setLoading(true)
    
    try {
      // 1. 获取 JSON 数据
      const url = `${baseUrl}/api/scripts/${scriptId}/download`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch JSON data')
      }
      
      const jsonData = await response.json()
      
      // 2. 将 JSON 对象转换为格式化的字符串
      const jsonString = JSON.stringify(jsonData, null, 2)
      
      // 3. 复制 JSON 字符串到剪贴板
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonString)
        setCopied(true)
        setError(false)
      } else {
        // 降级方案：使用传统方法
        const textarea = document.createElement('textarea')
        textarea.value = jsonString
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        const success = document.execCommand('copy')
        document.body.removeChild(textarea)
        
        if (success) {
          setCopied(true)
          setError(false)
        } else {
          throw new Error('Copy failed')
        }
      }
      
      // 2秒后恢复默认状态
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy JSON:', err)
      setError(true)
      setTimeout(() => setError(false), 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className="m3-btn-outlined w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-touch"
      onClick={handleCopy}
      disabled={copied || loading}
    >
      {loading ? (
        <>
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>加载中...</span>
        </>
      ) : copied ? (
        <>
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-600 font-medium">已复制到剪贴板！</span>
        </>
      ) : error ? (
        <>
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-red-600 font-medium">复制失败</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          复制 JSON 内容
        </>
      )}
    </button>
  )
}
```

### 2. 集成到详情页

**文件:** `app/scripts/[id]/page.tsx`

**修改第 66-87 行的按钮区域:**

```tsx
import CopyJsonUrlButton from './CopyJsonUrlButton'

// ... 在组件内部

{/* 操作按钮组 */}
<div className="flex flex-wrap items-center gap-4 pb-8 border-b border-gray-200">
  <a 
    className="m3-btn-filled inline-flex items-center gap-2 text-lg px-10 py-4" 
    href={`${base}/api/scripts/${data.id}/download`} 
    download
  >
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    下载 JSON
  </a>
  
  {/* 新增：复制JSON地址按钮 */}
  <CopyJsonUrlButton scriptId={data.id} baseUrl={base} />
  
  <a 
    className="m3-btn-outlined inline-flex items-center gap-2" 
    href="/scripts"
  >
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
    返回列表
  </a>
</div>
```

### 3. 响应式设计

#### 桌面端（≥768px）

```
┌──────────────────────────────────────────────────────┐
│ [下载 JSON]  [复制JSON地址]  [返回列表]              │
│  (大按钮)      (正常)          (正常)                 │
└──────────────────────────────────────────────────────┘
```

#### 移动端（<768px）

```
┌──────────────────────────┐
│ [下载 JSON]              │  ← 全宽
│ [复制JSON地址]           │  ← 全宽
│ [返回列表]               │  ← 全宽
└──────────────────────────┘
```

**响应式样式:**

```tsx
<div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 pb-8 border-b border-gray-200">
  <a className="m3-btn-filled w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg px-6 sm:px-10 py-3 sm:py-4 min-h-touch">
    下载 JSON
  </a>
  <CopyJsonUrlButton scriptId={data.id} baseUrl={base} />
  <a className="m3-btn-outlined w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-touch">
    返回列表
  </a>
</div>
```

并在 `CopyJsonUrlButton.tsx` 中添加响应式样式：

```tsx
<button className="m3-btn-outlined w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-touch">
  {/* ... */}
</button>
```

## 技术实现

### Clipboard API

#### 现代浏览器

```javascript
navigator.clipboard.writeText(url)
  .then(() => console.log('Copied!'))
  .catch(err => console.error('Failed:', err))
```

**优点:**
- ✅ 异步操作，不阻塞UI
- ✅ 更安全，需要用户权限
- ✅ 返回 Promise，易于错误处理

**兼容性:**
- Chrome 63+
- Firefox 53+
- Safari 13.1+
- Edge 79+

#### 降级方案（旧浏览器）

```javascript
const textarea = document.createElement('textarea')
textarea.value = url
document.body.appendChild(textarea)
textarea.select()
document.execCommand('copy')
document.body.removeChild(textarea)
```

**优点:**
- ✅ 兼容性好
- ✅ 简单直接

**缺点:**
- ⚠️ 同步操作
- ⚠️ 已被标记为废弃（但仍广泛支持）

### URL 构建

#### 获取完整 URL

```typescript
// 在服务端获取 base URL
async function fetchDetail(id: string) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  // ...
  return { data, base }
}
```

#### 完整 JSON URL

```typescript
const jsonUrl = `${base}/api/scripts/${scriptId}/download`
// 例如：https://yourdomain.com/api/scripts/cle1234567890/download
```

**注意：** `/download` 端点返回纯JSON数据，不包含API响应包装。

### 状态管理

```typescript
const [copied, setCopied] = useState(false)  // 是否已复制
const [error, setError] = useState(false)    // 是否出错

// 复制成功
setCopied(true)
setTimeout(() => setCopied(false), 2000)

// 复制失败
setError(true)
setTimeout(() => setError(false), 2000)
```

## 用户体验优化

### 1. 视觉反馈

```
点击 → 按钮变色 → 图标变化 → 文本变化 → 2秒后恢复
```

### 2. 防止重复点击

```tsx
disabled={copied}  // 复制成功后禁用按钮2秒
```

### 3. 错误提示

```tsx
{error && (
  <span className="text-red-600">复制失败，请手动复制</span>
)}
```

### 4. Toast 通知（可选增强）

```tsx
import { emitToast } from '@/app/_components/Toaster'

// 复制成功
emitToast('JSON 地址已复制到剪贴板', 'success')

// 复制失败
emitToast('复制失败，请手动复制', 'error')
```

## 使用场景

### 场景 1: 分享给他人

用户可以复制 JSON URL 并分享：
```
https://yourdomain.com/api/scripts/cle1234567890/download
```

对方访问此 URL 即可获取纯 JSON 数据。

### 场景 2: 在开发工具中使用

```bash
# 使用 curl - 直接获取纯JSON
curl https://yourdomain.com/api/scripts/cle1234567890/download

# 使用 wget
wget https://yourdomain.com/api/scripts/cle1234567890/download

# 在代码中使用 - 无需解包
fetch('https://yourdomain.com/api/scripts/cle1234567890/download')
  .then(res => res.json())
  .then(data => console.log(data))  // 直接是剧本数据，无需 .data
```

### 场景 3: API 文档或测试

开发者可以快速获取 API 端点进行测试。

## 实施步骤

### Phase 1: 组件开发
1. ✅ 创建 `CopyJsonUrlButton.tsx` 组件
2. ✅ 实现复制功能（现代API + 降级方案）
3. ✅ 添加状态管理（成功/失败）
4. ✅ 添加视觉反馈

### Phase 2: 集成
5. ✅ 在详情页导入组件
6. ✅ 添加到按钮组
7. ✅ 传递必要的 props

### Phase 3: 优化
8. ✅ 添加响应式样式
9. ✅ 测试不同屏幕尺寸
10. ✅ 测试不同浏览器

### Phase 4: API 路由支持
11. ✅ 修改 `app/api/scripts/[id]/route.ts`
12. ✅ 在 GET/PUT/DELETE 方法中添加 `.json` 后缀处理
13. ✅ 确保向后兼容

## 测试清单

### 功能测试
- [ ] 点击按钮复制URL
- [ ] 复制成功显示提示
- [ ] 复制失败显示错误
- [ ] 2秒后状态自动恢复
- [ ] 复制的URL格式正确
- [ ] URL可以正常访问并返回JSON数据

### 浏览器兼容性
- [ ] Chrome/Edge (现代)
- [ ] Firefox
- [ ] Safari
- [ ] 移动端 Safari
- [ ] 移动端 Chrome
- [ ] IE11 (如需支持)

### 响应式测试
- [ ] 移动端 (320px)
- [ ] 移动端 (375px)
- [ ] 平板端 (768px)
- [ ] 桌面端 (1024px+)

### 边缘情况
- [ ] 离线状态
- [ ] 没有剪贴板权限
- [ ] HTTP vs HTTPS
- [ ] 自定义端口
- [ ] 子域名

## 安全考虑

### 1. URL 暴露

**风险:** 复制的 URL 可以公开访问

**解决:**
- ✅ 已发布的剧本才能访问详情页
- ✅ API 有状态检查（只返回 published 状态）
- ✅ 不包含敏感信息

### 2. 剪贴板权限

**风险:** 某些浏览器需要用户授权

**处理:**
- ✅ 提供降级方案
- ✅ 显示友好的错误提示
- ✅ 可选：显示URL让用户手动复制

## API 路由说明

### 使用 `/download` 端点

复制的URL指向 `/api/scripts/[id]/download` 端点，该端点专门返回纯JSON数据。

**文件:** `app/api/scripts/[id]/download/route.ts`

#### 核心特性

1. **返回纯JSON数据**
   ```typescript
   const res = NextResponse.json(obj)  // obj 是剧本的JSON对象
   ```

2. **支持 `.json` 后缀（可选）**
   ```typescript
   let { id } = await context.params
   // 移除 .json 后缀（如果存在），支持 RESTful 风格的 URL
   id = id.replace(/\.json$/, '')
   ```

3. **自动设置下载头**
   ```typescript
   res.headers.set('Content-Disposition', `attachment; filename*=UTF-8''${filename}`)
   ```

#### 返回格式

**纯JSON，无API包装：**
```json
{
  "meta": {
    "scriptName": "示例剧本",
    "rounds": 3,
    ...
  },
  "roles": [
    {"id": 1, "name": "角色A", ...},
    ...
  ],
  "rounds": [...],
  ...
}
```

**而不是：**
```json
{
  "ok": true,
  "data": {
    "id": "...",
    "title": "...",
    "json": { /* 剧本数据 */ }
  }
}
```

### 兼容性保证

✅ **URL 格式支持：**
- `/api/scripts/{id}/download` → 正常工作
- `/api/scripts/{id}/download.json` → 也正常工作（自动移除 `.json`）

✅ **不影响现有功能：**
- 下载按钮继续使用同一端点
- 复制按钮也使用同一端点
- 返回格式一致

## 相关文件

### 需要创建
- `app/scripts/[id]/CopyJsonUrlButton.tsx` - 复制按钮组件 ✅

### 需要修改
- `app/scripts/[id]/page.tsx` - 详情页面，添加按钮 ✅
- `app/api/scripts/[id]/download/route.ts` - 下载端点，支持 `.json` 后缀 ✅

### 参考
- MDN: Clipboard API
- MDN: document.execCommand (降级方案)
- Next.js: Dynamic Routes

## 成功标准

- [x] 添加"复制JSON地址"按钮
- [x] 点击后成功复制完整URL
- [x] 显示成功/失败反馈
- [x] 支持主流浏览器
- [x] 响应式设计
- [x] 良好的用户体验

## 未来增强

1. **显示 URL 预览**
   ```
   点击前显示：将复制 https://yourdomain.com/api/...
   ```

2. **QR 码生成**
   ```
   生成 JSON URL 的二维码，方便移动端扫描
   ```

3. **批量复制**
   ```
   在列表页支持复制多个剧本的 JSON URL
   ```

4. **API Key 支持**
   ```
   如果未来添加了认证，支持生成带 token 的 URL
   ```

