#!/usr/bin/env node
/**
 * 模糊占位图生成脚本 - 为图片生成 LQIP (Low Quality Image Placeholder)
 * 
 * 用法: npx tsx scripts/generate-placeholders.ts
 */

import { getPlaiceholder } from 'plaiceholder';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM 环境下获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'placeholders.json');

interface PlaceholderData {
  fileName: string;
  width: number;
  height: number;
  blurDataURL: string;
  type: string;
}

/**
 * 为单个图片生成占位图
 */
async function generatePlaceholder(imagePath: string): Promise<PlaceholderData> {
  const fileName = path.basename(imagePath);
  
  try {
    // 读取文件为 Buffer
    const buffer = await fs.readFile(imagePath);
    
    const { base64, metadata } = await getPlaiceholder(buffer, {
      size: 10  // 10x10 小图，生成更小的 base64
    });

    console.log(`  ✓ ${fileName}: ${base64.length} bytes`);

    return {
      fileName,
      width: metadata.width,
      height: metadata.height,
      blurDataURL: base64,
      type: metadata.format || 'image/jpeg'
    };
  } catch (error) {
    console.error(`  ❌ ${fileName}: 失败`, error);
    throw error;
  }
}

/**
 * 批量生成所有占位图
 */
async function generateAllPlaceholders() {
  console.log('🎨 开始生成模糊占位图...\n');

  // 确保输出目录存在
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  await fs.mkdir(dataDir, { recursive: true });

  // 读取 uploads 目录
  const files = await fs.readdir(UPLOADS_DIR);
  const imageFiles = files.filter(file => 
    /\.(jpg|jpeg|png|webp)$/i.test(file) && !file.startsWith('.')
  );

  if (imageFiles.length === 0) {
    console.log('⚠️  未找到图片文件');
    return;
  }

  console.log(`📁 找到 ${imageFiles.length} 个图片文件\n`);

  // 生成占位图
  const placeholders: PlaceholderData[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const file of imageFiles) {
    const imagePath = path.join(UPLOADS_DIR, file);
    
    try {
      const placeholder = await generatePlaceholder(imagePath);
      placeholders.push(placeholder);
      successCount++;
    } catch (error) {
      failCount++;
    }
  }

  // 保存到 JSON 文件
  await fs.writeFile(
    OUTPUT_FILE,
    JSON.stringify(placeholders, null, 2),
    'utf-8'
  );

  // 生成统计报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 生成统计\n');
  
  const totalBase64Size = placeholders.reduce(
    (sum, p) => sum + p.blurDataURL.length,
    0
  );

  console.log(`成功: ${successCount}`);
  console.log(`失败: ${failCount}`);
  console.log(`总大小: ${(totalBase64Size / 1024).toFixed(2)} KB`);
  console.log(`平均大小: ${(totalBase64Size / placeholders.length / 1024).toFixed(2)} KB`);
  
  console.log('\n✅ 占位图生成完成！');
  console.log(`📄 输出文件: ${OUTPUT_FILE}`);
  console.log('\n💡 使用示例:');
  console.log(`
import placeholders from '@/data/placeholders.json';

const placeholder = placeholders.find(p => p.fileName === 'image.jpg');

<Image
  src="/uploads/image.jpg"
  alt="Image"
  placeholder="blur"
  blurDataURL={placeholder?.blurDataURL}
  width={placeholder?.width}
  height={placeholder?.height}
/>
  `);
}

// 执行
generateAllPlaceholders().catch(error => {
  console.error('❌ 生成失败:', error);
  process.exit(1);
});

