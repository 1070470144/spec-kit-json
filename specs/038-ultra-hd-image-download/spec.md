# 038 - 超高清图片下载功能

## 📋 需求概述

在用户端生成图片功能（`/generate`）中，新增一个"下载超高清图"按钮，允许用户下载超高质量的PNG图片（文件大小≥10MB），适合高质量打印和专业用途。

## 🎯 目标

- 提供超高清质量的PNG下载选项
- 文件大小目标：**≥10MB**
- 保持最高图片质量和细节
- 不影响现有的普通下载功能

## 📐 技术参数

### 当前普通PNG参数
```typescript
density: 240 DPI
maxDimension: 2000px
quality: 90
compressionLevel: 9 (最高压缩)
预计文件大小: 0.5-2MB
```

### 新增超高清PNG参数（已优化提升）
```typescript
density: 1200 DPI           // 极致密度 (提升2倍)
scale: 6x                   // 6倍放大 (提升1.5倍)
quality: 100                // 无损质量
compressionLevel: 0         // 无压缩
withoutEnlargement: false   // 允许放大
maxDimension: 无限制        // 移除尺寸限制，使用原始SVG尺寸*6
预期输出尺寸: ~1680px × 4200px (280x700 * 6)
预计文件大小: 30-60MB ✨
```

## 🎨 UI/UX 设计

### 按钮布局
```
当前下载区域（第296-317行）：
[下载 PNG 图片]

修改后：
[下载 PNG (标准)]  [下载超高清图 ★]
     ↓                    ↓
  快速下载             最高质量
  ~1-2MB              ~10-25MB
  适合网络分享         适合打印收藏
```

### 按钮样式
- **标准PNG**: `m3-btn-outlined`（次要按钮，轮廓风格）
- **超高清PNG**: `m3-btn-filled`（主要按钮，实心风格，带星标★）
- 两个按钮并排显示，响应式布局

### 加载提示
```
下载中状态：
[⏳ 生成中，请稍候...] 
    (超高清图生成需要10-20秒)
```

### Toast提示
```
成功: "超高清图片下载成功！文件大小: 15.3MB"
警告: "超高清图文件较大(~15MB)，生成需要约15秒，请耐心等待"
错误: "超高清图生成失败，请重试"
```

## 📂 文件命名规则

```typescript
普通PNG: `${finalTitle}_${finalAuthor}.png`
超高清PNG: `${finalTitle}_${finalAuthor}_UHD.png`

示例：
- 标准版: "影落钟楼_张三.png"
- 超高清: "影落钟楼_张三_UHD.png"
```

## 🔧 实现方案

### 1. 修改API端点

**文件**: `app/api/tools/convert-svg-to-png/route.ts`

**修改点**:
```typescript
// 接收quality参数
const { svg, quality = 'normal' } = body

// 根据quality选择参数
const params = quality === 'ultra' 
  ? {
      density: 1200,          // 极致密度 (提升2倍)
      scale: 6,               // 6倍放大 (提升1.5倍)
      quality: 100,           // 无损质量
      compressionLevel: 0,    // 无压缩
      maxDim: null            // 无限制
    }
  : {
      density: 240,
      scale: 1,
      quality: 90,
      compressionLevel: 9,
      maxDim: 2000
    }

// 使用参数进行转换
const pngBuffer = await sharp(svgBuffer, { density: params.density })
  .resize(
    params.maxDim ? Math.min(width * params.scale, params.maxDim) : width * params.scale,
    params.maxDim ? Math.min(height * params.scale, params.maxDim) : height * params.scale,
    { 
      fit: 'inside', 
      withoutEnlargement: quality !== 'ultra'  // 超高清允许放大
    }
  )
  .png({ 
    quality: params.quality,
    compressionLevel: params.compressionLevel 
  })
  .toBuffer()

// 日志输出文件大小
console.log(`[SVG to PNG] Quality: ${quality}, Size: ${(pngBuffer.length / 1024 / 1024).toFixed(2)}MB`)
```

### 2. 修改前端页面

**文件**: `app/generate/page.tsx`

#### 2.1 新增状态
```typescript
const [downloadingUHD, setDownloadingUHD] = useState(false)
```

#### 2.2 新增下载函数
```typescript
// 下载超高清PNG
async function downloadUltraHDPNG() {
  if (!previewSvg && !previewUrl) return

  // 提示用户
  showToast('开始生成超高清图，预计需要10-20秒，文件约10-25MB', 'info')
  
  setDownloadingUHD(true)
  const startTime = Date.now()
  
  try {
    const svgText = previewSvg || (await (await fetch(previewUrl as string)).text())

    const convertResponse = await fetch('/api/tools/convert-svg-to-png', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        svg: svgText,
        quality: 'ultra'  // 关键参数
      })
    })

    if (convertResponse.ok) {
      const blob = await convertResponse.blob()
      const fileSizeMB = (blob.size / 1024 / 1024).toFixed(2)
      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${finalTitle}_${finalAuthor}_UHD.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showToast(`超高清图片下载成功！文件大小: ${fileSizeMB}MB，耗时: ${duration}秒`, 'success')
    } else {
      showToast('超高清图生成失败', 'error')
    }
  } catch (error) {
    console.error('Download Ultra HD PNG failed:', error)
    showToast('下载失败', 'error')
  }
  setDownloadingUHD(false)
}
```

#### 2.3 修改按钮区域（第296-317行）
```typescript
{/* 下载按钮 */}
<div className="flex flex-wrap gap-3">
  {/* 标准PNG */}
  <button
    type="button"
    onClick={downloadPNG}
    disabled={loading || downloadingUHD}
    className="m3-btn-outlined flex items-center gap-2 min-h-touch disabled:opacity-50"
  >
    {loading ? (
      <>
        <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
        转换中...
      </>
    ) : (
      <>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        下载 PNG (标准)
      </>
    )}
  </button>

  {/* 超高清PNG */}
  <button
    type="button"
    onClick={downloadUltraHDPNG}
    disabled={loading || downloadingUHD}
    className="m3-btn-filled flex items-center gap-2 min-h-touch disabled:opacity-50"
  >
    {downloadingUHD ? (
      <>
        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
        生成中 {/* 约15秒 */}
      </>
    ) : (
      <>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        下载超高清图 ★
      </>
    )}
  </button>
</div>

{/* 提示文本 */}
<p className="text-xs text-surface-on-variant mt-2">
  标准版 (~1-2MB) 适合网络分享 | 超高清 (~10-25MB) 适合打印收藏
</p>
```

#### 2.4 同步修改模态框内的下载按钮（第373-391行）
在模态框底部也添加超高清下载选项

## 📊 预期效果

### 文件大小对比
| 版本 | 尺寸 | 文件大小 | DPI | 用途 |
|------|------|----------|-----|------|
| 标准PNG | 800×2000 | 1-2MB | 240 | 网络分享 |
| 超高清PNG | 1680×4200 | 30-60MB | 1200 | 专业打印/极致质量 |

### 生成时间
- 标准PNG: 1-3秒
- 超高清PNG: 15-30秒 ⚠️ 文件更大，需要更长时间

## ⚠️ 注意事项

### 1. 服务器资源
- 超高清转换消耗大量CPU和内存
- 建议添加请求限流（可选）
- 监控服务器资源使用情况

### 2. 用户体验
- 必须有明确的加载提示
- 告知用户预计等待时间
- 显示文件大小警告

### 3. 浏览器兼容性
- 超大文件下载在某些浏览器可能较慢
- 测试不同浏览器的下载行为

### 4. 错误处理
- 转换失败时提供友好提示
- 考虑添加重试机制
- 超时处理（建议30秒超时）

## 🧪 测试清单

- [ ] 标准PNG下载功能不受影响
- [ ] 超高清PNG文件大小≥10MB
- [ ] 超高清PNG图片质量清晰无损
- [ ] 两个按钮并排显示正常
- [ ] 加载状态显示正确
- [ ] Toast提示信息准确
- [ ] 文件命名正确（带_UHD后缀）
- [ ] 移动端响应式布局正常
- [ ] 模态框内下载按钮同步更新
- [ ] 服务器资源使用在可接受范围

## 📝 相关文件

### 需要修改的文件
1. `app/api/tools/convert-svg-to-png/route.ts` - API逻辑
2. `app/generate/page.tsx` - 前端页面

### 相关文档
1. `GENERATE_IMAGE_FEATURE.md` - 需要更新功能文档

## 🎯 实现优先级

**优先级**: 中等

**工作量估计**: 1-2小时
- API修改: 30分钟
- 前端修改: 30分钟
- 测试调优: 30-60分钟

## ✅ 验收标准

1. ✅ 超高清PNG文件大小≥30MB（已提升）
2. ✅ 图片质量明显优于标准版（1200 DPI，6倍放大）
3. ✅ 下载功能稳定可靠
4. ✅ 加载提示清晰友好
5. ✅ 不影响现有功能
6. ✅ 移动端和桌面端均正常工作

## 📚 参考资料

- [Sharp文档 - PNG输出选项](https://sharp.pixelplumbing.com/api-output#png)
- [PNG压缩级别说明](https://sharp.pixelplumbing.com/api-output#png)
- Material Design 3 按钮规范

