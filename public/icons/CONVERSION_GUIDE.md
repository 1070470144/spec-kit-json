# 图标转换指南

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
```bash
# 安装 sharp
npm install -g sharp-cli

# 批量转换
for size in 72 96 128 144 152 192 384 512; do
  sharp icon-${size}.svg -o icon-${size}.png
done

sharp maskable-icon.svg -o maskable-icon.png
```

### 方法3：使用设计工具
- Figma/Sketch/Photoshop导入SVG
- 导出为对应尺寸的PNG

## 验证
转换完成后，删除.svg文件，保留.png文件即可。
