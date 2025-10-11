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

function LoadCfg(){ if(Test-Path $CfgPath){ return Get-Content $CfgPath -Raw | ConvertFrom-Json } else { return [pscustomobject]@{ RepoUrl='https://github.com/1070470144/spec-kit-json'; Branch='master'; DeployDir='C:\apps\juben'; APP_BASE_URL='https://localhost'; APP_PORT='10080'; NEXTAUTH_SECRET=''; SMTP_HOST='smtp.163.com'; SMTP_PORT='465'; SMTP_USER='meng1070470144@163.com'; SMTP_PASS='XDiCHucXDTxi99M8'; MAIL_FROM='meng1070470144@163.com'; } } }
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

function Step-CheckTools(){
  if(-not (HasGit)){ Err 'Git not found. Install Git for Windows first.'; throw 'git missing' }
  if(-not (HasNode)){ Err 'Node.js not found. Install Node.js LTS first.'; throw 'node missing' }
  if(-not (HasNpm)){ Err 'npm not found. Install Node.js properly.'; throw 'npm missing' }
}

function Step-GenerateEnv($cfg){
  T 'WRITE .env'
  if(!(Test-Path $cfg.DeployDir)){ New-Item -ItemType Directory -Force -Path $cfg.DeployDir | Out-Null }
  $envPath = Join-Path $cfg.DeployDir '.env'
  $content = @(
    ('APP_BASE_URL={0}' -f $cfg.APP_BASE_URL),
    ('PORT={0}' -f $cfg.APP_PORT),
    'DATABASE_URL="file:./prisma/prisma/dev.db"',
    ('NEXTAUTH_SECRET={0}' -f $cfg.NEXTAUTH_SECRET),
    ('SMTP_HOST={0}' -f $cfg.SMTP_HOST),
    ('SMTP_PORT={0}' -f $cfg.SMTP_PORT),
    ('SMTP_USER={0}' -f $cfg.SMTP_USER),
    ('SMTP_PASS={0}' -f $cfg.SMTP_PASS),
    ('MAIL_FROM={0}' -f $cfg.MAIL_FROM)
  ) -join "`n"
  $content | Out-File -Encoding UTF8 $envPath
  OK "env written: $envPath"
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
    
    # 使用 Copy 而不是 Move，保持原文件
    $toBackup = @(
      @{Path='.env'; Name='env'},
      @{Path='uploads'; Name='uploads'},
      @{Path='prisma\prisma\dev.db'; Name='dev.db'}
    )
    
    Info "开始备份生产数据..."
    foreach($item in $toBackup){ 
      if(Test-Path $item.Path){ 
        $dest = Join-Path $bk $item.Name
        if(Test-Path $dest){ Remove-Item $dest -Recurse -Force }
        Copy-Item -Recurse -Force -Path $item.Path -Destination $dest
        OK "已备份: $($item.Path)"
      } else {
        Info "跳过（不存在）: $($item.Path)"
      }
    }

    git fetch --all --prune
    git checkout $cfg.Branch
    git reset --hard HEAD
    # 仅清理代码文件，完全不碰数据文件
    git clean -fd -e .deploy_backup -e .env -e uploads/ -e prisma/
    git pull --rebase

    # 强制还原备份（覆盖任何拉下来的文件）
    Info "开始还原生产数据..."
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
        OK "已还原: $($item.Path)"
      } else {
        Info "备份不存在，跳过: $($item.Path)"
      }
    }
    
    Info "保留备份目录，不删除（供紧急恢复）"
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
  T 'BACKUP uploads & SQLite'
  $ts = Get-Date -Format 'yyyyMMdd-HHmmss'
  $backupDir = Join-Path $cfg.DeployDir 'backups'
  if(!(Test-Path $backupDir)){ New-Item -ItemType Directory -Force -Path $backupDir | Out-Null }
  $uploads = Join-Path $cfg.DeployDir 'uploads'
  $sqlite = Join-Path $cfg.DeployDir 'prisma\prisma\dev.db'
  $target = Join-Path $backupDir "backup-$ts.zip"
  $paths = @(); if(Test-Path $uploads){ $paths += $uploads }; if(Test-Path $sqlite){ $paths += $sqlite }
  if($paths.Count -gt 0){ Compress-Archive -Path $paths -DestinationPath $target -Force; OK "backup saved: $target" } else { Info 'nothing to backup' }
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
  try { netsh advfirewall firewall add rule name="HTTP 80" dir=in action=allow protocol=TCP localport=80 | Out-Null } catch {}
  # remove existing rule if any
  try { netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=80 | Out-Null } catch {}
  try { netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=80 connectaddress=127.0.0.1 connectport=$($cfg.APP_PORT) | Out-Null } catch {}
  netsh interface portproxy show v4tov4 | Out-String | % { $_ }
  OK ("portproxy enabled: 80 -> 127.0.0.1:{0}. Set Cloudflare DNS: A to server IP (proxied), SSL/TLS = Flexible." -f $cfg.APP_PORT)
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
  while($true){
    T 'PM2 INSTALL/UPGRADE PANEL (Windows)'
    $summary = 'repo: {0} | branch: {1} | dir: {2} | url: {3}' -f $cfg.RepoUrl, $cfg.Branch, $cfg.DeployDir, $cfg.APP_BASE_URL
    Write-Host $summary -ForegroundColor Gray
    Write-Host '1) config'
    Write-Host '2) write .env'
    Write-Host '3) clone/pull repo'
    Write-Host '4) install & build'
    Write-Host '5) start (pm2)'
    Write-Host '6) restart (pm2)'
    Write-Host '7) stop (pm2)'
    Write-Host '8) logs (pm2)'
    Write-Host '9) backup uploads/sqlite'
    Write-Host '10) enable portproxy 80 -> APP_PORT'
    Write-Host '11) disable portproxy 80'
    Write-Host '12) one-key update (7->9->3->4->6)' -ForegroundColor Green
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
      '0' { break }
      default { Info 'invalid option'; Start-Sleep -Seconds 1 }
    }
  }
}

Menu


