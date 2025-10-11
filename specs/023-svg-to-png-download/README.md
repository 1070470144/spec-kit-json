# Spec 023: SVG 预览图下载为 PNG

## 问题描述
用户反馈在剧本详情页下载自动生成的预览图时，得到的是 SVG 格式文件，但希望能够直接下载为更通用的 PNG 格式。

## 解决方案
在前端实现 SVG 到 PNG 的自动转换功能：
1. 检测下载的图片格式
2. 如果是 SVG，使用 Canvas API 转换为高清 PNG
3. 其他格式保持原样下载

## 技术实现

### 核心工具函数
```typescript
// src/utils/image-converter.ts
export async function svgToPng(svgUrl: string, scale: number = 2): Promise<Blob>
export function isSvgUrl(url: string): boolean
export async function downloadImage(url: string, filename?: string): Promise<void>
```

### 修改的组件
- `app/scripts/_components/CenteredImagesWithLightbox.tsx`
- `app/scripts/_components/Gallery.tsx`

## 用户体验
- **下载 SVG 预览图**: 自动转换为 PNG，文件名如 `菜市场v3.1-preview.png`
- **下载 PNG/JPG**: 保持原格式，直接下载
- **转换中**: 按钮显示"转换中..."状态
- **失败处理**: 转换失败时提示用户

## 验收检查
- [x] 创建 spec 文档
- [ ] 实现工具函数
- [ ] 修改下载组件
- [ ] 测试验证

## 相关文档
- [完整规格说明](./spec.md)

