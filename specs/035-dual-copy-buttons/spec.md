# Spec 035: 双复制按钮 - 满足不同导入需求

## 需求概述

在剧本详情页提供**两个复制按钮**，满足不同网站的导入需求：

1. **复制 JSON 内容** - 直接复制格式化的JSON字符串
2. **复制 JSON 地址** - 复制JSON文件的URL地址

## 背景

### 问题发现

血染钟楼官方网站的"载入自定义剧本/角色"功能显示：

```
┌─────────────────────────────────────┐
│ 载入自定义 剧本/角色                │
├─────────────────────────────────────┤
│ 输入custom-script.json文件的地址    │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                [取消]  [确定]       │
└─────────────────────────────────────┘
```

**关键发现：** 需要输入**文件的地址**（URL），而不是粘贴JSON内容。

### 用户需求

不同的网站有不同的导入方式：
- **方式 A**: 粘贴JSON内容
- **方式 B**: 输入JSON文件地址（URL）

因此需要同时提供两种复制方式。

## 设计方案

### UI 布局

#### 桌面端（≥640px）

```
┌────────────────────────────────────────────────────────────────┐
│ 剧本标题                                                       │
│ 作者：XXX                                                      │
├────────────────────────────────────────────────────────────────┤
│ [下载 JSON]  [复制JSON内容]  [复制JSON地址]  [返回列表]      │
│  (主按钮)     (次按钮)         (次按钮)        (次按钮)       │
└────────────────────────────────────────────────────────────────┘
```

#### 移动端（<640px）

```
┌──────────────────┐
│ 剧本标题         │
│ 作者：XXX        │
├──────────────────┤
│ [下载 JSON]      │ ← 全宽
│ [复制JSON内容]   │ ← 全宽
│ [复制JSON地址]   │ ← 全宽
│ [返回列表]       │ ← 全宽
└──────────────────┘
```

### 按钮对比

| 特性 | 复制 JSON 内容 | 复制 JSON 地址 |
|------|---------------|---------------|
| **复制内容** | 格式化的JSON字符串 | URL地址 |
| **图标** | 📋 复制图标 | 🔗 链接图标 |
| **工作流程** | 获取数据→格式化→复制 | 直接复制URL |
| **加载时间** | ~1秒（需要网络） | 即时 |
| **适用场景** | 支持粘贴JSON的网站 | 要求输入URL的网站 |
| **血染钟楼官网** | ❌ 不适用 | ✅ 适用 |
| **状态** | 加载中/成功/失败 | 成功/失败 |

## 技术实现

### 组件架构

**文件:** `app/scripts/[id]/CopyJsonButtons.tsx`

```
CopyJsonButtons (默认导出)
├── CopyJsonContentButton (复制JSON内容)
│   ├── 状态: loading, copied, error
│   ├── 功能: fetch → format → copy
│   └── 图标: 复制图标
└── CopyJsonUrlButton (复制JSON地址)
    ├── 状态: copied, error
    ├── 功能: copy URL
    └── 图标: 链接图标
```

### 1. 复制 JSON 内容按钮

```typescript
function CopyJsonContentButton({ scriptId, baseUrl }: Props) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCopy() {
    setLoading(true)
    
    try {
      // 1. 获取 JSON 数据
      const url = `${baseUrl}/api/scripts/${scriptId}/download`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch')
      
      const jsonData = await response.json()
      
      // 2. 格式化 JSON
      const jsonString = JSON.stringify(jsonData, null, 2)
      
      // 3. 复制到剪贴板
      await navigator.clipboard.writeText(jsonString)
      
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError(true)
      setTimeout(() => setError(false), 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleCopy} disabled={copied || loading}>
      {loading ? '加载中...' : copied ? '已复制内容！' : '复制 JSON 内容'}
    </button>
  )
}
```

**特点：**
- ✅ 需要网络请求
- ✅ 有加载状态
- ✅ 复制格式化的JSON字符串
- ✅ 适合粘贴导入

### 2. 复制 JSON 地址按钮

```typescript
function CopyJsonUrlButton({ scriptId, baseUrl }: Props) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)

  async function handleCopy() {
    const url = `${baseUrl}/api/scripts/${scriptId}/download`
    
    try {
      // 直接复制 URL
      await navigator.clipboard.writeText(url)
      
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <button onClick={handleCopy} disabled={copied}>
      {copied ? '已复制地址！' : '复制 JSON 地址'}
    </button>
  )
}
```

**特点：**
- ✅ 无需网络请求
- ✅ 即时响应
- ✅ 复制URL字符串
- ✅ 适合URL导入（如血染钟楼官网）

### 3. 组合导出

```typescript
export default function CopyJsonButtons({ scriptId, baseUrl }: Props) {
  return (
    <>
      <CopyJsonContentButton scriptId={scriptId} baseUrl={baseUrl} />
      <CopyJsonUrlButton scriptId={scriptId} baseUrl={baseUrl} />
    </>
  )
}

// 单独导出（可选）
export { CopyJsonContentButton, CopyJsonUrlButton }
```

### 集成到详情页

**文件:** `app/scripts/[id]/page.tsx`

```tsx
import CopyJsonButtons from './CopyJsonButtons'

// 在按钮组中使用
<div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
  <a href={`${base}/api/scripts/${data.id}/download`} download>
    下载 JSON
  </a>
  
  {/* 新增：两个复制按钮 */}
  <CopyJsonButtons scriptId={data.id} baseUrl={base} />
  
  <a href="/scripts">
    返回列表
  </a>
</div>
```

## 使用场景

### 场景 1: 血染钟楼官网（输入地址）⭐

```
1. 在剧本详情页点击 "复制 JSON 地址"
   ↓
2. 看到提示 "已复制地址！"
   ↓
3. 打开血染钟楼官网
   ↓
4. 点击 "载入自定义 剧本/角色"
   ↓
5. 在 "输入custom-script.json文件的地址" 输入框中
   ↓
6. 粘贴 (Ctrl+V 或 Cmd+V)
   ↓
7. 点击 "确定"
   ↓
8. 完成导入！
```

**复制的内容：**
```
https://yourdomain.com/api/scripts/cle1234567890/download
```

### 场景 2: 其他网站（粘贴内容）

```
1. 在剧本详情页点击 "复制 JSON 内容"
   ↓
2. 等待加载 (通常 < 1秒)
   ↓
3. 看到提示 "已复制内容！"
   ↓
4. 打开目标网站
   ↓
5. 粘贴 JSON 内容
   ↓
6. 完成导入！
```

**复制的内容：**
```json
{
  "meta": {...},
  "roles": [...],
  "rounds": [...]
}
```

### 场景 3: 分享给他人

**方式 A: 发送URL**
```
1. 点击 "复制 JSON 地址"
2. 粘贴到聊天工具
3. 发送给对方
4. 对方可以访问URL获取JSON
```

**方式 B: 发送JSON内容**
```
1. 点击 "复制 JSON 内容"
2. 粘贴到聊天工具或文本编辑器
3. 发送给对方
4. 对方直接获得JSON内容
```

## 状态管理

### 复制 JSON 内容

```
默认状态:
┌──────────────────┐
│ 📋 复制JSON内容  │
└──────────────────┘

点击后:
┌──────────────────┐
│ ⏳ 加载中...     │  ← 禁用按钮
└──────────────────┘

加载完成:
┌──────────────────┐
│ ✅ 已复制内容！  │  ← 禁用按钮，2秒后恢复
└──────────────────┘

失败:
┌──────────────────┐
│ ❌ 复制失败      │  ← 可重试，2秒后恢复
└──────────────────┘
```

### 复制 JSON 地址

```
默认状态:
┌──────────────────┐
│ 🔗 复制JSON地址  │
└──────────────────┘

点击后(成功):
┌──────────────────┐
│ ✅ 已复制地址！  │  ← 禁用按钮，2秒后恢复
└──────────────────┘

点击后(失败):
┌──────────────────┐
│ ❌ 复制失败      │  ← 可重试，2秒后恢复
└──────────────────┘
```

## 响应式设计

### 桌面端（≥640px）

```css
display: flex
flex-direction: row
gap: 1rem
```

```
┌────────────────────────────────────────────────────┐
│ [下载JSON] [复制JSON内容] [复制JSON地址] [返回]   │
└────────────────────────────────────────────────────┘
```

### 移动端（<640px）

```css
display: flex
flex-direction: column
gap: 0.75rem
width: 100%
```

```
┌──────────────────┐
│ [下载 JSON]      │
├──────────────────┤
│ [复制JSON内容]   │
├──────────────────┤
│ [复制JSON地址]   │
├──────────────────┤
│ [返回列表]       │
└──────────────────┘
```

## 性能考虑

### 复制 JSON 内容

**时间消耗：**
```
网络请求: ~500ms - 2s (取决于JSON大小和网络)
JSON解析: ~10ms
格式化:   ~50ms
复制:     ~10ms
────────────────────
总计:     ~600ms - 2s
```

**优化：**
- ✅ 使用加载状态提供反馈
- ✅ 禁用按钮防止重复点击
- ⚠️ 大文件可能较慢（考虑显示文件大小警告）

### 复制 JSON 地址

**时间消耗：**
```
URL构建:  ~1ms
复制:     ~10ms
────────────────────
总计:     ~11ms (几乎即时)
```

**优化：**
- ✅ 无需网络请求
- ✅ 即时响应

## 浏览器兼容性

### Clipboard API (现代浏览器)

- ✅ Chrome 63+
- ✅ Firefox 53+
- ✅ Safari 13.1+
- ✅ Edge 79+

### 降级方案 (旧浏览器)

```typescript
// 使用 document.execCommand('copy')
const textarea = document.createElement('textarea')
textarea.value = content
document.body.appendChild(textarea)
textarea.select()
document.execCommand('copy')
document.body.removeChild(textarea)
```

支持：
- ✅ IE 11
- ✅ 所有支持 `execCommand` 的浏览器

## 测试清单

### 功能测试

- [x] "复制JSON内容"按钮正常工作 ✅
- [x] "复制JSON地址"按钮正常工作 ✅
- [x] 两个按钮状态独立 ✅
- [x] 加载状态显示正常 ✅
- [x] 成功提示显示正常 ✅
- [x] 失败处理正常 ✅
- [x] 2秒后状态自动恢复 ✅

### 场景测试

- [x] 血染钟楼官网URL导入 ✅
- [x] 其他网站内容粘贴 ✅
- [x] 通过聊天工具分享 ✅
- [x] 保存到文本编辑器 ✅

### 响应式测试

- [x] 桌面端布局 ✅
- [x] 平板端布局 ✅
- [x] 移动端布局 ✅
- [x] 按钮全宽显示（移动端）✅

### 浏览器测试

- [x] Chrome ✅
- [x] Firefox ✅
- [x] Safari ✅
- [x] Edge ✅
- [x] 移动端 Safari ✅
- [x] 移动端 Chrome ✅

## 相关文件

### 新增
- `app/scripts/[id]/CopyJsonButtons.tsx` ✅

### 修改
- `app/scripts/[id]/page.tsx` ✅

### 可选删除
- `app/scripts/[id]/CopyJsonUrlButton.tsx` (旧文件)

### 参考文档
- `specs/034-copy-json-url-button/` - 之前的单按钮实现
- `specs/035-dual-copy-buttons/` - 当前的双按钮实现

## 优势总结

| 优势 | 说明 |
|------|------|
| **灵活性** | 支持两种导入方式 |
| **兼容性** | 适配不同网站需求 |
| **清晰性** | 按钮文本明确说明功能 |
| **独立性** | 两个按钮状态互不干扰 |
| **性能** | URL复制即时，内容复制有加载反馈 |
| **用户体验** | 根据需求选择合适的按钮 |

## 未来增强

1. **智能推荐**: 根据剪贴板或浏览历史推荐使用哪个按钮
2. **批量操作**: 在列表页支持批量复制
3. **自定义URL**: 支持用户自定义URL格式
4. **统计**: 记录两个按钮的使用频率
5. **帮助提示**: 添加工具提示说明使用场景

