# Spec 032: 管理员批量上传添加自动生成预览图选项

## 需求概述

在管理员批量上传页面添加一个选项，允许管理员选择是否自动为上传的剧本生成预览图。如果选择自动生成，系统将在上传每个剧本后自动调用预览图生成接口。

## 当前状态

### 现有实现

**文件：** `app/admin/scripts/batch/page.tsx`

**当前流程：**
```
1. 用户选择包含 JSON 文件的文件夹
2. 过滤出所有 .json 文件
3. 逐个解析 JSON 并上传
4. 调用 POST /api/scripts 创建剧本
5. 完成上传
```

**问题：**
- ❌ 上传后没有预览图
- ❌ 用户需要手动访问每个剧本才能触发自动生成
- ❌ 批量上传场景下效率低

### 自动预览图 API

**已有 API：** `GET /api/scripts/[id]/auto-preview`

**功能：**
- 检查是否已存在预览图
- 如果不存在，实时生成 SVG 预览图
- 将预览图保存到本地存储
- 异步保存到数据库（作为 ImageAsset）
- 返回 SVG 内容

## 目标设计

### UI 设计

在批量上传页面添加一个开关按钮：

```
┌─────────────────────────────────────────────────────┐
│ 批量上传剧本                                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────┐      │
│  │  📁 选择文件夹或文件                    │      │
│  │                                         │      │
│  │  [选择文件夹或文件]                    │      │
│  └─────────────────────────────────────────┘      │
│                                                     │
│  ✅ 自动生成预览图                          ⬜⬜⬜ │  ← 新增
│  为所有上传的剧本自动生成预览图                    │
│                                                     │
│  [开始批量上传]  [返回列表]                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 交互流程

#### 流程 A: 不生成预览图（默认）
```
1. 用户选择文件夹/文件
2. 上传设置：自动生成预览图 = OFF
3. 点击"开始批量上传"
4. 逐个上传 JSON
   └─ POST /api/scripts → 创建剧本
5. 完成
```

#### 流程 B: 自动生成预览图（新增）
```
1. 用户选择文件夹/文件
2. 上传设置：自动生成预览图 = ON  ✅
3. 点击"开始批量上传"
4. 逐个上传 JSON
   ├─ POST /api/scripts → 创建剧本
   └─ GET /api/scripts/[id]/auto-preview → 生成预览图 ✅
5. 完成
```

### 状态反馈

#### 上传进度显示

**不生成预览图：**
```
上传中... 3/10
✅ 剧本1.json - 上传成功
✅ 剧本2.json - 上传成功
⏳ 剧本3.json - 上传中...
```

**生成预览图：**
```
上传中... 3/10
✅ 剧本1.json - 上传成功，预览图已生成 ✅
✅ 剧本2.json - 上传成功，预览图已生成 ✅
⏳ 剧本3.json - 正在生成预览图... ⏳
```

## 详细设计

### 1. UI 组件

#### 复选框控件

```tsx
const [autoGeneratePreview, setAutoGeneratePreview] = useState(false)

<div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
  <input
    type="checkbox"
    id="auto-preview"
    checked={autoGeneratePreview}
    onChange={(e) => setAutoGeneratePreview(e.target.checked)}
    className="mt-1 w-5 h-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
  />
  <label htmlFor="auto-preview" className="flex-1 cursor-pointer">
    <div className="font-semibold text-sky-900 mb-1">
      自动生成预览图
    </div>
    <div className="text-sm text-sky-700">
      为每个上传的剧本自动生成预览图，方便管理和浏览
    </div>
  </label>
</div>
```

### 2. 上传逻辑

#### Before（当前实现）

```typescript
for (const f of files) {
  // 1. 解析 JSON
  const text = await f.text()
  const obj = JSON.parse(text)
  
  // 2. 上传剧本
  const title = f.name.replace(/\.json$/i, '')
  const res = await fetch('/api/scripts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, json: obj })
  })
  
  if (!res.ok) {
    // 失败处理
    continue
  }
  
  // 3. 成功
  setSuccess(n => n + 1)
}
```

#### After（新实现）

```typescript
for (const f of files) {
  // 1. 解析 JSON
  const text = await f.text()
  let obj: unknown
  try { 
    obj = JSON.parse(text) 
  } catch {
    setFails(list => [...list, { 
      name: f.name, 
      reason: '非法 JSON 格式' 
    }])
    continue
  }
  
  // 2. 上传剧本
  const title = f.name.replace(/\.json$/i, '')
  const res = await fetch('/api/scripts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, json: obj })
  })
  
  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    setFails(list => [...list, { 
      name: f.name, 
      reason: d?.error?.message || String(res.status) 
    }])
    continue
  }
  
  // 3. 获取创建的剧本 ID
  const result = await res.json()
  const scriptId = result?.data?.id
  
  // 4. 如果启用自动生成预览图，调用生成接口 ✅
  if (autoGeneratePreview && scriptId) {
    try {
      setStatus(prev => ({ ...prev, [f.name]: '正在生成预览图...' }))
      
      const previewRes = await fetch(`/api/scripts/${scriptId}/auto-preview`, {
        method: 'GET'
      })
      
      if (previewRes.ok) {
        console.log(`[Preview] Generated for ${f.name} (${scriptId})`)
      } else {
        console.warn(`[Preview] Failed for ${f.name} (${scriptId})`)
      }
    } catch (error) {
      console.error(`[Preview] Error for ${f.name}:`, error)
      // 预览图生成失败不影响上传成功
    }
  }
  
  // 5. 标记为成功
  setSuccess(n => n + 1)
  setProgress(p => ({ done: p.done + 1, total: p.total }))
}
```

### 3. 状态管理

#### 新增状态

```typescript
// 是否自动生成预览图
const [autoGeneratePreview, setAutoGeneratePreview] = useState(false)

// 每个文件的详细状态
const [fileStatus, setFileStatus] = useState<Record<string, string>>({})
// 例如：
// {
//   "剧本1.json": "上传成功，预览图已生成",
//   "剧本2.json": "正在生成预览图...",
//   "剧本3.json": "上传成功"
// }
```

### 4. 进度反馈

#### 详细状态列表

```tsx
{Object.entries(fileStatus).map(([filename, status]) => (
  <div key={filename} className="flex items-center gap-2 text-sm py-2 border-b">
    <span className="font-mono text-xs text-gray-600 flex-shrink-0 w-48 truncate">
      {filename}
    </span>
    <span className={`flex-1 ${
      status.includes('成功') ? 'text-green-600' :
      status.includes('失败') ? 'text-red-600' :
      'text-blue-600'
    }`}>
      {status}
    </span>
  </div>
))}
```

## 实施步骤

### Phase 1: UI 添加
1. ✅ 添加"自动生成预览图"复选框
2. ✅ 添加状态管理
3. ✅ 更新 UI 样式

### Phase 2: 逻辑实现
4. ✅ 修改上传循环，添加预览图生成调用
5. ✅ 添加错误处理（预览图失败不影响上传）
6. ✅ 更新进度反馈

### Phase 3: 测试验证
7. ✅ 测试不生成预览图（默认）
8. ✅ 测试生成预览图
9. ✅ 测试预览图生成失败的情况
10. ✅ 测试批量上传性能

## 性能考虑

### 时间估算

**每个剧本：**
- 上传 JSON: ~200-500ms
- 生成预览图: ~1000-2000ms（首次）
- **总计**: ~1.2-2.5s/个

**批量上传 10 个剧本：**
- 不生成预览图: ~2-5s
- 生成预览图: ~12-25s

### 优化方案

#### 方案 A: 顺序生成（当前方案）
```
剧本1 → 上传 → 生成预览 → 完成
剧本2 → 上传 → 生成预览 → 完成
剧本3 → 上传 → 生成预览 → 完成
```

**优点：**
- 实现简单
- 错误处理清晰
- 资源占用稳定

**缺点：**
- 时间较长

#### 方案 B: 批量并行（未来优化）
```
批量上传 → [剧本1, 剧本2, 剧本3...]
           ↓
批量生成预览 → Promise.all([预览1, 预览2, 预览3...])
```

**优点：**
- 速度更快

**缺点：**
- 实现复杂
- 资源占用高
- 错误处理复杂

**推荐：** 先实施方案 A，未来根据需求考虑方案 B

## 错误处理

### 场景 1: JSON 解析失败
```
结果：跳过该文件，记录失败
预览图：不生成
```

### 场景 2: 剧本上传失败
```
结果：记录失败
预览图：不生成
```

### 场景 3: 剧本上传成功，预览图生成失败
```
结果：✅ 剧本上传成功
预览图：❌ 记录警告，但不影响整体成功
```

**处理逻辑：**
```typescript
if (autoGeneratePreview && scriptId) {
  try {
    await fetch(`/api/scripts/${scriptId}/auto-preview`)
    // 成功 - 静默处理
  } catch (error) {
    console.warn(`Preview generation failed for ${scriptId}:`, error)
    // 失败 - 仅记录日志，不影响上传状态
  }
}
```

## UI/UX 改进

### 1. 加载状态指示器

```tsx
{loading && autoGeneratePreview && (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
    <div className="flex items-center gap-2 text-blue-700">
      <svg className="animate-spin w-5 h-5" /* ... */>...</svg>
      <span>正在上传并生成预览图，这可能需要几分钟...</span>
    </div>
  </div>
)}
```

### 2. 成功统计

```tsx
{msg && (
  <div className="grid grid-cols-2 gap-4">
    <div className="p-4 bg-green-50 rounded-xl">
      <div className="text-2xl font-bold text-green-700">
        {success}
      </div>
      <div className="text-sm text-green-600">
        剧本上传成功
      </div>
    </div>
    {autoGeneratePreview && (
      <div className="p-4 bg-blue-50 rounded-xl">
        <div className="text-2xl font-bold text-blue-700">
          {previewSuccess}
        </div>
        <div className="text-sm text-blue-600">
          预览图已生成
        </div>
      </div>
    )}
  </div>
)}
```

### 3. 提示信息

```tsx
{autoGeneratePreview && files.length > 10 && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
    <div className="flex items-start gap-2">
      <svg className="w-5 h-5 text-yellow-600 mt-0.5" /* ... */>...</svg>
      <div className="text-sm text-yellow-800">
        <div className="font-semibold mb-1">提示</div>
        <div>
          您选择了 {files.length} 个文件并启用了自动生成预览图，
          预计需要约 {Math.ceil(files.length * 2 / 60)} 分钟完成。
        </div>
      </div>
    </div>
  </div>
)}
```

## 测试用例

### 测试 1: 默认行为（不生成预览图）
```
前置条件：
- 准备 5 个有效的 JSON 文件

步骤：
1. 访问批量上传页面
2. 选择文件夹
3. 不勾选"自动生成预览图"
4. 点击"开始批量上传"

验证：
✅ 所有剧本上传成功
✅ 上传速度快（~2-5s）
✅ 剧本列表中没有预览图（需手动访问详情页触发）
```

### 测试 2: 启用自动生成预览图
```
前置条件：
- 准备 3 个有效的 JSON 文件

步骤：
1. 访问批量上传页面
2. 选择文件夹
3. ✅ 勾选"自动生成预览图"
4. 点击"开始批量上传"

验证：
✅ 所有剧本上传成功
✅ 每个剧本都生成了预览图
✅ 上传时间较长（~4-8s）
✅ 进度反馈显示"正在生成预览图..."
✅ 完成后显示预览图生成数量
```

### 测试 3: 预览图生成失败
```
前置条件：
- 准备包含无效 JSON 结构的文件（能解析但无法生成预览图）

步骤：
1. 勾选"自动生成预览图"
2. 上传文件

验证：
✅ 剧本上传成功
⚠️ 预览图生成失败（记录警告）
✅ 不影响整体上传成功状态
✅ 控制台显示警告信息
```

### 测试 4: 批量混合测试
```
前置条件：
- 10 个文件：5 个有效，3 个 JSON 格式错误，2 个无效剧本数据

步骤：
1. 勾选"自动生成预览图"
2. 批量上传

验证：
✅ 5 个有效剧本上传成功
✅ 5 个有效剧本预览图已生成
❌ 3 个格式错误文件失败
❌ 2 个无效数据文件失败
✅ 失败列表显示详细原因
```

## 相关文件

### 需要修改
- `app/admin/scripts/batch/page.tsx` - 批量上传页面

### 参考文件
- `app/api/scripts/[id]/auto-preview/route.ts` - 预览图生成 API
- `app/api/scripts/route.ts` - 创建剧本 API
- `app/my/uploads/page.tsx` - 前台上传页面（参考）

## 成功标准

- [x] UI 添加"自动生成预览图"复选框
- [x] 勾选后自动为每个上传的剧本生成预览图
- [x] 显示预览图生成进度
- [x] 预览图生成失败不影响剧本上传
- [x] 完成后统计预览图生成数量
- [x] 所有测试用例通过

## 后续优化

1. **并行生成**：实现批量并行生成预览图
2. **预览图质量选项**：允许选择预览图分辨率/质量
3. **断点续传**：支持中断后继续上传
4. **后台任务**：将预览图生成移到后台队列
5. **批量预览**：完成后批量预览所有生成的图片

