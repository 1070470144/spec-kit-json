#!/usr/bin/env node
/**
 * 图片优化脚本 - 批量生成 WebP 和多尺寸响应式图片
 * 
 * 用法: npx tsx scripts/optimize-images.ts
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM 环境下获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const OUTPUT_DIR = path.join(UPLOADS_DIR, 'optimized');

// 响应式图片尺寸
const RESPONSIVE_SIZES = [640, 768, 1024, 1280, 1536];

// WebP 质量设置
const WEBP_QUALITY = 80;

interface OptimizationResult {
  original: string;
  webp: string;
  sizes: string[];
  originalSize: number;
  webpSize: number;
  savings: number;
}

/**
 * 优化单个图片
 */
async function optimizeImage(inputPath: string): Promise<OptimizationResult> {
  const fileName = path.basename(inputPath);
  const fileNameWithoutExt = path.basename(inputPath, path.extname(inputPath));
  
  console.log(`📸 处理: ${fileName}`);

  // 获取原始文件大小
  const stats = await fs.stat(inputPath);
  const originalSize = stats.size;

  // 生成主 WebP 图片
  const webpPath = path.join(OUTPUT_DIR, `${fileNameWithoutExt}.webp`);
  await sharp(inputPath)
    .webp({ quality: WEBP_QUALITY })
    .toFile(webpPath);

  const webpStats = await fs.stat(webpPath);
  const webpSize = webpStats.size;
  const savings = ((originalSize - webpSize) / originalSize * 100).toFixed(1);

  console.log(`  ✓ WebP: ${(webpSize / 1024).toFixed(1)}KB (节省 ${savings}%)`);

  // 生成响应式尺寸
  const sizeFiles: string[] = [];
  for (const width of RESPONSIVE_SIZES) {
    const sizeFileName = `${fileNameWithoutExt}-${width}w.webp`;
    const sizePath = path.join(OUTPUT_DIR, sizeFileName);
    
    await sharp(inputPath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(sizePath);
    
    sizeFiles.push(sizeFileName);
  }

  console.log(`  ✓ 响应式尺寸: ${RESPONSIVE_SIZES.join(', ')}w`);

  return {
    original: fileName,
    webp: `${fileNameWithoutExt}.webp`,
    sizes: sizeFiles,
    originalSize,
    webpSize,
    savings: parseFloat(savings)
  };
}

/**
 * 批量处理所有图片
 */
async function processAllImages() {
  console.log('🚀 开始图片优化...\n');

  // 确保输出目录存在
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // 读取 uploads 目录
  const files = await fs.readdir(UPLOADS_DIR);
  const imageFiles = files.filter(file => 
    /\.(jpg|jpeg|png)$/i.test(file) && !file.startsWith('.')
  );

  if (imageFiles.length === 0) {
    console.log('⚠️  未找到需要优化的图片');
    return;
  }

  console.log(`📁 找到 ${imageFiles.length} 个图片文件\n`);

  // 处理所有图片
  const results: OptimizationResult[] = [];
  for (const file of imageFiles) {
    try {
      const result = await optimizeImage(path.join(UPLOADS_DIR, file));
      results.push(result);
    } catch (error) {
      console.error(`❌ 处理失败: ${file}`, error);
    }
  }

  // 生成统计报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 优化统计\n');
  
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalWebpSize = results.reduce((sum, r) => sum + r.webpSize, 0);
  const totalSavings = ((totalOriginalSize - totalWebpSize) / totalOriginalSize * 100).toFixed(1);

  console.log(`总图片数: ${results.length}`);
  console.log(`原始大小: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`WebP 大小: ${(totalWebpSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`节省空间: ${totalSavings}% (${((totalOriginalSize - totalWebpSize) / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`生成文件: ${results.length * (1 + RESPONSIVE_SIZES.length)} 个`);
  
  console.log('\n✅ 优化完成！');
  console.log(`📂 输出目录: ${OUTPUT_DIR}`);
}

// 执行
processAllImages().catch(error => {
  console.error('❌ 优化失败:', error);
  process.exit(1);
});

