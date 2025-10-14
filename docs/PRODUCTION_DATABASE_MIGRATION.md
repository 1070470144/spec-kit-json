# 生产环境数据库迁移指南

## 🎯 目标

将生产环境的数据库从项目内部迁移到外部存储，解决备份内存不足问题，提升部署效率。

## ⚠️ 重要提醒

**在执行任何操作前，请务必：**
1. ✅ 创建完整备份
2. ✅ 在低峰时段操作
3. ✅ 准备回滚方案
4. ✅ 通知用户可能的短暂中断

## 📋 操作步骤

### 步骤 1：上传更新后的脚本

1. **下载最新脚本**
   ```bash
   # 在本地项目目录
   git pull origin master
   ```

2. **上传到服务器**
   ```powershell
   # 方法1: 直接替换
   # 将本地 scripts/pm2-installer.ps1 上传到服务器 C:\pm2-installer.ps1
   
   # 方法2: 如果有Git访问权限
   cd C:\apps\juben
   git pull origin master
   ```

### 步骤 2：检查当前状态

```powershell
# 在服务器上运行
powershell -ExecutionPolicy Bypass -File C:\pm2-installer.ps1

# 选择菜单项: 14) 检查数据库状态
```

**预期输出**：
```
=== DATABASE STATUS ===

[i] 数据库位置: 项目内部 (传统模式)
[i] 路径: C:\apps\juben\prisma\dev.db
[i] 大小: 15.8 MB
[i] 建议: 迁移到外部存储以简化部署
[i] 环境变量配置: file:./prisma/dev.db
```

### 步骤 3：创建安全备份

```powershell
# 在菜单中选择: 9) backup database/uploads
# 或手动备份：
cd C:\apps\juben
mkdir backups-migration -Force
copy prisma\dev.db backups-migration\dev-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').db
xcopy uploads backups-migration\uploads-backup /E /I
```

### 步骤 4：执行数据库迁移

```powershell
# 在 PM2 安装器菜单中选择: 13) 迁移数据库到外部存储
```

**迁移过程示例**：
```
=== MIGRATE DATABASE TO EXTERNAL STORAGE ===

准备将数据库迁移到外部存储:
  从: C:\apps\juben\prisma\dev.db
  到: C:\apps\juben-data\database\juben.db
同时迁移 uploads 文件夹:
  从: C:\apps\juben\uploads
  到: C:\apps\juben-data\uploads

确认迁移? 建议先备份! (y/n): y

[i] 停止 PM2 服务...
[i] 创建外部数据目录...
[i] 迁移数据库文件...
[OK] 数据库迁移完成
[i] 迁移 uploads 文件夹...
[OK] uploads 文件夹迁移完成
[i] 更新配置...
[i] 更新环境变量...
[i] 重新生成数据库连接...
[i] 重启服务...

[OK] 数据库迁移完成!
[i] 数据库现在位于: C:\apps\juben-data\database\juben.db
[i] 下次代码更新将无需备份数据库

是否删除项目内的旧数据库和uploads文件夹? (y/n): y
[OK] 已删除内部数据库文件
[OK] 已删除内部 uploads 文件夹
```

### 步骤 5：验证迁移结果

1. **检查数据库状态**
   ```powershell
   # 菜单项: 14) 检查数据库状态
   ```
   
   **预期输出**：
   ```
   [OK] 数据库位置: 外部存储 (推荐模式)
   [i] 路径: C:\apps\juben-data\database\juben.db
   [i] 环境变量配置: file:C:/apps/juben-data/database/juben.db
   [i] 状态: 已优化，代码更新无需备份数据库
   ```

2. **验证应用功能**
   ```bash
   # 访问网站，测试核心功能：
   # - 用户登录
   # - 浏览剧本
   # - 上传图片
   # - 数据显示正常
   ```

3. **检查文件结构**
   ```powershell
   # 验证外部数据目录
   ls C:\apps\juben-data
   # 应该看到: database/, uploads/, backups/
   
   ls C:\apps\juben-data\database
   # 应该看到: juben.db
   
   ls C:\apps\juben-data\uploads
   # 应该看到迁移的上传文件
   ```

### 步骤 6：测试备份功能

```powershell
# 菜单项: 9) backup database/uploads
```

**预期输出**：
```
=== BACKUP DATABASE & UPLOADS ===

[i] 检测到数据库位置: external
[i] 使用外部存储备份模式
[i] uploads 文件夹大小: 2.34 GB
[i] 数据库大小: 15.8 MB
[OK] backup saved: C:\apps\juben-data\backups\data-backup-20251014-143022.zip
[i] ✓ 外部存储模式：代码更新时无需备份数据
```

### 步骤 7：测试代码更新流程

```powershell
# 模拟代码更新: 菜单项 12) one-key update
```

**预期效果**：
- ✅ 更新速度显著提升（从几分钟到30秒）
- ✅ 无内存不足错误
- ✅ 数据完全保留

---

## 🗂️ 迁移后的目录结构

### 生产环境结构
```
C:\apps\juben\          # 🔄 项目代码目录（更新时覆盖）
├── prisma\
│   └── schema.prisma   # 只保留 schema 文件
├── .env                # 指向外部数据库
├── package.json
└── ... 其他代码文件

C:\apps\juben-data\     # 💾 外部数据目录（永不变动）
├── database\
│   └── juben.db        # 迁移后的数据库
├── uploads\            # 迁移后的上传文件
└── backups\            # 数据备份目录
```

### 环境变量更新
```env
# 迁移前 (.env)
DATABASE_URL="file:./prisma/dev.db"

# 迁移后 (.env)
DATABASE_URL="file:C:/apps/juben-data/database/juben.db"
UPLOADS_PATH="C:/apps/juben-data/uploads"
```

---

## 🚨 故障排除

### 问题 1：迁移过程中断
**现象**：迁移过程中出现错误或中断

**解决方案**：
```powershell
# 1. 恢复备份
cd C:\apps\juben
copy backups-migration\dev-backup-*.db prisma\dev.db
xcopy backups-migration\uploads-backup uploads /E /I

# 2. 重启服务
npx pm2 restart juben

# 3. 检查错误日志后重试
```

### 问题 2：服务启动失败
**现象**：迁移后服务无法启动

**解决方案**：
```powershell
# 检查环境变量
type C:\apps\juben\.env
# 确认 DATABASE_URL 路径正确

# 手动测试数据库连接
cd C:\apps\juben
npx prisma db push
npx prisma generate

# 重启服务
npx pm2 restart juben
```

### 问题 3：数据丢失
**现象**：迁移后部分数据丢失

**解决方案**：
```powershell
# 1. 立即停止服务
npx pm2 stop juben

# 2. 检查数据库文件
ls C:\apps\juben-data\database\juben.db
# 对比文件大小和修改时间

# 3. 如需要，恢复备份
copy backups-migration\dev-backup-*.db C:\apps\juben-data\database\juben.db

# 4. 重启服务
npx pm2 restart juben
```

### 问题 4：上传功能异常
**现象**：文件上传失败

**解决方案**：
```powershell
# 检查 uploads 目录权限
icacls C:\apps\juben-data\uploads
# 确保应用进程有读写权限

# 检查环境变量
# 确认 UPLOADS_PATH 配置正确
```

---

## 📊 性能对比

### 迁移前 vs 迁移后

| 操作 | 迁移前 | 迁移后 | 改善 |
|------|--------|--------|------|
| **代码更新备份** | 2-5分钟，几GB | 跳过备份 | **节省100%时间** |
| **更新总时间** | 5-10分钟 | 30秒-1分钟 | **提升10倍速度** |
| **内存占用** | 高（经常超限） | 低（无压力） | **解决内存问题** |
| **数据安全** | 中（更新有风险） | 高（完全隔离） | **安全性提升** |

---

## ✅ 迁移清单

**迁移前**：
- [ ] 创建完整备份
- [ ] 上传最新的 pm2-installer.ps1 脚本
- [ ] 选择低峰时段操作
- [ ] 准备回滚方案

**迁移中**：
- [ ] 运行菜单项 14 检查状态
- [ ] 运行菜单项 13 执行迁移
- [ ] 确认迁移过程无错误
- [ ] 选择删除旧文件

**迁移后**：
- [ ] 验证数据库状态显示"外部存储"
- [ ] 测试网站核心功能
- [ ] 验证文件上传功能
- [ ] 测试备份功能
- [ ] 测试代码更新流程

---

## 🎉 迁移成功标志

当你看到以下情况时，说明迁移成功：

1. **菜单显示**：`DB: 外部存储 ✓`
2. **备份提示**：`✓ 外部存储模式：代码更新时无需备份数据`
3. **更新速度**：代码更新从几分钟降到30秒
4. **无内存错误**：备份过程不再出现内存不足
5. **数据完整**：所有功能正常，数据无丢失

---

## 📞 紧急回滚

如果迁移后出现严重问题，可以快速回滚：

```powershell
# 1. 停止服务
npx pm2 stop juben

# 2. 恢复原数据库
cd C:\apps\juben
copy backups-migration\dev-backup-*.db prisma\dev.db
xcopy backups-migration\uploads-backup uploads /E /I

# 3. 恢复环境变量
# 手动编辑 .env 文件，改回：
# DATABASE_URL="file:./prisma/dev.db"

# 4. 重启服务
npx pm2 restart juben
```

---

**迁移完成后，你的生产环境将彻底解决备份内存问题，代码更新效率提升10倍！** 🚀
