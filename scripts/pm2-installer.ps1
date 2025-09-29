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

function LoadCfg(){ if(Test-Path $CfgPath){ return Get-Content $CfgPath -Raw | ConvertFrom-Json } else { return [pscustomobject]@{ RepoUrl=''; Branch='main'; DeployDir='C:\apps\juben'; APP_BASE_URL='http://localhost:3000'; NEXTAUTH_SECRET=''; SMTP_HOST=''; SMTP_PORT='465'; SMTP_USER=''; SMTP_PASS=''; MAIL_FROM=''; } } }
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
    "APP_BASE_URL=$($cfg.APP_BASE_URL)",
    "DATABASE_URL=\"file:./prisma/dev.db\"",
    "NEXTAUTH_SECRET=$($cfg.NEXTAUTH_SECRET)",
    "SMTP_HOST=$($cfg.SMTP_HOST)",
    "SMTP_PORT=$($cfg.SMTP_PORT)",
    "SMTP_USER=$($cfg.SMTP_USER)",
    "SMTP_PASS=$($cfg.SMTP_PASS)",
    "MAIL_FROM=$($cfg.MAIL_FROM)"
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
    git fetch --all --prune
    git checkout $cfg.Branch
    git pull --rebase
    Pop-Location
  }
  OK 'repo synced'
}

function Step-Build($cfg){
  T 'INSTALL & BUILD'
  Push-Location $cfg.DeployDir
  npm ci
  npx prisma migrate deploy
  npm run build
  Pop-Location
  OK 'build done'
}

function Step-Start($cfg){
  T 'START PM2'
  Push-Location $cfg.DeployDir
  npx pm2 start npm --name juben -- run start
  npx pm2 save
  npx pm2 startup | Out-Null
  Pop-Location
  OK 'pm2 started'
}

function Step-Restart($cfg){ T 'RESTART PM2'; npx pm2 restart juben; OK 'pm2 restarted' }
function Step-Stop($cfg){ T 'STOP PM2'; npx pm2 stop juben; OK 'pm2 stopped' }
function Step-Logs($cfg){ T 'LOGS (Ctrl+C to exit)'; npx pm2 logs juben }

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
      '0' { break }
      default { Info 'invalid option'; Start-Sleep -Seconds 1 }
    }
  }
}

Menu


