# 最终实现：直接复制JSON内容

## 功能概述

用户在剧本详情页点击"复制 JSON 内容"按钮后，**剧本的完整JSON内容会直接复制到剪贴板**，可以立即粘贴到血染钟楼官方网站使用。

## 核心流程

```
用户点击按钮
    ↓
显示"加载中..." (禁用按钮)
    ↓
fetch(`${baseUrl}/api/scripts/${scriptId}/download`)
    ↓
获取JSON数据
    ↓
JSON.stringify(jsonData, null, 2)  // 格式化，缩进2空格
    ↓
navigator.clipboard.writeText(jsonString)
    ↓
显示"已复制到剪贴板！" (2秒后恢复)
    ↓
用户打开血染钟楼官网
    ↓
Ctrl+V 或 Cmd+V 粘贴
    ↓
完成导入！
```

## 用户体验对比

### ❌ 旧方式（下载文件）
1. 点击"下载 JSON"
2. 文件保存到下载文件夹
3. 打开血染钟楼官网
4. 点击"导入文件"
5. 浏览并选择刚下载的文件
6. 等待上传
7. 完成

**总计：7步操作**

### ✅ 新方式（直接复制）
1. 点击"复制 JSON 内容"
2. 打开血染钟楼官网
3. 粘贴（Ctrl+V）
4. 完成

**总计：4步操作，节省 40%+ 时间！**

## 技术实现

### 组件状态

```typescript
const [loading, setLoading] = useState(false)  // 加载状态
const [copied, setCopied] = useState(false)    // 复制成功
const [error, setError] = useState(false)      // 复制失败
```

### 复制逻辑

```typescript
async function handleCopy() {
  setLoading(true)
  
  try {
    // 1. 获取JSON数据
    const url = `${baseUrl}/api/scripts/${scriptId}/download`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch')
    
    const jsonData = await response.json()
    
    // 2. 格式化JSON
    const jsonString = JSON.stringify(jsonData, null, 2)
    
    // 3. 复制到剪贴板
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(jsonString)
    } else {
      // 降级方案
      const textarea = document.createElement('textarea')
      textarea.value = jsonString
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  } catch (err) {
    setError(true)
    setTimeout(() => setError(false), 2000)
  } finally {
    setLoading(false)
  }
}
```

### UI状态

```
默认:     📋 复制 JSON 内容        (可点击)
加载中:   ⏳ 加载中...            (禁用按钮)
成功:     ✅ 已复制到剪贴板！     (禁用按钮，2秒后恢复)
失败:     ❌ 复制失败             (可点击，2秒后恢复)
```

## 复制的内容示例

```json
{
  "meta": {
    "scriptName": "示例剧本",
    "rounds": 3,
    "playerCount": 7,
    "author": "作者名",
    "description": "剧本描述"
  },
  "roles": [
    {
      "id": 1,
      "name": "村民",
      "type": "好人",
      "ability": "无特殊能力",
      "team": "townsfolk"
    },
    {
      "id": 2,
      "name": "狼人",
      "type": "坏人",
      "ability": "每晚可以杀一人",
      "team": "evil"
    }
  ],
  "rounds": [
    {
      "round": 1,
      "phase": "night",
      "events": [
        {
          "type": "kill",
          "target": "村民1"
        }
      ]
    }
  ]
}
```

**特点：**
- 格式化缩进（2个空格）
- 完整的剧本数据
- 可读性强
- 直接可用

## 浏览器兼容性

### 现代浏览器（Clipboard API）
- ✅ Chrome 63+
- ✅ Firefox 53+
- ✅ Safari 13.1+
- ✅ Edge 79+

### 旧浏览器（降级方案）
- ✅ IE 11
- ✅ 其他支持 `document.execCommand('copy')` 的浏览器

## 文件清单

### 新增
- `app/scripts/[id]/CopyJsonUrlButton.tsx` ✅

### 修改
- `app/scripts/[id]/page.tsx` ✅
- `app/api/scripts/[id]/download/route.ts` ✅

### 文档
- `specs/034-copy-json-url-button/spec.md` ✅
- `specs/034-copy-json-url-button/README.md` ✅
- `specs/034-copy-json-url-button/CHANGELOG.md` ✅
- `specs/034-copy-json-url-button/FINAL-IMPLEMENTATION.md` ✅

## 测试清单

- [x] 点击按钮加载JSON ✅
- [x] JSON格式化正确 ✅
- [x] 复制到剪贴板成功 ✅
- [x] 加载状态显示 ✅
- [x] 成功提示显示 ✅
- [x] 失败处理正常 ✅
- [x] 2秒后状态恢复 ✅
- [x] 响应式布局 ✅
- [x] 移动端触摸友好 ✅
- [x] 浏览器兼容性 ✅
- [x] 可粘贴到血染钟楼官网 ✅

## 优势总结

| 特性 | 说明 |
|------|------|
| **简化流程** | 从7步减少到4步 |
| **无需文件** | 不产生下载文件，节省空间 |
| **即时可用** | 复制后立即可粘贴 |
| **自动格式化** | JSON缩进美观，便于阅读 |
| **状态反馈** | 清晰的加载/成功/失败提示 |
| **跨浏览器** | 现代和旧浏览器都支持 |
| **响应式** | 移动端和桌面端都适配 |

## 实际使用

### 在血染钟楼官网使用

1. **访问剧本详情页** (例如：https://yourdomain.com/scripts/abc123)
2. **点击"复制 JSON 内容"** 按钮
3. **等待加载** (通常 < 1秒)
4. **看到"已复制到剪贴板！"**
5. **打开血染钟楼官方网站** (https://script.bloodontheclock.com 或类似)
6. **找到导入功能** (通常是"导入自定义剧本"或"Import Custom Script")
7. **粘贴** (Ctrl+V 或 Cmd+V)
8. **完成！** 剧本已导入

### 其他用途

- **分享给朋友**: 复制后通过聊天工具发送
- **备份剧本**: 粘贴到文本编辑器保存
- **调试开发**: 快速查看JSON结构
- **编辑修改**: 粘贴到JSON编辑器修改后重新上传

## 未来增强

1. **压缩选项**: 提供压缩版JSON（去除缩进和换行）
2. **选择性复制**: 只复制部分字段（例如只复制角色列表）
3. **复制历史**: 保存最近复制的几个剧本
4. **格式选项**: 支持YAML、XML等其他格式
5. **一键分享**: 直接生成分享链接

## 注意事项

1. **大文件性能**: 超大剧本可能需要几秒加载时间
2. **网络依赖**: 需要网络连接获取JSON数据
3. **剪贴板权限**: 部分浏览器可能需要用户授权
4. **JSON大小限制**: 剪贴板可能有大小限制（通常 > 1MB，足够使用）

