# Spec 024: 预览图技能文字支持多行扩展

## 问题描述
用户反馈自动生成的预览图中，角色技能描述被限制为最多两行，长文本被截断并添加省略号，导致重要信息丢失。

## 解决方案
改进文本分割逻辑，支持根据文本长度自动扩展到多行（最多 5 行），并在标点符号处智能换行。

## 修改的文件
- `src/generators/script-preview.ts`
  - 修改 `splitTextToLines()` 函数

## 技术实现

### 改进的 `splitTextToLines()` 函数
```typescript
// 修改前：固定两行
const splitTextToLines = (text: string, maxLength: number): string[] => {
  if (text.length <= maxLength) return [text]
  const firstLine = text.substring(0, maxLength)
  const secondLine = remainingText.length > maxLength 
    ? remainingText.substring(0, maxLength - 2) + '..'
    : remainingText
  return [firstLine, secondLine]
}

// 修改后：支持多行扩展
const splitTextToLines = (
  text: string, 
  maxLength: number, 
  maxLines: number = 5
): string[] => {
  // 支持 1-5 行动态扩展
  // 优先在标点符号处换行
  // 超过 5 行才显示省略号
}
```

## 用户体验
- **短技能（1-2 行）**: 完整显示，无变化
- **中等技能（3-4 行）**: 现在可以完整展示，不再截断
- **长技能（5+ 行）**: 显示前 5 行，最后一行添加省略号

## 验收检查
- [x] 创建 spec 文档
- [ ] 修改文本分割函数
- [ ] 测试不同长度的技能文本
- [ ] 验证布局和对齐

## 相关文档
- [完整规格说明](./spec.md)

