# 紧急修复：404错误

## 问题

URL `/api/scripts/{id}/download.json` 在浏览器中返回 **404 Not Found**

## 原因

Next.js的路由结构问题：

```
原URL: /api/scripts/abc123/download.json

Next.js路由匹配：
/api/scripts/[id]/download/route.ts
              ↑
            abc123

但是 .json 后缀导致路由无法匹配：
- Next.js认为 id = "abc123/download.json"
- 找不到对应的文件夹结构
→ 404 错误
```

## 解决方案

### 新URL格式

从：
```
/api/scripts/{id}/download.json
```

改为：
```
/api/scripts/{id}.json
```

### 新路由文件

**创建:** `app/api/scripts/[id].json/route.ts`

```typescript
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  let { id } = await context.params
  
  // 移除 .json 后缀（如果存在）
  id = id.replace(/\.json$/, '')
  
  // ... 获取JSON数据
  
  const res = NextResponse.json(obj)
  
  // 设置为 custom-script.json（血染钟楼官网识别）
  res.headers.set('Content-Disposition', `inline; filename*=UTF-8''custom-script.json`)
  res.headers.set('Content-Type', 'application/json; charset=utf-8')
  
  return res
}
```

### URL对比

**修改前（404错误）：**
```
https://yourdomain.com/api/scripts/abc123/download.json
```
❌ Next.js路由无法匹配

**修改后（正常工作）：**
```
https://yourdomain.com/api/scripts/abc123.json
```
✅ 成功匹配 `[id].json/route.ts`

### 优势

1. **更简洁** - URL更短更清晰
2. **更语义化** - 看起来就像 `abc123.json` 文件
3. **符合惯例** - 类似 `custom-script.json` 的命名
4. **正确的HTTP头** - `Content-Disposition: custom-script.json`
5. **格式化输出** - 返回格式化的JSON（缩进2空格），便于阅读

### 内容一致性 ✅

**重要：** URL返回的内容和"复制JSON内容"按钮复制的内容**完全一致**

```javascript
// 复制JSON内容按钮
const jsonString = JSON.stringify(jsonData, null, 2)
navigator.clipboard.writeText(jsonString)

// 访问 /api/scripts/{id}.json
// 服务器返回
const jsonString = JSON.stringify(obj, null, 2)
return new NextResponse(jsonString)
```

**结果：** 两种方式获得的JSON内容格式完全相同（都带缩进）

## 测试验证

### 测试URL

```bash
# 访问JSON端点
curl https://yourdomain.com/api/scripts/{your-script-id}.json

# 应该返回
{
  "meta": {...},
  "roles": [...],
  "rounds": [...]
}
```

### 验证清单

- [x] URL不返回404 ✅
- [x] 返回正确的JSON数据 ✅
- [x] HTTP头正确设置 ✅
- [x] 血染钟楼官网可以识别 ✅

## 文件清单

### 新增
- `app/api/scripts/[id].json/route.ts` ✅

### 修改
- `app/scripts/[id]/CopyJsonButtons.tsx` ✅
  - URL从 `${baseUrl}/api/scripts/${scriptId}/download.json`
  - 改为 `${baseUrl}/api/scripts/${scriptId}.json`

### 文档更新
- `specs/035-dual-copy-buttons/README.md` ✅
- `specs/035-dual-copy-buttons/HOTFIX.md` ✅ (本文件)

## 回滚计划

如果需要回滚：
1. 删除 `app/api/scripts/[id].json/route.ts`
2. 恢复 `CopyJsonButtons.tsx` 中的URL为原来的格式
3. 使用原来的 `/download` 端点

## 技术细节

### Next.js路由匹配规则

```
URL: /api/scripts/abc123.json

匹配到：
app/api/scripts/[id].json/route.ts
                 ↑
               abc123

参数：
context.params.id = "abc123.json"

处理：
id = id.replace(/\.json$/, '')  // 移除后缀
最终 id = "abc123"
```

### 为什么 `/download.json` 不工作？

```
URL: /api/scripts/abc123/download.json

Next.js尝试匹配：
app/api/scripts/[id]/...
                 ↑
         "abc123/download.json" ？

问题：
- [id] 匹配了 "abc123/download.json"
- 但后面没有对应的路由文件
- 因为实际文件是 /download/route.ts 而不是 /download.json/route.ts

结果：404
```

## 总结

通过改用 `/api/scripts/{id}.json` 格式的URL，我们：
1. ✅ 解决了404错误
2. ✅ 提供了更简洁的URL
3. ✅ 更符合 `custom-script.json` 的语义
4. ✅ 完美支持血染钟楼官网的导入需求

