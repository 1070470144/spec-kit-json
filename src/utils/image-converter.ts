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
  console.log('[svgToPng] 开始转换:', svgUrl)
  
  // 1. 获取 SVG 内容
  const response = await fetch(svgUrl)
  if (!response.ok) {
    throw new Error(`SVG 加载失败: ${response.status} ${response.statusText}`)
  }
  const svgText = await response.text()
  console.log('[svgToPng] SVG 文本大小:', svgText.length, 'bytes')
  
  // 2. 从 SVG 文本中提取宽高
  const svgWidthMatch = svgText.match(/width=["'](\d+)["']/)
  const svgHeightMatch = svgText.match(/height=["'](\d+)["']/)
  const viewBoxMatch = svgText.match(/viewBox=["'][0-9\s]+\s+(\d+)\s+(\d+)["']/)
  
  let width = svgWidthMatch ? parseInt(svgWidthMatch[1]) : 800
  let height = svgHeightMatch ? parseInt(svgHeightMatch[1]) : 600
  
  // 如果没有 width/height 但有 viewBox，使用 viewBox 的尺寸
  if ((!svgWidthMatch || !svgHeightMatch) && viewBoxMatch) {
    width = parseInt(viewBoxMatch[1])
    height = parseInt(viewBoxMatch[2])
  }
  
  console.log('[svgToPng] SVG 尺寸:', width, 'x', height)

  // 3. 加载 SVG 到 Image 对象
  const img = new Image()
  let imageSrc: string | null = null
  
  try {
    // 优先尝试 Data URL（适合小文件）
    if (svgText.length < 2000000) { // 小于2MB时使用Data URL
      imageSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`
      console.log('[svgToPng] 使用 Data URL 方式')
    } else {
      // 大文件使用 Blob URL
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
      imageSrc = URL.createObjectURL(svgBlob)
      console.log('[svgToPng] 使用 Blob URL 方式')
    }
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        console.log('[svgToPng] SVG 加载成功')
        resolve()
      }
      img.onerror = (e) => {
        console.error('[svgToPng] SVG 加载失败:', e)
        reject(new Error('SVG 图片加载失败'))
      }
      img.src = imageSrc!
    })
  } finally {
    // 清理 Blob URL（如果使用了）
    if (imageSrc && imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(imageSrc)
    }
  }

  // 5. 创建 Canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 Canvas 上下文')

  // 6. 设置高清分辨率
  const maxDimension = 4000
  let finalScale = scale
  if (width * scale > maxDimension || height * scale > maxDimension) {
    finalScale = Math.min(maxDimension / width, maxDimension / height)
  }

  canvas.width = width * finalScale
  canvas.height = height * finalScale
  
  console.log('[svgToPng] Canvas 尺寸:', canvas.width, 'x', canvas.height)

  // 7. 绘制白色背景（SVG 可能是透明的）
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 8. 绘制 SVG 到 Canvas
  ctx.scale(finalScale, finalScale)
  ctx.drawImage(img, 0, 0)

  // 9. 转换为 PNG Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          console.log('[svgToPng] PNG 转换成功, 大小:', blob.size, 'bytes')
          resolve(blob)
        } else {
          console.error('[svgToPng] PNG 转换失败: blob 为空')
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

