# 内容一致性说明

## 核心原则

**"复制JSON地址"按钮复制的URL，在浏览器中打开时显示的内容，应该和"复制JSON内容"按钮复制的内容完全一致。**

## 实现方式

### 1. 复制JSON内容按钮

```typescript
// app/scripts/[id]/CopyJsonButtons.tsx - CopyJsonContentButton

async function handleCopy() {
  // 1. 获取JSON数据
  const response = await fetch(`${baseUrl}/api/scripts/${scriptId}/download`)
  const jsonData = await response.json()
  
  // 2. 格式化JSON（缩进2空格）
  const jsonString = JSON.stringify(jsonData, null, 2)
  
  // 3. 复制到剪贴板
  await navigator.clipboard.writeText(jsonString)
}
```

### 2. 复制JSON地址按钮

```typescript
// app/scripts/[id]/CopyJsonButtons.tsx - CopyJsonUrlButton

async function handleCopy() {
  // 复制URL
  const url = `${baseUrl}/api/scripts/${scriptId}.json`
  await navigator.clipboard.writeText(url)
}
```

### 3. JSON地址API

```typescript
// app/api/scripts/[id].json/route.ts

export async function GET(req, context) {
  // 1. 获取JSON数据
  const obj = JSON.parse(v.content)
  
  // 2. 格式化JSON（缩进2空格）- 关键！
  const jsonString = JSON.stringify(obj, null, 2)
  
  // 3. 返回格式化的字符串
  return new NextResponse(jsonString, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}
```

## 关键代码

两个地方都使用相同的格式化方式：

```javascript
JSON.stringify(data, null, 2)
```

**参数说明：**
- `data` - JSON对象
- `null` - replacer函数（不使用）
- `2` - 缩进空格数

## 输出示例

无论是"复制JSON内容"还是访问"复制JSON地址"的URL，都会得到：

```json
{
  "meta": {
    "scriptName": "示例剧本",
    "rounds": 3,
    "playerCount": 7
  },
  "roles": [
    {
      "id": 1,
      "name": "角色A",
      "type": "好人"
    },
    {
      "id": 2,
      "name": "角色B",
      "type": "坏人"
    }
  ],
  "rounds": [
    {
      "round": 1,
      "events": []
    }
  ]
}
```

**特点：**
- ✅ 每个属性一行
- ✅ 缩进2个空格
- ✅ 易于阅读
- ✅ 可以直接编辑

## 对比：格式化 vs 压缩

### ❌ 压缩的JSON（如果使用 NextResponse.json()）

```json
{"meta":{"scriptName":"示例剧本","rounds":3},"roles":[{"id":1,"name":"角色A"}]}
```

**问题：**
- 难以阅读
- 无法直观查看结构
- 不便于编辑

### ✅ 格式化的JSON（使用 JSON.stringify(obj, null, 2)）

```json
{
  "meta": {
    "scriptName": "示例剧本",
    "rounds": 3
  },
  "roles": [
    {
      "id": 1,
      "name": "角色A"
    }
  ]
}
```

**优点：**
- 清晰易读
- 结构一目了然
- 便于编辑

## 验证方法

### 方法1: 浏览器开发者工具

1. 点击"复制JSON内容"
2. 粘贴到记事本，保存为 `content.json`
3. 点击"复制JSON地址"
4. 在浏览器中打开URL，右键保存为 `url.json`
5. 比较两个文件：
   ```bash
   diff content.json url.json
   ```
   **结果：** 完全相同 ✅

### 方法2: 命令行验证

```bash
# 复制JSON内容（保存到文件）
# content.json

# 访问JSON地址
curl https://yourdomain.com/api/scripts/abc123.json > url.json

# 比较
diff content.json url.json
# 输出为空，表示完全相同 ✅
```

### 方法3: JavaScript验证

```javascript
// 1. 获取"复制JSON内容"的结果
const content = '...' // 从剪贴板粘贴

// 2. 获取"复制JSON地址"的URL内容
const response = await fetch('https://yourdomain.com/api/scripts/abc123.json')
const urlContent = await response.text()

// 3. 比较
console.log(content === urlContent)  // true ✅
```

## 为什么这很重要？

### 1. 用户体验一致性

用户期望两种方式获得的内容相同：
- 复制内容 → 直接拿到JSON
- 复制地址 → 访问后拿到相同的JSON

### 2. 调试方便

如果格式不同：
- 复制内容：格式化
- 复制地址：压缩

→ 用户会困惑为什么不一样

### 3. 分享场景

```
用户A: "我复制了JSON内容，你看看"
用户B: "我访问了你的JSON地址，内容不一样啊"
用户A: "啊？为什么？"
```

避免这种情况 ✅

### 4. 编辑工作流

```
1. 复制JSON地址
2. 在浏览器中打开
3. 复制内容到编辑器
4. 编辑
5. 使用
```

如果格式不一致，编辑时需要重新格式化。

## 实现检查清单

- [x] `CopyJsonContentButton` 使用 `JSON.stringify(data, null, 2)` ✅
- [x] `/api/scripts/[id].json` 使用 `JSON.stringify(obj, null, 2)` ✅
- [x] 两者返回的内容格式完全一致 ✅
- [x] HTTP响应头正确设置 ✅
- [x] 浏览器中可以正确显示 ✅

## 注意事项

### 不要使用 NextResponse.json()

```typescript
// ❌ 错误：返回压缩的JSON
return NextResponse.json(obj)

// ✅ 正确：返回格式化的JSON
const jsonString = JSON.stringify(obj, null, 2)
return new NextResponse(jsonString, {
  headers: { 'Content-Type': 'application/json; charset=utf-8' }
})
```

### Content-Type 必须正确

```typescript
headers: {
  'Content-Type': 'application/json; charset=utf-8'  // 必须包含
}
```

这样浏览器才能正确识别并高亮显示JSON。

## 总结

✅ **两种方式，同样的内容，一致的体验**

```
复制JSON内容 = 复制JSON地址（在浏览器打开）
```

这是最佳的用户体验设计。

