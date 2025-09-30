# 验证清单：首页 M3 优化

## 开发验证

### ✅ 代码质量
- [x] 无 TypeScript 错误
- [x] 无 ESLint 警告
- [x] 所有组件有类型定义
- [x] 代码符合项目规范

### ✅ 文件完整性
- [x] `tailwind.config.ts` - M3 设计令牌
- [x] `app/globals.css` - M3 组件类
- [x] `app/_components/HeroSection.tsx` - 新增
- [x] `app/_components/FeaturesGrid.tsx` - 新增
- [x] `app/_components/HotCarousel.tsx` - 已优化
- [x] `app/page.tsx` - 已更新

## 设计规范验证

### M3 颜色系统
- [x] Primary: `#6750A4`
- [x] Surface: `#FFFBFE`
- [x] On-Surface: `#1C1B1F`
- [x] Outline: `#79747E`
- [x] 所有颜色使用令牌而非硬编码

### M3 排版系统
- [x] Display Large (57px) - Hero 标题
- [x] Display Small (36px) - Hero 标题 mobile
- [x] Body Large (16px) - Hero 副标题
- [x] Headline Small (24px) - 章节标题
- [x] Title Medium (16px) - 功能卡标题
- [x] Label Large (14px) - 按钮文本

### M3 形状系统
- [x] 按钮: 8px (rounded-sm)
- [x] 功能卡: 8px (rounded-sm)
- [x] 轮播: 12px (rounded-md)
- [x] Icon 按钮: 圆形 (rounded-full)

### M3 高度系统
- [x] 功能卡: elevation-1
- [x] 轮播: elevation-2
- [x] 功能卡 hover: elevation-3
- [x] Icon 按钮: elevation-1

## 功能验证

### Hero Section
- [ ] 标题显示正确
- [ ] 副标题显示正确
- [ ] "浏览剧本" 按钮可点击 → /scripts
- [ ] "上传剧本" 按钮可点击 → /upload
- [ ] 按钮 hover 有视觉反馈

### 热门轮播
- [ ] 显示热门剧本（或最新 5 个）
- [ ] 自动播放（4秒切换）
- [ ] 左右按钮可手动切换
- [ ] 指示器显示当前位置
- [ ] 点击指示器可跳转
- [ ] 点击封面可进入详情页

### 功能网格
- [ ] 显示 3 个功能卡片
- [ ] 图标显示正确
- [ ] 标题和描述清晰
- [ ] Hover 有阴影提升效果
- [ ] 点击卡片可跳转到对应页面

## 响应式验证

### 移动端 (< 768px)
- [ ] Hero 标题使用 display-small
- [ ] Hero 副标题使用 body-medium
- [ ] 功能网格为单列布局
- [ ] 轮播左右按钮隐藏
- [ ] 轮播指示器可见
- [ ] 按钮不溢出屏幕

### 平板 (768px - 1024px)
- [ ] 布局合理，无破损
- [ ] 文字大小适中
- [ ] 图片比例正确

### 桌面 (> 1024px)
- [ ] Hero 标题使用 display-large
- [ ] Hero 副标题使用 body-large
- [ ] 功能网格为三列布局
- [ ] 轮播左右按钮可见
- [ ] 整体布局居中，max-width 限制生效

## 无障碍验证

### 语义化
- [ ] Hero 使用 `<h1>` 标签
- [ ] 章节标题使用 `<h2>` 标签
- [ ] 所有链接有描述性文本

### ARIA
- [ ] 轮播控制按钮有 aria-label
- [ ] 指示器按钮有 aria-label
- [ ] 无冗余或错误的 ARIA 属性

### 键盘导航
- [ ] Tab 键可遍历所有可交互元素
- [ ] Tab 顺序符合逻辑（从上到下）
- [ ] Enter/Space 可激活按钮和链接
- [ ] Focus 状态有明显视觉反馈

### 颜色对比度
- [ ] Primary (#6750A4) vs White: ≥ 4.5:1
- [ ] Surface-on (#1C1B1F) vs Surface (#FFFBFE): ≥ 4.5:1
- [ ] 所有文本可读性良好

## 性能验证

### SSR
- [ ] Hero 和 Features 在服务端渲染
- [ ] 首次加载无白屏
- [ ] fetchHot() 正常执行

### 客户端
- [ ] 仅轮播需要 hydration
- [ ] 无不必要的客户端 JS
- [ ] 无控制台错误或警告

### 加载速度
- [ ] 首页加载时间 < 2秒
- [ ] LCP < 2.5秒
- [ ] CLS < 0.1

## 浏览器兼容性

### Chrome (最新版本)
- [ ] 所有功能正常
- [ ] 样式显示正确
- [ ] 无控制台错误

### Firefox (最新版本)
- [ ] 所有功能正常
- [ ] 样式显示正确
- [ ] 无控制台错误

### Safari (最新版本)
- [ ] 所有功能正常
- [ ] 样式显示正确
- [ ] 无控制台错误

### Edge (最新版本)
- [ ] 所有功能正常
- [ ] 样式显示正确
- [ ] 无控制台错误

## 回归测试

### 现有功能
- [ ] 导航栏正常
- [ ] 用户登录/退出正常
- [ ] 其他页面未受影响
- [ ] API 端点正常工作

## 测试命令

```bash
# 开发环境
cd xueran-juben-project
npm run dev
# 访问 http://localhost:3000

# 构建测试
npm run build
npm start

# Lint 检查
npm run lint

# 类型检查
npx tsc --noEmit
```

## 验收标准

所有 ✓ 项目都通过测试后，该功能才算完成。

**最低要求**:
- 所有 "开发验证" 通过
- 所有 "设计规范验证" 通过
- 所有 "功能验证" 通过
- 至少 1 种浏览器的 "浏览器兼容性" 通过

**理想状态**:
- 所有验证项目全部通过
