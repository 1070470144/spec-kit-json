# 039 - 数据库外部存储迁移

## 📋 需求概述

将 SQLite 数据库从项目目录内（`prisma/dev.db`）迁移到项目外部，实现数据与代码分离，避免每次代码更新时都需要备份数据库。

## 🎯 目标

- **数据安全**：代码更新不影响数据
- **简化部署**：无需每次更新都备份数据库
- **规范化存储**：数据和代码分离
- **便于管理**：独立的数据目录便于维护

## 📐 技术方案

### 当前状态
```
C:\apps\juben\
├── prisma\
│   └── dev.db          # 数据库在项目内
├── uploads\            # 上传文件
├── .env
└── ...
```

### 目标状态
```
C:\apps\juben\          # 项目代码目录
├── prisma\
│   └── schema.prisma   # 只保留 schema
├── .env                # 数据库路径指向外部
└── ...

C:\apps\juben-data\     # 独立数据目录
├── database\
│   └── juben.db        # 数据库文件
└── uploads\            # 上传文件也可移到这里
```

### 环境变量配置

#### 修改后的 `.env`
```env
# 原来
DATABASE_URL="file:./prisma/dev.db"

# 修改后
DATABASE_URL="file:C:/apps/juben-data/database/juben.db"
```

## 🔧 实现方案

### 1. 创建外部数据目录结构

```powershell
# 创建独立数据目录
$dataDir = "C:\apps\juben-data"
New-Item -ItemType Directory -Force -Path "$dataDir\database"
New-Item -ItemType Directory -Force -Path "$dataDir\uploads"
New-Item -ItemType Directory -Force -Path "$dataDir\backups"
```

### 2. 数据库迁移步骤

#### 2.1 停止服务
```powershell
npx pm2 stop juben
```

#### 2.2 迁移现有数据库
```powershell
# 如果存在现有数据库，先迁移
if(Test-Path "C:\apps\juben\prisma\dev.db"){
    Copy-Item "C:\apps\juben\prisma\dev.db" "C:\apps\juben-data\database\juben.db"
    Write-Host "数据库已迁移到外部目录"
}
```

#### 2.3 迁移上传文件（可选）
```powershell
# 可选：也将 uploads 移到外部
if(Test-Path "C:\apps\juben\uploads"){
    Copy-Item -Recurse "C:\apps\juben\uploads\*" "C:\apps\juben-data\uploads\"
    Write-Host "上传文件已迁移到外部目录"
}
```

#### 2.4 更新环境变量
```powershell
# 更新 .env 文件
$envPath = "C:\apps\juben\.env"
$envContent = Get-Content $envPath
$envContent = $envContent -replace 'DATABASE_URL="file:./prisma/dev.db"', 'DATABASE_URL="file:C:/apps/juben-data/database/juben.db"'
$envContent | Set-Content $envPath
```

#### 2.5 重新生成数据库
```powershell
cd C:\apps\juben
npx prisma db push
npx prisma generate
```

#### 2.6 重启服务
```powershell
npx pm2 restart juben
```

### 3. 修改备份脚本

更新 `pm2-installer.ps1` 中的备份逻辑：

```powershell
function Step-Backup($cfg){
  T 'BACKUP database & uploads'
  $ts = Get-Date -Format 'yyyyMMdd-HHmmss'
  $backupDir = Join-Path $cfg.DeployDir 'backups'
  if(!(Test-Path $backupDir)){ New-Item -ItemType Directory -Force -Path $backupDir | Out-Null }
  
  # 外部数据目录
  $dataDir = "C:\apps\juben-data"
  $database = Join-Path $dataDir "database\juben.db"
  $uploads = Join-Path $dataDir "uploads"
  
  # 检查文件是否存在
  $hasFiles = $false
  if(Test-Path $database){ $hasFiles = $true }
  if(Test-Path $uploads){ $hasFiles = $true }
  
  if($hasFiles){
    $target = Join-Path $backupDir "data-backup-$ts.zip"
    
    # 使用 7z 或 PowerShell 压缩
    # ... 压缩逻辑
    
    OK "数据备份已保存到: $target"
  } else {
    Info 'no data to backup'
  }
}
```

### 4. 修改部署脚本

#### 4.1 在 `Step-GenerateEnv` 中更新

```powershell
function Step-GenerateEnv($cfg){
  T 'WRITE .env'
  if(!(Test-Path $cfg.DeployDir)){ New-Item -ItemType Directory -Force -Path $cfg.DeployDir | Out-Null }
  
  # 确保数据目录存在
  $dataDir = "C:\apps\juben-data"
  if(!(Test-Path "$dataDir\database")){ New-Item -ItemType Directory -Force -Path "$dataDir\database" | Out-Null }
  if(!(Test-Path "$dataDir\uploads")){ New-Item -ItemType Directory -Force -Path "$dataDir\uploads" | Out-Null }
  
  $envPath = Join-Path $cfg.DeployDir '.env'
  $content = @(
    ('APP_BASE_URL={0}' -f $cfg.APP_BASE_URL),
    ('PORT={0}' -f $cfg.APP_PORT),
    'DATABASE_URL="file:C:/apps/juben-data/database/juben.db"',  # 更新路径
    ('NEXTAUTH_SECRET={0}' -f $cfg.NEXTAUTH_SECRET),
    ('SMTP_HOST={0}' -f $cfg.SMTP_HOST),
    ('SMTP_PORT={0}' -f $cfg.SMTP_PORT),
    ('SMTP_USER={0}' -f $cfg.SMTP_USER),
    ('SMTP_PASS={0}' -f $cfg.SMTP_PASS),
    ('MAIL_FROM={0}' -f $cfg.MAIL_FROM),
    'UPLOADS_PATH="C:/apps/juben-data/uploads"'  # 可选：外部上传目录
  ) -join "`n"
  $content | Out-File -Encoding UTF8 $envPath
  OK "env written: $envPath (使用外部数据库)"
}
```

#### 4.2 在 `Step-CloneOrPull` 中移除数据备份

```powershell
# 修改备份逻辑，只备份代码相关配置
$toBackup = @(
  @{Path='.env'; Name='env'}
  # 移除数据库和uploads的备份，因为它们已经在外部
)
```

## 📊 对比分析

### 迁移前 vs 迁移后

| 方面 | 迁移前 | 迁移后 |
|------|--------|--------|
| **数据库位置** | `项目内/prisma/dev.db` | `外部/C:/apps/juben-data/database/juben.db` |
| **代码更新** | 需要备份数据库和uploads | 只需要备份配置文件 |
| **备份大小** | 包含数据（可能几GB） | 只有代码和配置（几MB） |
| **更新速度** | 慢（需备份大文件） | 快（无需备份数据） |
| **数据安全** | 代码更新可能影响数据 | 数据完全独立，更安全 |
| **磁盘管理** | 数据和代码混合 | 数据和代码分离 |

## 🎯 优势

### 1. **简化部署流程**
- ✅ 代码更新无需备份数据
- ✅ 更新速度快（只拉取代码）
- ✅ 降低更新失败风险

### 2. **提高数据安全**
- ✅ 数据和代码物理分离
- ✅ 代码回滚不影响数据
- ✅ 意外删除项目不会丢失数据

### 3. **便于管理**
- ✅ 独立的数据备份策略
- ✅ 更清晰的目录结构
- ✅ 便于数据迁移和维护

## ⚠️ 注意事项

### 1. **路径权限**
- 确保应用有读写外部数据目录的权限
- Windows 路径分隔符使用 `/` 或 `\\`

### 2. **首次迁移**
- 必须先停止服务再迁移
- 验证数据完整性
- 保留原数据备份

### 3. **监控检查**
- 迁移后验证应用功能
- 检查数据库连接
- 确认文件上传功能

## 🔄 迁移计划

### 阶段一：准备和测试
1. 在测试环境验证方案
2. 准备迁移脚本
3. 制定回滚计划

### 阶段二：生产迁移
1. 停止服务
2. 创建外部数据目录
3. 迁移数据库和文件
4. 更新配置
5. 重启服务
6. 验证功能

### 阶段三：清理和优化
1. 清理项目内的旧数据文件
2. 更新备份脚本
3. 更新部署脚本
4. 文档更新

## 📝 实施清单

- [ ] 创建迁移脚本
- [ ] 修改 pm2-installer.ps1
- [ ] 更新环境变量配置
- [ ] 测试数据库连接
- [ ] 验证文件上传功能
- [ ] 更新备份逻辑
- [ ] 更新部署流程
- [ ] 编写操作文档

## 🎉 预期效果

迁移完成后：
- ✅ 代码更新时间从 **2-5分钟** 减少到 **30秒-1分钟**
- ✅ 备份大小从 **GB级别** 减少到 **MB级别**
- ✅ 数据安全性显著提升
- ✅ 部署流程大幅简化

---

**这个方案可以完美解决你提到的备份问题！** 需要我立即实现这个迁移方案吗？
