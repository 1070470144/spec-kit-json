# 数据库外部存储 - PM2 安装器集成实现

## 📋 实现计划

在 `pm2-installer.ps1` 中集成数据库外部存储功能，支持：
- 自动数据库迁移
- 本地和生产环境通用
- 一键切换到外部存储
- 兼容现有部署流程

## 🔧 实现方案

### 1. 添加新的菜单选项

在主菜单中添加：
```
13) 迁移数据库到外部存储
14) 检查数据库状态
```

### 2. 核心功能函数

#### 2.1 检查数据库存储状态
```powershell
function Check-DatabaseLocation($cfg) {
    # 检查当前数据库位置
    # 返回: internal, external, or mixed
}
```

#### 2.2 迁移数据库到外部
```powershell
function Step-MigrateToExternalDB($cfg) {
    # 完整的迁移流程
}
```

#### 2.3 更新环境变量生成
```powershell
function Step-GenerateEnv($cfg) {
    # 支持外部数据库路径
}
```

#### 2.4 更新备份逻辑
```powershell
function Step-Backup($cfg) {
    # 智能检测数据库位置并备份
}
```

### 3. 本地开发支持

支持相对路径和绝对路径：
```env
# 生产环境
DATABASE_URL="file:C:/apps/juben-data/database/juben.db"

# 本地开发环境
DATABASE_URL="file:../juben-data/database/juben.db"
```

## 📝 修改清单

### 需要修改的函数
1. ✅ `Step-GenerateEnv` - 支持外部数据库配置
2. ✅ `Step-Backup` - 智能备份逻辑
3. ✅ `Step-CloneOrPull` - 移除数据库备份逻辑
4. ✅ `Menu` - 新增菜单选项
5. ✅ 新增 `Step-MigrateToExternalDB` - 迁移功能
6. ✅ 新增 `Check-DatabaseLocation` - 状态检查

### 新增配置选项
```powershell
$cfg.UseExternalDB = $true/$false
$cfg.DataDir = "C:\apps\juben-data"  # 或相对路径
```
