# PWA 图标说明

## 需要的图标尺寸

请准备以下尺寸的 PNG 图标（透明背景）：

- `icon-72.png` - 72x72px
- `icon-96.png` - 96x96px  
- `icon-128.png` - 128x128px
- `icon-144.png` - 144x144px
- `icon-152.png` - 152x152px
- `icon-192.png` - 192x192px ⭐ **必需**（Android）
- `icon-384.png` - 384x384px
- `icon-512.png` - 512x512px ⭐ **必需**（Android）
- `maskable-icon.png` - 512x512px ⭐ **必需**（自适应图标）

## 设计要求

### 标准图标 (icon-*.png)
- 背景：透明
- 内容：居中的 logo，留白边距 ≥ 10%
- 格式：PNG-24
- 色彩：与品牌主题色一致（天空蓝 #0EA5E9）

### Maskable 图标 (maskable-icon.png)
- 尺寸：512x512px
- 安全区域：中心 80% 区域内放置重要内容
- 背景：不透明，使用品牌色或渐变
- 用途：Android 自适应图标，系统会裁剪成各种形状

## 快速生成工具

### 在线工具
- **PWA Asset Generator**: https://www.pwabuilder.com/
- **RealFaviconGenerator**: https://realfavicongenerator.net/

### 命令行工具
```bash
# 使用 sharp 批量生成
npm install -g pwa-asset-generator
pwa-asset-generator logo.svg ./public/icons
```

## 临时方案

当前可以使用以下临时方案测试 PWA 功能：

1. **使用占位图标**：创建纯色方块作为临时图标
2. **从现有资源提取**：如果有网站 favicon，可以放大使用
3. **使用文字图标**：在线生成工具创建简单文字图标

## 验证

生成图标后，使用以下工具验证：
- Chrome DevTools > Application > Manifest
- Lighthouse > PWA 检查
- https://manifest-validator.appspot.com/

---

**注意**：图标是 PWA 安装体验的重要部分，建议尽快准备正式图标。

