# 云服务器操作指南

## 🚀 当前任务：启动项目并更新

---

## 📋 快速启动步骤

### 方案 1：使用 PM2 安装器（推荐）

#### 1. 上传最新脚本（如果还没上传）
```powershell
# 将本地 scripts/pm2-installer.ps1 上传到服务器 C:\pm2-installer.ps1
```

#### 2. 在服务器上运行脚本
```powershell
powershell -ExecutionPolicy Bypass -File C:\pm2-installer.ps1
```

#### 3. 启动服务
```
在菜单中输入: 6
按 Enter

预期输出:
  [OK] pm2 restarted

如果服务未启动，选择: 5 (start pm2)
```

#### 4. 检查服务状态
```powershell
# 退出脚本（输入 0）后，在 PowerShell 中执行：
npx pm2 list
npx pm2 logs juben --lines 20
```

---

### 方案 2：手动启动（备用）

```powershell
# 1. 进入项目目录
cd C:\apps\juben

# 2. 检查 PM2 状态
npx pm2 list

# 3. 重启服务
npx pm2 restart juben

# 如果服务不存在，先启动：
npx pm2 start npm --name juben -- start

# 4. 查看日志确认
npx pm2 logs juben --lines 20
```

---

## 🔄 更新代码流程

### 推荐流程：先启动 → 再迁移数据库 → 最后更新

#### 第一步：启动当前版本
```
目的：先让网站恢复访问
方法：菜单项 6 (restart) 或菜单项 5 (start)
```

#### 第二步：迁移数据库（解决内存问题）
```
目的：解决备份内存不足问题
方法：菜单项 13 (migrate database to external storage)
步骤：
  1. 选择 13
  2. 输入 y 确认
  3. 等待1-2分钟
  4. 输入 y 删除旧文件
```

#### 第三步：更新代码
```
目的：更新到最新版本
方法：菜单项 12 (one-key update)
步骤：
  1. 选择 12
  2. 输入 y 确认
  3. 等待30秒完成（迁移后超快！）
```

---

## 📝 完整操作序列

### 在服务器 PowerShell 中执行：

```powershell
# 1. 运行 PM2 安装器
powershell -ExecutionPolicy Bypass -File C:\pm2-installer.ps1
```

然后依次执行：

```
# 2. 启动服务
select: 6
[Enter]

# 3. 检查数据库状态
select: 14
[Enter]

# 4. 迁移数据库到外部（解决内存问题）
select: 13
[Enter]
Confirm migration? (y/n): y
[Enter]
(等待1-2分钟自动完成)
Delete old files? (y/n): y
[Enter]

# 5. 验证迁移结果
select: 14
[Enter]
(应该显示: DB: External)

# 6. 更新代码到最新版本
select: 12
[Enter]
Continue? (y/n): y
[Enter]
(等待30秒完成)

# 7. 查看日志确认
select: 8
[Enter]
(按 Ctrl+C 退出日志)

# 8. 退出脚本
select: 0
[Enter]
```

---

## 🌐 验证网站功能

### 访问网站测试
```
网址：www.quanyuanzhuiyi.icu

测试功能：
✓ 打开首页
✓ 用户登录
✓ 浏览剧本列表
✓ 查看剧本详情
✓ 上传剧本/图片
✓ 生成预览图
✓ 下载超高清图片

全部正常即成功！
```

---

## 🚨 常见问题处理

### 问题 1：服务启动失败
```powershell
# 检查日志
npx pm2 logs juben --lines 50

# 检查环境变量
type C:\apps\juben\.env

# 手动重启
npx pm2 restart juben
```

### 问题 2：网站无法访问
```powershell
# 检查服务状态
npx pm2 list
# 确认 juben 状态为 online

# 检查端口
netstat -ano | findstr :10080

# 检查防火墙
netsh advfirewall firewall show rule name=all | findstr 10080
```

### 问题 3：数据库连接失败
```powershell
# 检查数据库文件
# 内部模式：
dir C:\apps\juben\prisma\dev.db

# 外部模式：
dir C:\apps\juben-data\database\juben.db

# 重新生成 Prisma 客户端
cd C:\apps\juben
npx prisma generate
```

---

## ⚡ 快速参考

### PM2 常用命令
```powershell
npx pm2 list              # 查看所有服务
npx pm2 restart juben     # 重启服务
npx pm2 stop juben        # 停止服务
npx pm2 start juben       # 启动服务
npx pm2 logs juben        # 查看日志
npx pm2 logs juben -f     # 实时日志
npx pm2 monit             # 监控面板
```

### 项目目录
```
C:\apps\juben\              # 项目代码
C:\apps\juben-data\         # 外部数据（迁移后）
C:\pm2-installer.ps1        # PM2 安装器脚本
```

---

## 🎯 推荐操作顺序

**优先级排序：**

1. **立即启动服务**（让网站恢复访问）
   - 菜单项：6 (restart) 或 5 (start)

2. **迁移数据库**（解决内存问题，一劳永逸）
   - 菜单项：13 (migrate)
   
3. **更新代码**（获取最新功能）
   - 菜单项：12 (update)

4. **验证功能**（确保一切正常）
   - 访问网站测试

---

## ✅ 成功标志

### 启动成功
- PM2 显示：`juben | online`
- 网站可以正常访问

### 迁移成功
- 菜单显示：`DB: External`
- 状态检查：`Database location: External`

### 更新成功
- 更新时间：~30秒（比之前快10倍）
- 无内存错误
- 所有功能正常

---

**按这个顺序操作，你的项目将快速恢复并解决内存问题！** 🚀

需要我实时指导你操作吗？

