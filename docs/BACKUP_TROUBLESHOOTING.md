# 备份故障排除指南

## 🚨 问题：内存不足错误

### 错误信息
```
Compress-Archive : 使用"3"个参数调用"Write"时发生异常:
"引发类型为"System.OutOfMemoryException"的异常。"
```

### 原因
- PowerShell 的 `Compress-Archive` 命令在压缩大文件时会将所有数据加载到内存
- 如果 `uploads` 文件夹包含大量图片或大文件，会导致内存不足
- 云服务器通常内存有限，更容易出现此问题

---

## 📂 备份文件位置

### 默认备份目录
```
C:\apps\juben\backups\
```

### 备份文件命名
```
backup-yyyyMMdd-HHmmss.zip
例如: backup-20251014-143022.zip
```

### 备份内容
1. **uploads 文件夹** - 所有上传的剧本图片和预览图
2. **prisma\dev.db** - SQLite 数据库

---

## ✅ 解决方案

### 方案 1：使用优化后的备份脚本（推荐）

我已经优化了备份脚本，它现在：
- ✅ 使用分块压缩，降低内存占用
- ✅ 先复制文件，再压缩（避免直接压缩大量文件）
- ✅ 支持 7-Zip（更高效）
- ✅ 如果压缩失败，至少保留文件副本

**使用方法**：
```powershell
# 更新脚本
cd D:\xue\test-spec-pro\xueran-juben-project
git pull

# 重新运行备份
powershell -ExecutionPolicy Bypass -File scripts/pm2-installer.ps1
# 选择菜单项 9
```

### 方案 2：安装 7-Zip（最佳性能）

**安装 7-Zip**：
```powershell
# 下载并安装
# 访问: https://www.7-zip.org/

# 或使用 Chocolatey
choco install 7zip -y

# 添加到系统路径
$env:PATH += ";C:\Program Files\7-Zip"
```

安装后，备份脚本会自动使用 7-Zip，内存占用更低，速度更快。

### 方案 3：手动备份（临时方案）

如果自动备份持续失败，可以手动备份：

#### 步骤 1：复制文件
```powershell
# 进入部署目录
cd C:\apps\juben

# 创建备份目录
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = "backups\manual-$ts"
mkdir $backupDir

# 复制 uploads
Copy-Item -Recurse uploads $backupDir\uploads

# 复制数据库
Copy-Item prisma\dev.db $backupDir\dev.db
```

#### 步骤 2：手动压缩
- 右键点击 `backups\manual-XXXXXX` 文件夹
- 选择"发送到" → "压缩(zipped)文件夹"
- 或使用 7-Zip 右键菜单压缩

### 方案 4：分开备份（减少单次内存占用）

修改备份策略，分别备份数据库和文件：

```powershell
cd C:\apps\juben

$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
mkdir backups -Force

# 仅备份数据库（小文件）
Compress-Archive -Path prisma\dev.db -DestinationPath "backups\db-$ts.zip" -Force

# 仅备份 uploads（如果太大，考虑使用 7z 或手动压缩）
# 如果 uploads 很大，建议使用 7z：
# 7z a "backups\uploads-$ts.zip" uploads\
```

---

## 📊 检查备份文件大小

```powershell
# 查看 uploads 大小
cd C:\apps\juben
$size = (Get-ChildItem uploads -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Uploads 文件夹大小: $([math]::Round($size, 2)) MB"

# 查看数据库大小
$dbSize = (Get-Item prisma\dev.db).Length / 1MB
Write-Host "数据库大小: $([math]::Round($dbSize, 2)) MB"

# 查看现有备份
Get-ChildItem backups\*.zip | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB, 2)}}
```

---

## 🔧 优化建议

### 1. 定期清理旧备份
```powershell
# 保留最近 7 天的备份，删除旧的
cd C:\apps\juben\backups
$cutoffDate = (Get-Date).AddDays(-7)
Get-ChildItem *.zip | Where-Object { $_.CreationTime -lt $cutoffDate } | Remove-Item
```

### 2. 增加服务器内存
- 如果 `uploads` 文件夹持续增长，考虑升级云服务器内存
- 建议至少 2GB 内存用于备份操作

### 3. 使用增量备份
```powershell
# 仅备份最近修改的文件（需要自定义脚本）
$lastBackup = Get-Date "2025-10-13"
Get-ChildItem uploads -Recurse | Where-Object { $_.LastWriteTime -gt $lastBackup }
```

### 4. 外部备份服务
考虑使用云存储服务：
- OneDrive
- Google Drive
- 阿里云 OSS
- 腾讯云 COS

---

## 🆘 紧急恢复

### 如果需要恢复备份：

```powershell
# 1. 停止服务
npx pm2 stop juben

# 2. 解压备份文件
cd C:\apps\juben
$backupFile = "backups\backup-20251014-143022.zip"
Expand-Archive -Path $backupFile -DestinationPath "restore-temp" -Force

# 3. 恢复文件
Copy-Item -Recurse -Force restore-temp\uploads uploads
Copy-Item -Force restore-temp\dev.db prisma\dev.db

# 4. 重启服务
npx pm2 restart juben

# 5. 清理临时文件
Remove-Item -Recurse restore-temp
```

---

## 📝 备份最佳实践

### 自动备份计划
建议使用 Windows 任务计划程序定期备份：

1. 打开"任务计划程序"
2. 创建基本任务
3. 设置触发器：每天凌晨 3:00
4. 操作：运行 PowerShell 脚本
5. 脚本路径：`C:\path\to\backup-script.ps1`

### 备份检查清单
- [ ] 每周检查备份文件是否正常生成
- [ ] 每月测试一次恢复流程
- [ ] 定期清理旧备份文件
- [ ] 监控备份文件大小增长趋势
- [ ] 考虑异地备份（云存储）

---

## 📞 需要帮助？

如果问题持续存在：

1. **检查错误日志**
   ```powershell
   npx pm2 logs juben --lines 100
   ```

2. **查看系统资源**
   ```powershell
   # 检查可用内存
   Get-WmiObject -Class Win32_OperatingSystem | 
     Select-Object @{Name="FreeMemory(MB)";Expression={[math]::Round($_.FreePhysicalMemory/1KB, 2)}}
   ```

3. **尝试最小化备份**
   - 只备份数据库
   - 手动归档 uploads 文件夹

---

## ✅ 解决方案总结

| 方案 | 内存占用 | 速度 | 难度 | 推荐度 |
|------|---------|------|------|--------|
| 使用优化后的脚本 | 中 | 中 | 低 | ⭐⭐⭐⭐⭐ |
| 安装 7-Zip | 低 | 快 | 低 | ⭐⭐⭐⭐⭐ |
| 手动备份 | 低 | 慢 | 低 | ⭐⭐⭐ |
| 分开备份 | 低 | 中 | 中 | ⭐⭐⭐⭐ |

**推荐**：安装 7-Zip + 使用优化后的脚本 = 最佳体验！

