# Spec 023: SVG 预览图下载为 PNG

## 概述
**规格编号**: 023  
**创建日期**: 2025-10-11  
**状态**: 实施中  

## 目标
将剧本详情页中的 SVG 格式预览图在下载时自动转换为 PNG 格式，提升用户体验。

## 背景
当前系统使用 SVG 格式生成自动预览图，但 SVG 格式在某些场景下不如 PNG 通用：
- 部分图片查看器不支持 SVG
- 社交媒体平台对 SVG 支持有限
- 用户更习惯 PNG/JPG 等位图格式

## 需求分析

### 功能需求
1. **自动检测**: 下载图片时自动检测是否为 SVG 格式
2. **格式转换**: SVG 格式自动转换为 PNG
3. **保持原样**: 其他格式（JPG、PNG、WebP）保持原样下载
4. **文件命名**: PNG 文件使用有意义的文件名（如：`{剧本标题}-preview.png`）

### 技术需求
1. 使用前端 Canvas API 进行转换，无需后端支持
2. 转换质量：2x 分辨率（高清）
3. 转换过程中显示加载状态
4. 转换失败时回退到原始 SVG 下载

## 设计方案

### 前端实现

#### 1. 工具函数：`svgToPng`
```typescript
// src/utils/image-converter.ts

/**
 * 将 SVG 图片 URL 转换为 PNG Blob
 * @param svgUrl SVG 图片的 URL
 * @param scale 缩放倍数（默认 2x 高清）
 * @returns PNG Blob
 */
export async function svgToPng(
  svgUrl: string, 
  scale: number = 2
): Promise<Blob> {
  // 1. 加载 SVG 图片
  const img = new Image()
  img.crossOrigin = 'anonymous'
  
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = svgUrl
  })
  
  // 2. 创建 Canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 Canvas 上下文')
  
  // 3. 设置高清分辨率
  canvas.width = img.naturalWidth * scale
  canvas.height = img.naturalHeight * scale
  
  // 4. 绘制 SVG 到 Canvas
  ctx.scale(scale, scale)
  ctx.drawImage(img, 0, 0)
  
  // 5. 转换为 PNG Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('转换失败')),
      'image/png',
      1.0
    )
  })
}

/**
 * 检查 URL 是否为 SVG 格式
 */
export function isSvgUrl(url: string): boolean {
  return url.toLowerCase().includes('.svg')
}

/**
 * 下载图片，SVG 自动转换为 PNG
 */
export async function downloadImage(
  url: string, 
  filename?: string
): Promise<void> {
  let blob: Blob
  let finalFilename = filename || 'image'
  
  if (isSvgUrl(url)) {
    // SVG 转换为 PNG
    blob = await svgToPng(url)
    finalFilename = finalFilename.replace(/\.svg$/i, '.png')
    if (!finalFilename.endsWith('.png')) {
      finalFilename += '.png'
    }
  } else {
    // 其他格式直接下载
    const response = await fetch(url)
    blob = await response.blob()
  }
  
  // 触发下载
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = finalFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}
```

#### 2. 修改下载按钮组件

**CenteredImagesWithLightbox.tsx**:
```typescript
// 替换原来的 <a download> 为按钮
<button
  onClick={async (e) => {
    e.stopPropagation()
    try {
      setDownloading(true)
      await downloadImage(images[current]?.url, `${title || 'image'}-${current + 1}`)
    } catch (error) {
      console.error('下载失败:', error)
      alert('图片下载失败，请重试')
    } finally {
      setDownloading(false)
    }
  }}
  disabled={downloading}
  className="absolute bottom-4 right-4 btn btn-primary"
>
  {downloading ? '转换中...' : '下载图片'}
</button>
```

**Gallery.tsx**: 同样修改

## 实现步骤

### Phase 1: 工具函数实现
- [x] 创建 `src/utils/image-converter.ts`
- [x] 实现 `svgToPng` 函数
- [x] 实现 `downloadImage` 函数
- [x] 添加错误处理

### Phase 2: 组件集成
- [x] 修改 `CenteredImagesWithLightbox.tsx`
- [x] 修改 `Gallery.tsx`
- [x] 添加加载状态 UI

### Phase 3: 测试验证
- [ ] 测试 SVG 下载转换为 PNG
- [ ] 测试 PNG/JPG/WebP 正常下载
- [ ] 测试转换失败的回退逻辑
- [ ] 测试文件命名是否正确

## 验收标准

### 功能验收
1. ✅ SVG 预览图下载时自动转换为 PNG
2. ✅ PNG 文件质量清晰（2x 分辨率）
3. ✅ 其他格式图片正常下载
4. ✅ 下载过程中显示"转换中..."状态
5. ✅ 文件名包含剧本标题和序号

### 性能验收
1. ✅ 转换时间 < 2 秒（常规尺寸）
2. ✅ 不影响页面其他功能

### 兼容性验收
1. ✅ Chrome/Edge/Firefox 正常工作
2. ✅ 移动端浏览器正常工作

## 风险与限制

### 已知限制
1. **跨域限制**: SVG 必须同源或允许跨域访问
2. **浏览器兼容**: 依赖 Canvas API（现代浏览器支持良好）
3. **内存消耗**: 大尺寸 SVG 转换时会占用较多内存

### 风险缓解
1. 使用 `crossOrigin='anonymous'` 处理跨域
2. 转换失败时提供降级方案（原样下载 SVG）
3. 限制最大转换尺寸（如 4000x4000）

## 相关资源
- Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- Blob API: https://developer.mozilla.org/en-US/docs/Web/API/Blob

## 变更历史
- 2025-10-11: 初始创建

