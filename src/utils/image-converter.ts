/**
 * 图片格式转换工具
 * 主要用于将 SVG 预览图转换为 PNG 格式下载
 */

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

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('SVG 图片加载失败'))
    img.src = svgUrl
  })

  // 2. 创建 Canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 Canvas 上下文')

  // 3. 设置高清分辨率
  const width = img.naturalWidth || img.width
  const height = img.naturalHeight || img.height

  // 限制最大尺寸防止内存溢出
  const maxDimension = 4000
  let finalScale = scale
  if (width * scale > maxDimension || height * scale > maxDimension) {
    finalScale = Math.min(maxDimension / width, maxDimension / height)
  }

  canvas.width = width * finalScale
  canvas.height = height * finalScale

  // 4. 绘制白色背景（SVG 可能是透明的）
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 5. 绘制 SVG 到 Canvas
  ctx.scale(finalScale, finalScale)
  ctx.drawImage(img, 0, 0)

  // 6. 转换为 PNG Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('PNG 转换失败'))
        }
      },
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
 * @param url 图片 URL
 * @param filename 文件名（可选）
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
    // 替换文件扩展名
    finalFilename = finalFilename.replace(/\.svg$/i, '.png')
    if (!finalFilename.endsWith('.png')) {
      finalFilename += '.png'
    }
  } else {
    // 其他格式直接下载
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`下载失败: ${response.statusText}`)
    }
    blob = await response.blob()
    
    // 如果没有扩展名，尝试从 MIME 类型推断
    if (!finalFilename.includes('.')) {
      const mimeType = blob.type
      const ext = mimeType.split('/')[1]?.split('+')[0] || 'png'
      finalFilename += `.${ext}`
    }
  }

  // 触发浏览器下载
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = finalFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  
  // 清理 Blob URL
  setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
}

/**
 * 从文件路径中提取文件名（不含扩展名）
 */
export function getFilenameWithoutExt(path: string): string {
  const parts = path.split('/')
  const filename = parts[parts.length - 1] || 'image'
  return filename.replace(/\.[^.]+$/, '')
}

