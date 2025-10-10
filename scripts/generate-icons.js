#!/usr/bin/env node

/**
 * 简单PWA图标生成器
 * 创建基础的血染钟楼主题图标
 */

const fs = require('fs');
const path = require('path');

// 图标尺寸配置
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const ICONS_DIR = path.join(__dirname, '../public/icons');

// 确保图标目录存在
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// SVG 模板 - 血染钟楼主题
function generateSVG(size, isMaskable = false) {
  const padding = isMaskable ? size * 0.1 : size * 0.15; // maskable需要更小的padding
  const logoSize = size - (padding * 2);
  const center = size / 2;
  const logoRadius = logoSize / 2;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0EA5E9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0284C7;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F0F9FF;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="${size * 0.01}" stdDeviation="${size * 0.005}" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  ${isMaskable ? `
  <!-- Maskable background -->
  <rect width="${size}" height="${size}" fill="url(#bgGrad)" />
  ` : ''}
  
  <!-- Main logo circle -->
  <circle cx="${center}" cy="${center}" r="${logoRadius}" fill="${isMaskable ? '#FFFFFF22' : 'url(#bgGrad)'}" ${isMaskable ? '' : 'filter="url(#shadow)"'} />
  
  <!-- Inner content -->
  <g transform="translate(${center}, ${center})">
    <!-- Clock tower silhouette -->
    <g transform="translate(0, ${-logoRadius * 0.1})">
      <!-- Tower base -->
      <rect x="${-logoRadius * 0.6}" y="${logoRadius * 0.3}" width="${logoRadius * 1.2}" height="${logoRadius * 0.4}" 
            fill="url(#textGrad)" opacity="0.9" rx="${logoRadius * 0.1}" />
      
      <!-- Tower middle -->
      <rect x="${-logoRadius * 0.4}" y="${logoRadius * 0.1}" width="${logoRadius * 0.8}" height="${logoRadius * 0.3}" 
            fill="url(#textGrad)" opacity="0.85" rx="${logoRadius * 0.05}" />
      
      <!-- Tower top -->
      <rect x="${-logoRadius * 0.25}" y="${-logoRadius * 0.2}" width="${logoRadius * 0.5}" height="${logoRadius * 0.35}" 
            fill="url(#textGrad)" opacity="0.9" rx="${logoRadius * 0.03}" />
      
      <!-- Clock face -->
      <circle cx="0" cy="${logoRadius * 0.05}" r="${logoRadius * 0.25}" fill="#FFFFFF" opacity="0.95" 
              stroke="url(#textGrad)" stroke-width="${size * 0.003}" />
      
      <!-- Clock hands -->
      <g transform="translate(0, ${logoRadius * 0.05})">
        <line x1="0" y1="0" x2="0" y2="${-logoRadius * 0.15}" stroke="#0EA5E9" stroke-width="${size * 0.004}" 
              stroke-linecap="round" opacity="0.8" />
        <line x1="0" y1="0" x2="${logoRadius * 0.1}" y2="${-logoRadius * 0.08}" stroke="#0284C7" stroke-width="${size * 0.003}" 
              stroke-linecap="round" opacity="0.8" />
        <circle cx="0" cy="0" r="${size * 0.008}" fill="#DC2626" />
      </g>
      
      <!-- Blood drops -->
      <g opacity="0.7">
        <ellipse cx="${-logoRadius * 0.3}" cy="${logoRadius * 0.5}" rx="${size * 0.008}" ry="${size * 0.012}" fill="#DC2626" />
        <ellipse cx="${logoRadius * 0.35}" cy="${logoRadius * 0.45}" rx="${size * 0.006}" ry="${size * 0.01}" fill="#B91C1C" />
        <ellipse cx="${-logoRadius * 0.15}" cy="${logoRadius * 0.6}" rx="${size * 0.005}" ry="${size * 0.008}" fill="#EF4444" />
      </g>
    </g>
    
    <!-- Chinese character "血" -->
    <text x="0" y="${logoRadius * 0.85}" font-family="serif" font-size="${logoRadius * 0.4}" 
          fill="url(#textGrad)" text-anchor="middle" dominant-baseline="middle" 
          font-weight="bold" opacity="0.9">血</text>
  </g>
</svg>`;
}

// 转换SVG为PNG的函数（简化版，实际需要canvas或sharp）
function createIconFile(size, isMaskable = false) {
  const svg = generateSVG(size, isMaskable);
  const filename = isMaskable ? 'maskable-icon.svg' : `icon-${size}.svg`;
  const filepath = path.join(ICONS_DIR, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`✓ 创建 ${filename}`);
  
  return filepath;
}

// 生成所有图标
console.log('🎨 开始生成PWA图标...\n');

try {
  // 生成标准图标
  ICON_SIZES.forEach(size => {
    createIconFile(size);
  });
  
  // 生成maskable图标
  createIconFile(512, true);
  
  console.log(`\n✅ 成功生成 ${ICON_SIZES.length + 1} 个图标文件！`);
  console.log('\n📝 注意：');
  console.log('   当前生成的是SVG格式的临时图标');
  console.log('   生产环境建议使用PNG格式');
  console.log('   可使用在线工具转换：https://www.pwabuilder.com/\n');
  
  // 创建图标转换指南
  const conversionGuide = `# 图标转换指南

## 当前状态
- ✅ 已生成SVG格式图标
- ⚠️ 需要转换为PNG格式

## 转换方法

### 方法1：在线转换
1. 访问：https://www.pwabuilder.com/imageGenerator
2. 上传 icon-512.svg
3. 下载生成的所有尺寸PNG图标
4. 替换当前的SVG文件

### 方法2：命令行转换（需要安装工具）
\`\`\`bash
# 安装 sharp
npm install -g sharp-cli

# 批量转换
for size in 72 96 128 144 152 192 384 512; do
  sharp icon-\${size}.svg -o icon-\${size}.png
done

sharp maskable-icon.svg -o maskable-icon.png
\`\`\`

### 方法3：使用设计工具
- Figma/Sketch/Photoshop导入SVG
- 导出为对应尺寸的PNG

## 验证
转换完成后，删除.svg文件，保留.png文件即可。
`;
  
  fs.writeFileSync(path.join(ICONS_DIR, 'CONVERSION_GUIDE.md'), conversionGuide);
  console.log('📋 创建转换指南：CONVERSION_GUIDE.md\n');
  
} catch (error) {
  console.error('❌ 图标生成失败:', error.message);
  process.exit(1);
}
