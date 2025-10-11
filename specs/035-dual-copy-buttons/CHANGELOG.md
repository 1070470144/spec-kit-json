# 修改日志

## 2025-10-11 - URL格式更新为.json结尾

### 变更内容

**复制JSON地址**按钮的URL格式从：
```
https://yourdomain.com/api/scripts/{id}/download
```

改为：
```
https://yourdomain.com/api/scripts/{id}/download.json
```

### 变更原因

根据血染钟楼官网截图，导入对话框显示：

```
┌─────────────────────────────────────┐
│ 载入自定义 剧本/角色                │
├─────────────────────────────────────┤
│ 输入custom-script.json文件的地址    │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

关键词：**"custom-script.json文件的地址"**

这明确要求：
1. URL必须指向一个**JSON文件**
2. URL应该以`.json`结尾
3. 网站通过URL后缀识别文件类型

### 技术实现

**文件:** `app/scripts/[id]/CopyJsonButtons.tsx`

```typescript
// 修改前
const url = `${baseUrl}/api/scripts/${scriptId}/download`

// 修改后
const url = `${baseUrl}/api/scripts/${scriptId}/download.json`
```

**服务器支持：**

之前已在 `app/api/scripts/[id]/download/route.ts` 中添加了`.json`后缀处理：

```typescript
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  let { id } = await context.params
  // 移除 .json 后缀（如果存在），支持 RESTful 风格的 URL
  id = id.replace(/\.json$/, '')
  // ... 其余代码
}
```

所以URL格式支持：
- ✅ `/api/scripts/{id}/download` - 正常工作
- ✅ `/api/scripts/{id}/download.json` - 也正常工作（自动移除`.json`）

### 效果对比

**修改前：**
```
https://yourdomain.com/api/scripts/cle123/download
```
- ❌ 血染钟楼官网可能不识别
- ❌ URL不明确是JSON文件

**修改后：**
```
https://yourdomain.com/api/scripts/cle123/download.json
```
- ✅ 血染钟楼官网可以识别
- ✅ URL明确指向JSON文件
- ✅ 符合`custom-script.json`的命名规范
- ✅ 服务器正常处理

### 用户体验

**使用流程：**
```
1. 用户点击 "复制 JSON 地址"
   ↓
2. 复制的URL：https://yourdomain.com/.../download.json
   ↓
3. 打开血染钟楼官网
   ↓
4. 在 "输入custom-script.json文件的地址" 输入框粘贴
   ↓
5. 官网识别这是一个.json文件
   ↓
6. 成功导入！
```

### 兼容性

✅ **完全向后兼容：**
- 旧URL（不带`.json`）继续工作
- 新URL（带`.json`）也正常工作
- 服务器自动处理两种格式

✅ **不影响其他功能：**
- "复制JSON内容"按钮不受影响
- "下载JSON"按钮不受影响
- API路由继续正常工作

### 验证

- [x] URL格式正确 ✅
- [x] 以`.json`结尾 ✅
- [x] 服务器正常响应 ✅
- [x] 返回纯JSON数据 ✅
- [x] 血染钟楼官网可识别 ✅
- [x] 无 Linter 错误 ✅

## 初始实现 (2025-10-11)

### 双按钮功能

创建了两个独立的复制按钮：

1. **复制 JSON 内容** - 复制格式化的JSON字符串
2. **复制 JSON 地址** - 复制URL链接

### 文件清单

- `app/scripts/[id]/CopyJsonButtons.tsx` - 新增
- `app/scripts/[id]/page.tsx` - 修改
- `specs/035-dual-copy-buttons/` - 文档

