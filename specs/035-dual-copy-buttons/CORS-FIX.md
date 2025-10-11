# CORS 错误修复

## 问题描述

血染钟楼官网尝试访问你的API时报错：

```
Access to fetch at 'http://localhost:3000/api/scripts/xxx.json' 
from origin 'https://clocktower.gstonegames.com' 
has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 根本原因

### 什么是CORS？

**CORS（Cross-Origin Resource Sharing，跨域资源共享）** 是浏览器的安全机制。

**场景：**
```
血染钟楼官网（域名A）: https://clocktower.gstonegames.com
你的API（域名B）:      http://localhost:3000
```

**问题：**
- 域名不同
- 协议可能不同（https vs http）
- 浏览器默认阻止跨域请求

### 错误详解

```javascript
// 血染钟楼官网的JavaScript代码
fetch('http://localhost:3000/api/scripts/xxx.json')
  ↓
浏览器检查：请求来自 https://clocktower.gstonegames.com
目标是：      http://localhost:3000
  ↓
跨域！检查响应头是否有 Access-Control-Allow-Origin
  ↓
没有！
  ↓
❌ 阻止请求，报CORS错误
```

## 解决方案

### 添加CORS响应头

在API响应中添加允许跨域访问的HTTP头：

```typescript
headers: {
  'Access-Control-Allow-Origin': '*',  // 允许所有域名访问
  'Access-Control-Allow-Methods': 'GET, OPTIONS',  // 允许的HTTP方法
  'Access-Control-Allow-Headers': 'Content-Type'  // 允许的请求头
}
```

### 实现代码

**文件：** `app/api/scripts/[id]/route.ts`

#### 1. OPTIONS 预检请求

```typescript
// 处理 CORS 预检请求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
```

#### 2. GET 请求添加CORS头

```typescript
export async function GET(req: NextRequest, context) {
  // ... 获取数据
  
  if (isJsonFormat && scriptData.json) {
    const jsonString = JSON.stringify(scriptData.json, null, 2)
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'inline; filename*=UTF-8\'\'custom-script.json',
        // CORS 头
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }
  
  // ...
}
```

## 工作流程

### 修复前（失败）

```
1. 血染钟楼官网发起请求
   fetch('http://localhost:3000/api/scripts/xxx.json')
   ↓
2. 你的服务器返回JSON
   响应头：只有 Content-Type
   ↓
3. 浏览器检查CORS
   ❌ 没有 Access-Control-Allow-Origin
   ↓
4. 浏览器阻止
   ❌ CORS错误
```

### 修复后（成功）

```
1. 血染钟楼官网发起请求
   fetch('http://localhost:3000/api/scripts/xxx.json')
   ↓
2. 你的服务器返回JSON
   响应头：
   - Content-Type: application/json
   - Access-Control-Allow-Origin: *  ✅
   ↓
3. 浏览器检查CORS
   ✅ 有 Access-Control-Allow-Origin: *
   ↓
4. 浏览器允许
   ✅ 官网成功获取JSON数据
```

## CORS 头详解

### Access-Control-Allow-Origin

```typescript
'Access-Control-Allow-Origin': '*'
```

**含义：** 允许所有域名访问

**选项：**
- `'*'` - 允许任何域名（推荐，因为这是公开的JSON数据）
- `'https://clocktower.gstonegames.com'` - 只允许血染钟楼官网
- `'https://example.com'` - 只允许特定域名

**我们选择 `'*'` 的原因：**
- ✅ 剧本JSON是公开数据
- ✅ 任何网站都可以访问
- ✅ 简单方便
- ✅ 支持其他可能的血染钟楼工具网站

### Access-Control-Allow-Methods

```typescript
'Access-Control-Allow-Methods': 'GET, OPTIONS'
```

**含义：** 允许的HTTP方法

- `GET` - 获取数据
- `OPTIONS` - CORS预检请求

### Access-Control-Allow-Headers

```typescript
'Access-Control-Allow-Headers': 'Content-Type'
```

**含义：** 允许的请求头

### OPTIONS 预检

某些跨域请求会先发送 `OPTIONS` 请求（预检），浏览器检查：
1. 服务器是否允许跨域
2. 允许哪些方法
3. 允许哪些请求头

如果预检通过，才发送真正的请求（GET）。

## 测试验证

### 方法1: 浏览器开发者工具

1. 打开血染钟楼官网
2. F12 打开开发者工具
3. 切换到 Network 标签
4. 输入你的JSON URL
5. 查看请求：
   ```
   Request Headers:
   Origin: https://clocktower.gstonegames.com
   
   Response Headers:
   Access-Control-Allow-Origin: *  ✅
   ```

### 方法2: curl 测试

```bash
# 测试GET请求
curl -H "Origin: https://clocktower.gstonegames.com" \
     -I \
     http://localhost:3000/api/scripts/xxx.json

# 应该看到响应头：
# Access-Control-Allow-Origin: *
```

### 方法3: JavaScript测试

在浏览器控制台：

```javascript
fetch('http://localhost:3000/api/scripts/xxx.json')
  .then(res => res.json())
  .then(data => console.log('✅ Success:', data))
  .catch(err => console.error('❌ Error:', err))
```

## 安全考虑

### 使用 * 安全吗？

**安全 ✅**

因为：
1. 这是只读的GET请求
2. 返回的是公开的剧本数据
3. 没有用户认证信息
4. 不涉及修改操作

### 什么时候不应该使用 *？

如果API涉及：
- ❌ 用户私密数据
- ❌ 需要认证的操作
- ❌ 修改数据（POST/PUT/DELETE）
- ❌ 携带Cookie/Token

**我们的情况：** 公开的剧本JSON，使用 `'*'` 完全安全。

## 常见问题

### Q: 为什么本地测试没问题？

**A:** 因为你直接在浏览器打开URL，没有跨域。只有当官网通过JavaScript请求你的API时才会触发CORS检查。

### Q: 为什么响应状态是200但还是失败？

**A:** 服务器返回了数据（200 OK），但浏览器因为CORS策略阻止了JavaScript访问响应内容。

### Q: 生产环境需要特殊处理吗？

**A:** 不需要。CORS头在开发环境和生产环境都需要，配置相同。

### Q: 会影响性能吗？

**A:** 几乎没有影响。只是多了几个HTTP响应头。

## 文件清单

### 修改
- ✅ `app/api/scripts/[id]/route.ts`
  - 添加 `OPTIONS` 方法处理CORS预检
  - 在 `.json` 响应中添加CORS头

### 文档
- ✅ `specs/035-dual-copy-buttons/CORS-FIX.md` - 本文档

## 验证清单

- [x] 添加 `Access-Control-Allow-Origin: *` ✅
- [x] 添加 `Access-Control-Allow-Methods` ✅
- [x] 添加 `Access-Control-Allow-Headers` ✅
- [x] 实现 `OPTIONS` 预检处理 ✅
- [x] 血染钟楼官网可以访问 ✅
- [x] 无 Linter 错误 ✅

## 总结

通过添加CORS响应头，我们：
- ✅ 允许血染钟楼官网访问我们的API
- ✅ 允许任何其他血染钟楼工具访问
- ✅ 保持数据公开性
- ✅ 不影响安全性

现在血染钟楼官网可以成功获取你的剧本JSON数据了！🎉

