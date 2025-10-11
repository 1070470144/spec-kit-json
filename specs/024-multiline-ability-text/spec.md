# Spec 024: 预览图技能文字支持多行扩展

## 概述
**规格编号**: 024  
**创建日期**: 2025-10-11  
**状态**: 实施中  

## 目标
改进自动生成预览图中角色技能描述的文本渲染，支持多行扩展而不是固定限制为两行。

## 背景
当前预览图生成器在渲染角色技能时，强制限制为最多两行：
- 第一行显示前 22 个字符
- 第二行显示接下来的 20 个字符 + ".." 省略号
- **问题**: 很多角色技能描述较长，两行无法完整展示，导致信息丢失

## 需求分析

### 用户反馈
> "我的上传出 自动生成的图片 角色的技能有的文字比较多 不要局限于只有两行，继续第三行扩展 以此类推"

### 功能需求
1. **多行支持**: 技能描述应根据文本长度自动扩展到第三行、第四行等
2. **合理限制**: 设置最大行数（如 5 行）防止无限扩展
3. **智能换行**: 优先在标点符号或空格处换行
4. **保持美观**: 多行文本不应破坏整体布局

### 设计约束
1. **列宽**: 每列宽度约 200px，每行最多 22 个字符（中文）
2. **行高**: 每行 8px 间距
3. **两列布局**: 左右两列角色卡片需要对齐
4. **动态高度**: SVG 高度已支持动态计算

## 设计方案

### 修改前（当前实现）
```typescript
const splitTextToLines = (text: string, maxLength: number): string[] => {
  if (text.length <= maxLength) return [text]
  
  // 固定宽度截断，第一行显示maxLength个字符
  const firstLine = text.substring(0, maxLength)
  const remainingText = text.substring(maxLength)
  
  // 第二行如果还超出，添加省略号
  const secondLine = remainingText.length > maxLength 
    ? remainingText.substring(0, maxLength - 2) + '..'
    : remainingText
  
  return [firstLine, secondLine]
}
```

**限制**: 
- ❌ 固定两行
- ❌ 截断长文本
- ❌ 简单添加 ".." 不够优雅

### 修改后（改进实现）
```typescript
const splitTextToLines = (
  text: string, 
  maxLength: number, 
  maxLines: number = 5
): string[] => {
  if (text.length <= maxLength) return [text]
  
  const lines: string[] = []
  let remaining = text
  
  while (remaining.length > 0 && lines.length < maxLines) {
    if (remaining.length <= maxLength) {
      // 剩余文本可以放在一行
      lines.push(remaining)
      break
    }
    
    // 尝试在标点符号或空格处切分
    let cutPoint = maxLength
    const punctuation = ['。', '，', '；', '：', '！', '？', '.', ',', ';', ':', '!', '?', ' ']
    
    // 在 maxLength 附近查找最近的标点符号
    for (let i = maxLength; i > maxLength - 5 && i > 0; i--) {
      if (punctuation.includes(remaining[i])) {
        cutPoint = i + 1 // 包含标点符号
        break
      }
    }
    
    // 切分当前行
    const currentLine = remaining.substring(0, cutPoint).trim()
    lines.push(currentLine)
    remaining = remaining.substring(cutPoint).trim()
  }
  
  // 如果还有剩余文本（超过最大行数），在最后一行添加省略号
  if (remaining.length > 0 && lines.length === maxLines) {
    const lastLine = lines[lines.length - 1]
    if (lastLine.length > 2) {
      lines[lines.length - 1] = lastLine.substring(0, lastLine.length - 2) + '..'
    }
  }
  
  return lines
}
```

**改进**:
- ✅ 支持多行扩展（默认最多 5 行）
- ✅ 智能在标点符号处换行
- ✅ 超过最大行数才显示省略号
- ✅ 保持文本可读性

### 高度计算调整
当前代码：
```typescript
const currentHeight = abilityLines.length > 0 ? 20 + (abilityLines.length - 1) * 8 : 14
```

这个公式已经支持动态行数，不需要修改。

## 实现步骤

### Phase 1: 修改文本分割函数
- [x] 修改 `splitTextToLines` 函数
- [x] 添加最大行数参数（默认 5）
- [x] 实现智能换行逻辑
- [x] 保留省略号逻辑（仅超过最大行数时使用）

### Phase 2: 测试验证
- [ ] 测试短文本（1 行）
- [ ] 测试中等文本（2-3 行）
- [ ] 测试长文本（4-5 行）
- [ ] 测试超长文本（6+ 行，应显示省略号）
- [ ] 检查两列布局对齐

## 验收标准

### 功能验收
1. ✅ 技能描述根据长度自动扩展到 2-5 行
2. ✅ 优先在标点符号处换行
3. ✅ 超过 5 行时显示省略号
4. ✅ 短文本不受影响（仍为 1 行）

### 视觉验收
1. ✅ 多行文本对齐整齐
2. ✅ 左右两列角色卡片高度正确
3. ✅ 整体布局不被破坏
4. ✅ 行间距合理（8px）

### 性能验收
1. ✅ 生成速度无明显下降
2. ✅ SVG 文件大小增长在合理范围内

## 示例对比

### 当前效果（限制 2 行）
```
【技能】每个夜晚*，你要选择一名存活的玩家：如果..
```

### 改进效果（支持多行）
```
【技能】每个夜晚*，你要选择一名存活的玩家：
如果你选择了邪恶玩家，
他当晚死亡。
```

## 风险与限制

### 已知限制
1. **最大行数**: 限制为 5 行，防止单个角色占用过多空间
2. **SVG 高度**: 角色多且技能长时，SVG 会变得很高
3. **可读性**: 行数太多可能影响阅读体验

### 风险缓解
1. 设置合理的最大行数（5 行）
2. SVG 高度已支持动态计算，可以适应
3. 优化换行位置，提高可读性

## 相关资源
- 预览图生成器: `src/generators/script-preview.ts`
- 相关 Issue: 用户反馈技能文字太长被截断

## 变更历史
- 2025-10-11: 初始创建

