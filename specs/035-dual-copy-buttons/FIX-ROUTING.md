# 路由问题修复

## 问题描述

创建的 `app/api/scripts/[id].json/route.ts` 文件无法正确工作。

**原因：** Next.js不支持 `[id].json` 这种动态路由文件夹名称。

## 错误的路由结构

```
❌ app/api/scripts/[id].json/route.ts
```

**问题：**
- Next.js无法正确解析 `[id].json` 作为文件夹名
- 请求 `/api/scripts/abc123.json` 时，匹配到 `/api/scripts/[id]`，而不是 `[id].json`
- 导致返回API响应格式 `{"ok":true,"data":{...}}` 而不是纯JSON

## 正确的解决方案

### 方案：在现有路由中判断URL格式

**文件：** `app/api/scripts/[id]/route.ts`

```typescript
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  let { id } = await context.params
  
  // 1. 检查URL是否以 .json 结尾
  const url = new URL(req.url)
  const isJsonFormat = url.pathname.endsWith('.json')
  
  // 2. 移除 .json 后缀
  id = id.replace(/\.json$/, '')
  
  // 3. 获取数据
  const scriptData = await getCachedData(...)
  
  // 4. 根据URL格式返回不同内容
  if (isJsonFormat && scriptData.json) {
    // 返回格式化的纯JSON
    const jsonString = JSON.stringify(scriptData.json, null, 2)
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'inline; filename*=UTF-8\'\'custom-script.json'
      }
    })
  }
  
  // 返回API响应格式
  return ok(scriptData)
}
```

## 工作原理

### URL匹配

```
请求: /api/scripts/abc123.json
       ↓
匹配: app/api/scripts/[id]/route.ts
       ↓
参数: { id: "abc123.json" }
       ↓
处理: 
  1. url.pathname.endsWith('.json') → true
  2. id = "abc123.json".replace(/\.json$/, '') → "abc123"
  3. 获取数据
  4. 返回格式化的纯JSON ✅
```

### 两种URL格式

| URL | 返回内容 | 用途 |
|-----|----------|------|
| `/api/scripts/{id}` | `{"ok":true,"data":{...}}` | API调用 |
| `/api/scripts/{id}.json` | `{剧本JSON...}` | 血染钟楼官网 |

## 返回内容对比

### 不带 .json 后缀

```
请求: /api/scripts/abc123
返回:
{
  "ok": true,
  "data": {
    "id": "abc123",
    "title": "示例剧本",
    "json": { /* 剧本数据 */ }
  }
}
```

### 带 .json 后缀

```
请求: /api/scripts/abc123.json
返回:
{
  /* 直接返回剧本的JSON数据 */
  "meta": {...},
  "roles": [...],
  ...
}
```

## 关键代码

### 判断URL格式

```typescript
const url = new URL(req.url)
const isJsonFormat = url.pathname.endsWith('.json')
```

### 返回格式化JSON

```typescript
if (isJsonFormat && scriptData.json) {
  const jsonString = JSON.stringify(scriptData.json, null, 2)
  return new NextResponse(jsonString, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'inline; filename*=UTF-8\'\'custom-script.json'
    }
  })
}
```

### 注意：使用 scriptData.json

```typescript
// scriptData 的结构
{
  id: "...",
  title: "...",
  author: "...",
  json: { /* 这才是剧本的实际JSON内容 */ }
}

// 所以要返回 scriptData.json，不是 scriptData
const jsonString = JSON.stringify(scriptData.json, null, 2)
```

## 测试验证

### 测试不带 .json

```bash
curl https://yourdomain.com/api/scripts/abc123

# 返回 API 格式
{"ok":true,"data":{...}}
```

### 测试带 .json

```bash
curl https://yourdomain.com/api/scripts/abc123.json

# 返回纯 JSON（格式化）
{
  "meta": {...},
  "roles": [...]
}
```

## 文件清单

### 删除
- ❌ `app/api/scripts/[id].json/route.ts` - 删除（错误的路由）

### 修改
- ✅ `app/api/scripts/[id]/route.ts` - 添加 URL 格式判断

### 更新
- ✅ 导入 `NextResponse`
- ✅ 添加 `isJsonFormat` 判断
- ✅ 添加条件返回逻辑

## 优势

1. **单一路由文件** - 不需要创建额外的路由文件
2. **向后兼容** - 不影响现有API调用
3. **灵活性** - 根据URL自动选择返回格式
4. **简单维护** - 所有逻辑在一个文件中

## 总结

通过在现有路由中判断URL是否以 `.json` 结尾，我们可以：
- ✅ 支持两种URL格式
- ✅ 返回不同的内容格式
- ✅ 避免Next.js路由限制
- ✅ 保持代码简洁

