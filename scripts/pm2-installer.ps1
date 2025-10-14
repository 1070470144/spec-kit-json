# PM2 deploy/upgrade panel (Windows, Node.js)
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/pm2-installer.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function T($s){ Write-Host "`n=== $s ===`n" -ForegroundColor Cyan }
function OK($s){ Write-Host "[OK] $s" -ForegroundColor Green }
function Info($s){ Write-Host "[i] $s" -ForegroundColor Yellow }
function Err($s){ Write-Host "[x] $s" -ForegroundColor Red }

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$CfgPath = Join-Path $Root 'pm2-installer.config.json'

function LoadCfg(){ if(Test-Path $CfgPath){ return Get-Content $CfgPath -Raw | ConvertFrom-Json } else { return [pscustomobject]@{ RepoUrl='https://github.com/1070470144/spec-kit-json'; Branch='master'; DeployDir='C:\apps\juben'; DataDir='C:\apps\juben-data'; UseExternalDB=$false; APP_BASE_URL='https://localhost'; APP_PORT='10080'; NEXTAUTH_SECRET=''; SMTP_HOST='smtp.163.com'; SMTP_PORT='465'; SMTP_USER='meng1070470144@163.com'; SMTP_PASS='XDiCHucXDTxi99M8'; MAIL_FROM='meng1070470144@163.com'; } } }
function SaveCfg([object]$cfg){ $cfg | ConvertTo-Json -Depth 5 | Out-File -Encoding UTF8 $CfgPath }

function HasNode(){ node -v *> $null; return ($LASTEXITCODE -eq 0) }
function HasNpm(){ npm -v *> $null; return ($LASTEXITCODE -eq 0) }
function HasGit(){ git --version *> $null; return ($LASTEXITCODE -eq 0) }
function GenSecret(){ [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).Guid + (New-Guid).Guid)) }

function Step-Config([ref]$cfgRef){
  $c = $cfgRef.Value
  T 'CONFIG'
  $v = Read-Host "GitHub repo (e.g. https://github.com/you/repo.git) [current: $($c.RepoUrl)]"; if($v){$c.RepoUrl=$v}
  $v = Read-Host "Branch [current: $($c.Branch)]"; if($v){$c.Branch=$v}
  $v = Read-Host "Deploy directory [current: $($c.DeployDir)]"; if($v){$c.DeployDir=$v}
  $v = Read-Host "Data directory [current: $($c.DataDir)]"; if($v){$c.DataDir=$v}
  $v = Read-Host "Use external database? (y/n) [current: $(if($c.UseExternalDB){'y'}else{'n'})]"; if($v){$c.UseExternalDB=($v -eq 'y')}
  $v = Read-Host "APP_BASE_URL [current: $($c.APP_BASE_URL)]"; if($v){$c.APP_BASE_URL=$v}
  $v = Read-Host "APP_PORT (internal service port) [current: $($c.APP_PORT)]"; if($v){$c.APP_PORT=$v}
  if(-not $c.NEXTAUTH_SECRET -or [string]::IsNullOrWhiteSpace($c.NEXTAUTH_SECRET)) { $c.NEXTAUTH_SECRET = GenSecret }
  Info "SMTP optional; you can configure later in Admin UI"
  $v = Read-Host "SMTP_HOST [current: $($c.SMTP_HOST)]"; if($v){$c.SMTP_HOST=$v}
  $v = Read-Host "SMTP_PORT [current: $($c.SMTP_PORT)]"; if($v){$c.SMTP_PORT=$v}
  $v = Read-Host "SMTP_USER [current: $($c.SMTP_USER)]"; if($v){$c.SMTP_USER=$v}
  $v = Read-Host "SMTP_PASS [current: $($c.SMTP_PASS)]"; if($v){$c.SMTP_PASS=$v}
  $v = Read-Host "MAIL_FROM [current: $($c.MAIL_FROM)]"; if($v){$c.MAIL_FROM=$v}
  SaveCfg $c; $cfgRef.Value = $c; OK 'config saved'
}

# 检查数据库存储位置
function Check-DatabaseLocation($cfg){
  # Ensure DataDir exists for backward compatibility
  if(-not ($cfg.PSObject.Properties['DataDir'])){ $cfg | Add-Member -NotePropertyName 'DataDir' -NotePropertyValue 'C:\apps\juben-data' -Force }
  if(-not ($cfg.PSObject.Properties['UseExternalDB'])){ $cfg | Add-Member -NotePropertyName 'UseExternalDB' -NotePropertyValue $false -Force }
  
  $internalDB = Join-Path $cfg.DeployDir 'prisma\dev.db'
  $externalDB = Join-Path $cfg.DataDir 'database\juben.db'
  
  $hasInternal = Test-Path $internalDB
  $hasExternal = Test-Path $externalDB
  
  if($hasInternal -and $hasExternal){
    return 'mixed'  # 两个地方都有数据库
  } elseif($hasExternal){
    return 'external'  # 只有外部数据库
  } elseif($hasInternal){
    return 'internal'  # 只有内部数据库
  } else {
    return 'none'     # 没有数据库
  }
}

# 显示数据库状态
function Step-CheckDatabaseStatus($cfg){
  T 'DATABASE STATUS'
  
  # Ensure DataDir exists for backward compatibility
  if(-not ($cfg.PSObject.Properties['DataDir'])){ $cfg | Add-Member -NotePropertyName 'DataDir' -NotePropertyValue 'C:\apps\juben-data' -Force }
  if(-not ($cfg.PSObject.Properties['UseExternalDB'])){ $cfg | Add-Member -NotePropertyName 'UseExternalDB' -NotePropertyValue $false -Force }
  
  $location = Check-DatabaseLocation $cfg
  $internalDB = Join-Path $cfg.DeployDir 'prisma\dev.db'
  $externalDB = Join-Path $cfg.DataDir 'database\juben.db'
  
  switch($location){
    'internal' {
      Info 'Database location: Internal (traditional mode)'
      Info "Path: $internalDB"
      if(Test-Path $internalDB){
        $size = [math]::Round((Get-Item $internalDB).Length / 1MB, 2)
        Info "Size: $size MB"
      }
      Info 'Recommendation: Migrate to external storage to simplify deployment'
    }
    'external' {
      OK 'Database location: External (recommended mode)'
      Info "Path: $externalDB"
      if(Test-Path $externalDB){
        $size = [math]::Round((Get-Item $externalDB).Length / 1MB, 2)
        Info "Size: $size MB"
      }
      Info 'Status: Optimized, code updates no longer need to backup database'
    }
    'mixed' {
      Err 'WARNING: Found multiple database files'
      Info "Internal: $internalDB"
      Info "External: $externalDB"
      Info 'Recommendation: Manual cleanup or use migration function'
    }
    'none' {
      Info 'Database file not found'
      Info 'Will be created automatically on first deployment'
    }
  }
  
  # Check environment variable configuration
  $envPath = Join-Path $cfg.DeployDir '.env'
  if(Test-Path $envPath){
    $envContent = Get-Content $envPath -Raw
    if($envContent -match 'DATABASE_URL="([^"]+)"'){
      Info "Environment variable: $($matches[1])"
    } else {
      Info 'Environment variable: DATABASE_URL not configured'
    }
  } else {
    Info 'Environment file: Does not exist'
  }
}

function Step-CheckTools(){
  if(-not (HasGit)){ Err 'Git not found. Install Git for Windows first.'; throw 'git missing' }
  if(-not (HasNode)){ Err 'Node.js not found. Install Node.js LTS first.'; throw 'node missing' }
  if(-not (HasNpm)){ Err 'npm not found. Install Node.js properly.'; throw 'npm missing' }
}

# 迁移数据库到外部存储
function Step-MigrateToExternalDB($cfg){
  T 'MIGRATE DATABASE TO EXTERNAL STORAGE'
  
  # Ensure DataDir exists for backward compatibility
  if(-not ($cfg.PSObject.Properties['DataDir'])){ $cfg | Add-Member -NotePropertyName 'DataDir' -NotePropertyValue 'C:\apps\juben-data' -Force }
  if(-not ($cfg.PSObject.Properties['UseExternalDB'])){ $cfg | Add-Member -NotePropertyName 'UseExternalDB' -NotePropertyValue $false -Force }
  
  $location = Check-DatabaseLocation $cfg
  if($location -eq 'external'){
    OK 'Database already in external storage, no migration needed'
    return
  }
  
  $internalDB = Join-Path $cfg.DeployDir 'prisma\dev.db'
  $externalDB = Join-Path $cfg.DataDir 'database\juben.db'
  $internalUploads = Join-Path $cfg.DeployDir 'uploads'
  $externalUploads = Join-Path $cfg.DataDir 'uploads'
  
  # Confirm migration
  Info 'Prepare to migrate database to external storage:'
  Info "  From: $internalDB"
  Info "  To: $externalDB"
  if(Test-Path $internalUploads){
    Info 'Also migrate uploads folder:'
    Info "  From: $internalUploads"
    Info "  To: $externalUploads"
  }
  
  $confirm = Read-Host 'Confirm migration? Make sure you have backup first! (y/n)'
  if($confirm -ne 'y' -and $confirm -ne 'Y'){
    Info 'Migration cancelled'
    return
  }
  
  try {
    # Stop service
    Info 'Stopping PM2 service...'
    try { npx pm2 stop juben 2>$null } catch { Info 'PM2 not running or already stopped' }
    
    # Create external directories
    Info 'Creating external data directories...'
    $dataDbDir = Join-Path $cfg.DataDir 'database'
    $dataUploadsDir = Join-Path $cfg.DataDir 'uploads'
    $dataBackupDir = Join-Path $cfg.DataDir 'backups'
    
    if(!(Test-Path $dataDbDir)){ New-Item -ItemType Directory -Force -Path $dataDbDir | Out-Null }
    if(!(Test-Path $dataUploadsDir)){ New-Item -ItemType Directory -Force -Path $dataUploadsDir | Out-Null }
    if(!(Test-Path $dataBackupDir)){ New-Item -ItemType Directory -Force -Path $dataBackupDir | Out-Null }
    
    # Migrate database
    if(Test-Path $internalDB){
      Info 'Migrating database file...'
      if(Test-Path $externalDB){ 
        $backup = Join-Path $dataBackupDir "juben-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').db"
        Move-Item $externalDB $backup
        Info "Existing external DB backed up to: $backup"
      }
      Copy-Item $internalDB $externalDB -Force
      OK 'Database migrated successfully'
    } else {
      Info 'Internal database not found, will create new one externally'
    }
    
    # Migrate uploads folder
    if(Test-Path $internalUploads){
      Info 'Migrating uploads folder...'
      if(Test-Path $externalUploads){
        Info 'Merging uploads folder contents...'
        Copy-Item -Path "$internalUploads\*" -Destination $externalUploads -Recurse -Force
      } else {
        Copy-Item -Path $internalUploads -Destination $externalUploads -Recurse -Force
      }
      OK 'Uploads folder migrated successfully'
    }
    
    # Update config
    Info 'Updating config...'
    $cfg.UseExternalDB = $true
    SaveCfg $cfg
    
    # Update env
    Info 'Updating environment variables...'
    Step-GenerateEnv $cfg
    
    # Regenerate Prisma
    Info 'Regenerating Prisma client...'
    Push-Location $cfg.DeployDir
    try {
      npx prisma db push 2>$null
      npx prisma generate 2>$null
    } catch {
      Info 'Prisma commands completed'
    }
    Pop-Location
    
    # Restart service
    Info 'Restarting PM2 service...'
    try { npx pm2 restart juben } catch { Info 'Please manually start: npx pm2 start juben' }
    
    OK 'Database migration completed!'
    Info "Database now at: $externalDB"
    Info 'Next code updates will NOT need to backup database!'
    
    # Ask to cleanup
    $cleanup = Read-Host 'Delete old internal database and uploads folder? (y/n)'
    if($cleanup -eq 'y' -or $cleanup -eq 'Y'){
      if(Test-Path $internalDB){
        Remove-Item $internalDB -Force
        OK 'Deleted internal database'
      }
      if(Test-Path $internalUploads){
        Remove-Item $internalUploads -Recurse -Force
        OK 'Deleted internal uploads folder'
      }
    } else {
      Info 'Old files kept, you can delete manually later'
    }
    
  } catch {
    Err "Migration error: $_"
    Info 'Please restore from backup and retry'
  }
}

function Step-GenerateEnv($cfg){
  T 'WRITE .env'
  if(!(Test-Path $cfg.DeployDir)){ New-Item -ItemType Directory -Force -Path $cfg.DeployDir | Out-Null }
  
  # Ensure DataDir exists for backward compatibility
  if(-not ($cfg.PSObject.Properties['DataDir'])){ $cfg | Add-Member -NotePropertyName 'DataDir' -NotePropertyValue 'C:\apps\juben-data' -Force }
  if(-not ($cfg.PSObject.Properties['UseExternalDB'])){ $cfg | Add-Member -NotePropertyName 'UseExternalDB' -NotePropertyValue $false -Force }
  
  # 确保外部数据目录存在（如果使用外部数据库）
  if($cfg.UseExternalDB){
    $dataDbDir = Join-Path $cfg.DataDir 'database'
    $dataUploadsDir = Join-Path $cfg.DataDir 'uploads'
    if(!(Test-Path $dataDbDir)){ New-Item -ItemType Directory -Force -Path $dataDbDir | Out-Null }
    if(!(Test-Path $dataUploadsDir)){ New-Item -ItemType Directory -Force -Path $dataUploadsDir | Out-Null }
  }
  
  $envPath = Join-Path $cfg.DeployDir '.env'
  
  # 根据配置选择数据库路径
  $databaseUrl = if($cfg.UseExternalDB){
    $externalDbPath = Join-Path $cfg.DataDir 'database\juben.db'
    "file:$($externalDbPath -replace '\\', '/')"
  } else {
    "file:./prisma/dev.db"
  }
  
  $content = @(
    ('APP_BASE_URL={0}' -f $cfg.APP_BASE_URL),
    ('PORT={0}' -f $cfg.APP_PORT),
    ('DATABASE_URL="{0}"' -f $databaseUrl),
    ('NEXTAUTH_SECRET={0}' -f $cfg.NEXTAUTH_SECRET),
    ('SMTP_HOST={0}' -f $cfg.SMTP_HOST),
    ('SMTP_PORT={0}' -f $cfg.SMTP_PORT),
    ('SMTP_USER={0}' -f $cfg.SMTP_USER),
    ('SMTP_PASS={0}' -f $cfg.SMTP_PASS),
    ('MAIL_FROM={0}' -f $cfg.MAIL_FROM)
  ) -join "`n"
  
  # 如果使用外部存储，添加 uploads 路径
  if($cfg.UseExternalDB){
    $uploadsPath = Join-Path $cfg.DataDir 'uploads'
    $content += "`nUPLOADS_PATH=`"$($uploadsPath -replace '\\', '/')`""
  }
  
  $content | Out-File -Encoding UTF8 $envPath
  
  $dbMode = if($cfg.UseExternalDB){'External DB'}else{'Internal DB'}
  OK "env written: $envPath ($dbMode)"
}

function Step-CloneOrPull($cfg){
  T 'CLONE/PULL REPO'
  if(!(Test-Path (Join-Path $cfg.DeployDir '.git'))){
    git clone --branch $cfg.Branch $cfg.RepoUrl $cfg.DeployDir
  } else {
    Push-Location $cfg.DeployDir
    # backup local-only files to avoid rebase blocking
    $bk = Join-Path $cfg.DeployDir '.deploy_backup'
    if(!(Test-Path $bk)){ New-Item -ItemType Directory -Force -Path $bk | Out-Null }
    
    # 根据数据库位置决定需要备份的文件
    $location = Check-DatabaseLocation $cfg
    $toBackup = @(
      @{Path='.env'; Name='env'}
    )
    
    # Only backup database and uploads in internal storage mode
    if($location -eq 'internal' -and !$cfg.UseExternalDB){
      $toBackup += @{Path='uploads'; Name='uploads'}
      $toBackup += @{Path='prisma\dev.db'; Name='dev.db'}
      Info 'Internal storage mode detected, will backup database and uploads'
    } else {
      Info 'External storage mode detected, skipping database and uploads backup'
    }
    
    Info 'Starting production data backup...'
    foreach($item in $toBackup){ 
      if(Test-Path $item.Path){ 
        $dest = Join-Path $bk $item.Name
        if(Test-Path $dest){ Remove-Item $dest -Recurse -Force }
        Copy-Item -Recurse -Force -Path $item.Path -Destination $dest
        OK "Backed up: $($item.Path)"
      } else {
        Info "Skipped (not exists): $($item.Path)"
      }
    }

    git fetch --all --prune
    git checkout $cfg.Branch
    git reset --hard HEAD
    # 仅清理代码文件，完全不碰数据文件
    git clean -fd -e .deploy_backup -e .env -e uploads/ -e prisma/
    git pull --rebase

    # 强制还原备份（覆盖任何拉下来的文件）
    Info 'Starting production data restore...'
    foreach($item in $toBackup){ 
      $src = Join-Path $bk $item.Name
      if(Test-Path $src){ 
        # 确保目标目录存在
        $targetDir = Split-Path -Parent $item.Path
        if($targetDir -and !(Test-Path $targetDir)){ 
          New-Item -ItemType Directory -Force -Path $targetDir | Out-Null 
        }
        # 删除可能存在的目标，然后复制
        if(Test-Path $item.Path){ Remove-Item $item.Path -Recurse -Force }
        Copy-Item -Recurse -Force -Path $src -Destination $item.Path
        OK "Restored: $($item.Path)"
      } else {
        Info "Backup not exists, skip: $($item.Path)"
      }
    }
    
    Info 'Keep backup directory for emergency recovery'
    # Remove-Item $bk -Force -Recurse -ErrorAction SilentlyContinue
    Pop-Location
  }
  OK 'repo synced'
}

function Step-Build($cfg){
  T 'INSTALL & BUILD'
  Push-Location $cfg.DeployDir
  npm ci
  npx prisma db push  # 只同步结构，不清空数据（替代 migrate deploy）
  npx prisma generate
  npm run build
  Pop-Location
  OK 'build done'
}

function Step-Start($cfg){
  T 'START PM2'
  Push-Location $cfg.DeployDir
  # Use PM2 JSON config to run Next via Node directly (robust on Windows)
  $pm2CfgPath = Join-Path $cfg.DeployDir 'pm2-juben.config.json'
  $nextBin = Join-Path $cfg.DeployDir 'node_modules\next\dist\bin\next'
  $args = 'start -p {0} -H 0.0.0.0' -f $cfg.APP_PORT
  $pm2Cfg = @{
    apps = @(
      @{ name = 'juben'; cwd = $cfg.DeployDir; script = $nextBin; args = $args; interpreter = 'node'; env = @{ PORT = $cfg.APP_PORT; HOST = '0.0.0.0'; NODE_ENV = 'production'; APP_BASE_URL = $cfg.APP_BASE_URL; NEXTAUTH_URL = $cfg.APP_BASE_URL } }
    )
  } | ConvertTo-Json -Depth 6
  $pm2Cfg | Out-File -Encoding UTF8 $pm2CfgPath
  npx pm2 start $pm2CfgPath
  npx pm2 save
  # On Windows, pm2 startup may not detect an init system; it's safe to ignore errors
  try { npx pm2 startup | Out-Null } catch { Info 'pm2 startup not available on Windows; consider pm2-windows-service or NSSM for auto-start' }
  Pop-Location
  OK 'pm2 started'
}

function Step-Restart($cfg){ T 'RESTART PM2'; npx pm2 restart juben; OK 'pm2 restarted' }
function Step-Stop($cfg){ T 'STOP PM2'; npx pm2 stop juben; OK 'pm2 stopped' }
function Step-Logs($cfg){ T 'LOGS (Ctrl+C to exit)'; npx pm2 logs juben }

function Step-OneKeyUpdate($cfg){
  T 'ONE-KEY UPDATE (7->9->3->4->6)'
  Info 'Steps: Stop -> Backup -> Pull -> Build -> Restart'
  $confirm = Read-Host 'Continue? (y/n)'
  if($confirm -ne 'y'){ Info 'Cancelled'; return }
  
  Step-Stop $cfg
  Step-Backup $cfg
  Step-CheckTools
  Step-CloneOrPull $cfg
  Step-Build $cfg
  Step-Restart $cfg
  
  OK 'Update completed successfully!'
  Info 'Check logs via menu option 8 if needed'
}

function Step-Backup($cfg){
  T 'BACKUP DATABASE & UPLOADS'
  $ts = Get-Date -Format 'yyyyMMdd-HHmmss'
  
  # Ensure DataDir exists for backward compatibility
  if(-not ($cfg.PSObject.Properties['DataDir'])){ $cfg | Add-Member -NotePropertyName 'DataDir' -NotePropertyValue 'C:\apps\juben-data' -Force }
  if(-not ($cfg.PSObject.Properties['UseExternalDB'])){ $cfg | Add-Member -NotePropertyName 'UseExternalDB' -NotePropertyValue $false -Force }
  
  # 检测数据库位置
  $location = Check-DatabaseLocation $cfg
  Info "Detected database location: $location"
  
  # 根据数据库位置确定备份路径
  if($location -eq 'external' -or $cfg.UseExternalDB){
    # 外部存储模式：备份外部数据
    $backupDir = Join-Path $cfg.DataDir 'backups'
    $uploads = Join-Path $cfg.DataDir 'uploads'
    $database = Join-Path $cfg.DataDir 'database\juben.db'
    $backupType = "data"
    Info 'Using external storage backup mode'
  } else {
    # 传统模式：备份项目内数据
    $backupDir = Join-Path $cfg.DeployDir 'backups'
    $uploads = Join-Path $cfg.DeployDir 'uploads'
    $database = Join-Path $cfg.DeployDir 'prisma\dev.db'
    $backupType = "project"
    Info 'Using internal storage backup mode'
  }
  
  if(!(Test-Path $backupDir)){ New-Item -ItemType Directory -Force -Path $backupDir | Out-Null }
  
  # 检查 7-Zip 是否可用
  $sevenZip = Get-Command 7z -ErrorAction SilentlyContinue
  
  # 检查 uploads 文件夹大小
  $uploadsSize = 0
  if(Test-Path $uploads){
    $uploadsSize = (Get-ChildItem $uploads -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1GB
    Info "uploads folder size: $([math]::Round($uploadsSize, 2)) GB"
  }
  
  # 检查数据库大小
  $dbSize = 0
  if(Test-Path $database){
    $dbSize = (Get-Item $database).Length / 1MB
    Info "Database size: $([math]::Round($dbSize, 2)) MB"
  }
  
  # 如果 uploads 超过 2GB 且没有 7-Zip，使用不压缩的备份策略
  if($uploadsSize -gt 2 -and !$sevenZip){
    Info 'Large files detected (>2GB) and 7-Zip not installed'
    Info 'Will use uncompressed backup (direct file copy)'
    
    $backupFolder = Join-Path $backupDir "$backupType-backup-$ts"
    New-Item -ItemType Directory -Force -Path $backupFolder | Out-Null
    
    # 复制 uploads
    if(Test-Path $uploads){
      Info 'Copying uploads folder...'
      Copy-Item -Recurse -Force -Path $uploads -Destination (Join-Path $backupFolder 'uploads')
    }
    
    # 复制数据库
    if(Test-Path $database){
      Info 'Copying database...'
      $dbFileName = if($location -eq 'external'){'juben.db'}else{'dev.db'}
      Copy-Item -Force -Path $database -Destination (Join-Path $backupFolder $dbFileName)
    }
    
    OK "Backup saved to: $backupFolder (uncompressed)"
    Info 'Recommend installing 7-Zip for compressed backups: https://www.7-zip.org/'
    return
  }
  
  # 使用压缩备份
  $tempBackupDir = Join-Path $backupDir "temp-$ts"
  if(!(Test-Path $tempBackupDir)){ New-Item -ItemType Directory -Force -Path $tempBackupDir | Out-Null }
  
  $hasFiles = $false
  
  # 复制文件到临时目录
  if(Test-Path $uploads){
    Info "正在复制 uploads 文件夹..."
    Copy-Item -Recurse -Force -Path $uploads -Destination (Join-Path $tempBackupDir 'uploads')
    $hasFiles = $true
  }
  
  if(Test-Path $database){
    Info "正在复制数据库..."
    $dbFileName = if($location -eq 'external'){'juben.db'}else{'dev.db'}
    Copy-Item -Force -Path $database -Destination (Join-Path $tempBackupDir $dbFileName)
    $hasFiles = $true
  }
  
  if($hasFiles){
    $target = Join-Path $backupDir "$backupType-backup-$ts.zip"
    
    if($sevenZip){
      # 使用 7-Zip 压缩（内存占用低）
      Info 'Compressing with 7z...'
      try {
        # -mx5 = 中等压缩（平衡速度和大小），内存占用更低
        $result = & 7z a -tzip $target "$tempBackupDir\*" -mx5 -mmt=on 2>&1
        if($LASTEXITCODE -eq 0){
          OK "backup saved: $target (using 7z)"
        } else {
          throw "7z compression failed: $result"
        }
      } catch {
        Err "7z compression failed: $_"
        Info "Backup files copied to: $tempBackupDir (uncompressed)"
        Info 'You can manually compress this folder using 7-Zip'
        return
      }
    } else {
      # PowerShell 压缩（仅用于小文件）
      Info 'Compressing with PowerShell...'
      try {
        # 压缩数据库
        $dbFile = if($location -eq 'external'){Join-Path $tempBackupDir 'juben.db'}else{Join-Path $tempBackupDir 'dev.db'}
        if(Test-Path $dbFile){
          Compress-Archive -Path $dbFile -DestinationPath $target -Force -CompressionLevel Fastest
        }
        # 尝试追加 uploads（如果失败则放弃）
        if(Test-Path (Join-Path $tempBackupDir 'uploads')){
          try {
            Compress-Archive -Path (Join-Path $tempBackupDir 'uploads') -DestinationPath $target -Update -CompressionLevel Fastest
            OK "backup saved: $target"
          } catch {
            Err 'uploads folder too large, cannot compress with PowerShell'
            Info "Database backed up to: $target"
            Info "uploads folder copied to: $tempBackupDir\uploads (uncompressed)"
            Info 'Strongly recommend installing 7-Zip: https://www.7-zip.org/'
            return
          }
        }
      } catch {
        Err "Compression failed: $_"
        Info "Backup files copied to: $tempBackupDir (uncompressed)"
        return
      }
    }
    
    # Clean up temp directory
    Remove-Item -Recurse -Force $tempBackupDir -ErrorAction SilentlyContinue
    
    # Show backup size
    if(Test-Path $target){
      $size = (Get-Item $target).Length / 1MB
      Info "Backup file size: $([math]::Round($size, 2)) MB"
    }
    
    # Show backup advantage
    if($location -eq 'external'){
      Info 'External storage mode: No need to backup data during code updates'
    } else {
      Info 'Tip: Migrate to external storage to simplify deployment'
    }
  } else {
    Info 'nothing to backup'
  }
}

# Quick expose 10080 and show access URL
function Step-QuickExpose(){
  T 'QUICK EXPOSE 10080'
  try {
    netsh advfirewall firewall add rule name="Juben HTTP 10080" dir=in action=allow protocol=TCP localport=10080 | Out-Null
  } catch {}
  $pub = ''
  try { $pub = (Invoke-RestMethod -UseBasicParsing -Uri 'https://api.ipify.org') } catch {}
  if([string]::IsNullOrWhiteSpace($pub)){
    try { $pub = (Invoke-RestMethod -UseBasicParsing -Uri 'https://ifconfig.me') } catch {}
  }
  if([string]::IsNullOrWhiteSpace($pub)){
    $pub = (Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch '^169\.' } | Select-Object -ExpandProperty IPAddress -First 1)
  }
  if([string]::IsNullOrWhiteSpace($pub)){ $pub = '你的服务器IP' }
  $url = 'http://{0}:10080' -f $pub
  OK ('opened firewall for 10080. Access: {0}' -f $url)
  Info '如果在云厂商上，请确认安全组也放行 10080。'
}

# Enable Windows portproxy: 80 -> 127.0.0.1:APP_PORT
function Step-EnablePortProxy($cfg){
  T 'ENABLE PORTPROXY 80 -> APP_PORT'
  try { sc config iphlpsvc start= auto | Out-Null } catch {}
  try { net start iphlpsvc | Out-Null } catch {}
  try { netsh advfirewall firewall add rule name=`"HTTP 80`" dir=in action=allow protocol=TCP localport=80 | Out-Null } catch {}
  # remove existing rule if any
  try { netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=80 | Out-Null } catch {}
  try { netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=80 connectaddress=127.0.0.1 connectport=$($cfg.APP_PORT) | Out-Null } catch {}
  netsh interface portproxy show v4tov4 | Out-String | % { $_ }
  OK ('portproxy enabled: 80 -> 127.0.0.1:{0}. Set Cloudflare DNS: A to server IP (proxied), SSL/TLS = Flexible.' -f $cfg.APP_PORT)
}

# Disable Windows portproxy: remove 80 mapping
function Step-DisablePortProxy(){
  T 'DISABLE PORTPROXY 80'
  try { netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=80 | Out-Null } catch {}
  netsh interface portproxy show v4tov4 | Out-String | % { $_ }
  OK 'portproxy (80) disabled'
}

function Menu(){
  $cfg = LoadCfg
  
  # Ensure DataDir exists for backward compatibility
  if(-not ($cfg.PSObject.Properties['DataDir'])){ $cfg | Add-Member -NotePropertyName 'DataDir' -NotePropertyValue 'C:\apps\juben-data' -Force }
  if(-not ($cfg.PSObject.Properties['UseExternalDB'])){ $cfg | Add-Member -NotePropertyName 'UseExternalDB' -NotePropertyValue $false -Force }
  
  while($true){
    T 'PM2 INSTALL/UPGRADE PANEL (Windows)'
    $summary = 'repo: {0} | branch: {1} | dir: {2} | url: {3}' -f $cfg.RepoUrl, $cfg.Branch, $cfg.DeployDir, $cfg.APP_BASE_URL
    Write-Host $summary -ForegroundColor Gray
    
    # Show database status
    $dbLocation = Check-DatabaseLocation $cfg
    $dbStatus = switch($dbLocation){
      'external' { 'DB: External' }
      'internal' { 'DB: Internal' }
      'mixed' { 'DB: Mixed' }
      'none' { 'DB: None' }
    }
    Write-Host "  $dbStatus | data: $($cfg.DataDir)" -ForegroundColor Gray
    
    Write-Host '1) config'
    Write-Host '2) write .env'
    Write-Host '3) clone/pull repo'
    Write-Host '4) install & build'
    Write-Host '5) start (pm2)'
    Write-Host '6) restart (pm2)'
    Write-Host '7) stop (pm2)'
    Write-Host '8) logs (pm2)'
    Write-Host '9) backup database/uploads'
    Write-Host '10) enable portproxy 80 -> APP_PORT'
    Write-Host '11) disable portproxy 80'
    Write-Host '12) one-key update (7->9->3->4->6)' -ForegroundColor Green
    Write-Host '13) migrate database to external storage' -ForegroundColor Yellow
    Write-Host '14) check database status' -ForegroundColor Cyan
    Write-Host '0) exit'
    $sel = Read-Host 'select'
    switch($sel){
      '1' { Step-Config ([ref]$cfg); continue }
      '2' { Step-GenerateEnv $cfg; continue }
      '3' { Step-CheckTools; Step-CloneOrPull $cfg; continue }
      '4' { Step-CheckTools; Step-Build $cfg; continue }
      '5' { Step-CheckTools; Step-Start $cfg; continue }
      '6' { Step-Restart $cfg; continue }
      '7' { Step-Stop $cfg; continue }
      '8' { Step-Logs $cfg; continue }
      '9' { Step-Backup $cfg; continue }
      '10' { Step-EnablePortProxy $cfg; continue }
      '11' { Step-DisablePortProxy; continue }
      '12' { Step-OneKeyUpdate $cfg; continue }
      '13' { Step-MigrateToExternalDB $cfg; continue }
      '14' { Step-CheckDatabaseStatus $cfg; continue }
      '0' { break }
      default { Info 'invalid option'; Start-Sleep -Seconds 1 }
    }
  }
}

Menu


