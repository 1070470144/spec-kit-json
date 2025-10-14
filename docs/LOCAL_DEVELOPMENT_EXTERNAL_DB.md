# 本地开发 - 外部数据库配置

## 📋 概述

本文档说明如何在本地开发环境中配置外部数据库存储，与生产环境保持一致。

## 🎯 目标

- 本地和生产环境使用相同的外部存储结构
- 便于开发和测试
- 避免数据混乱

## 📁 目录结构

### 推荐的本地开发结构
```
D:\dev\
├── juben-project\           # 项目代码目录
│   ├── prisma\
│   │   └── schema.prisma    # 只保留 schema
│   ├── .env                 # 环境变量
│   └── ... 其他项目文件
│
└── juben-data\              # 外部数据目录
    ├── database\
    │   └── juben.db         # 数据库文件
    ├── uploads\             # 上传文件
    └── backups\             # 备份文件
```

## 🔧 配置步骤

### 1. 创建外部数据目录

```powershell
# 在项目根目录同级创建数据目录
mkdir ..\juben-data\database
mkdir ..\juben-data\uploads
mkdir ..\juben-data\backups
```

### 2. 配置环境变量

编辑项目根目录的 `.env` 文件：

```env
# 基本配置
APP_BASE_URL=http://localhost:3000
PORT=3000
NEXTAUTH_SECRET=your-secret-key

# 外部数据库配置（相对路径）
DATABASE_URL="file:../juben-data/database/juben.db"

# 可选：外部上传目录
UPLOADS_PATH="../juben-data/uploads"

# SMTP 配置（开发环境可选）
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
MAIL_FROM=
```

### 3. 初始化数据库

```bash
# 生成 Prisma 客户端
npx prisma generate

# 推送数据库结构
npx prisma db push

# （可选）填充测试数据
npx prisma db seed
```

### 4. 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

## 🌐 生产环境配置

### 环境变量对比

| 环境 | 数据库路径 | uploads路径 |
|------|------------|-------------|
| **本地开发** | `../juben-data/database/juben.db` | `../juben-data/uploads` |
| **生产环境** | `C:/apps/juben-data/database/juben.db` | `C:/apps/juben-data/uploads` |

### 生产环境 `.env`
```env
APP_BASE_URL=https://your-domain.com
PORT=10080
DATABASE_URL="file:C:/apps/juben-data/database/juben.db"
UPLOADS_PATH="C:/apps/juben-data/uploads"
NEXTAUTH_SECRET=production-secret
# ... 其他配置
```

## 📦 PM2 安装器支持

使用 `scripts/pm2-installer.ps1` 可以自动配置外部存储：

### 新功能菜单
```
13) 迁移数据库到外部存储    ← 自动迁移现有数据
14) 检查数据库状态          ← 查看当前存储模式
```

### 配置选项
在菜单 `1) config` 中新增：
- **Data directory**: 外部数据目录路径
- **Use external database**: 是否使用外部数据库

## 🔄 数据迁移

### 从内部存储迁移到外部存储

1. **使用 PM2 安装器**（推荐）
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/pm2-installer.ps1
   # 选择菜单项 13
   ```

2. **手动迁移**
   ```powershell
   # 停止开发服务器
   # Ctrl+C
   
   # 创建外部数据目录
   mkdir ..\juben-data\database
   mkdir ..\juben-data\uploads
   
   # 迁移数据库
   copy prisma\dev.db ..\juben-data\database\juben.db
   
   # 迁移上传文件
   xcopy uploads ..\juben-data\uploads /E /I
   
   # 更新 .env 文件
   # DATABASE_URL="file:../juben-data/database/juben.db"
   
   # 重启开发服务器
   npm run dev
   ```

## 🧪 测试验证

### 1. 验证数据库连接
```bash
npx prisma studio
# 应该能正常打开数据库管理界面
```

### 2. 验证文件上传
- 在应用中上传一个剧本图片
- 检查 `../juben-data/uploads/` 目录中是否有新文件

### 3. 验证数据持久化
- 创建一些测试数据
- 重启开发服务器
- 确认数据仍然存在

## 🔧 故障排除

### 问题 1：数据库连接失败
```
Error: P1003: Database does not exist at ../juben-data/database/juben.db
```

**解决方案**：
```bash
# 确保目录存在
mkdir ..\juben-data\database

# 推送数据库结构
npx prisma db push
```

### 问题 2：上传文件找不到
```
Error: ENOENT: no such file or directory '../juben-data/uploads'
```

**解决方案**：
```bash
# 创建上传目录
mkdir ..\juben-data\uploads
```

### 问题 3：路径分隔符问题
Windows 环境中路径分隔符使用 `/` 或 `\\`：

```env
# 正确
DATABASE_URL="file:../juben-data/database/juben.db"
DATABASE_URL="file:C:/apps/juben-data/database/juben.db"

# 错误
DATABASE_URL="file:..\juben-data\database\juben.db"
```

## 📝 开发建议

### 1. 版本控制
将 `.env` 文件添加到 `.gitignore`，但保留 `.env.example`：

```bash
# .env.example
APP_BASE_URL=http://localhost:3000
PORT=3000
DATABASE_URL="file:../juben-data/database/juben.db"
UPLOADS_PATH="../juben-data/uploads"
NEXTAUTH_SECRET=development-secret
```

### 2. 备份策略
```bash
# 定期备份开发数据
copy ..\juben-data\database\juben.db ..\juben-data\backups\dev-backup-%date:~0,10%.db
```

### 3. 团队协作
- 所有开发者使用相同的外部存储结构
- 共享 `.env.example` 模板
- 文档中说明数据目录创建步骤

## 🎉 优势总结

### 本地开发
- ✅ 与生产环境结构一致
- ✅ 数据和代码分离
- ✅ 便于备份和恢复
- ✅ 支持多项目开发

### 生产部署
- ✅ 代码更新无需备份数据
- ✅ 更新速度快
- ✅ 数据安全性高
- ✅ 便于横向扩展

---

**配置完成后，你的本地开发环境将与生产环境保持完全一致的存储结构！**
