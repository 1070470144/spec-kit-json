# PowerShell 部署与升级面板（Windows / Docker Compose）
# Usage: Right click "Run with PowerShell" or run:
#   powershell -ExecutionPolicy Bypass -File scripts/installer.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function T($s){ Write-Host "`n=== $s ===`n" -ForegroundColor Cyan }
function OK($s){ Write-Host "[OK] $s" -ForegroundColor Green }
function Info($s){ Write-Host "[i] $s" -ForegroundColor Yellow }
function Err($s){ Write-Host "[x] $s" -ForegroundColor Red }

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$CfgPath = Join-Path $Root 'installer.config.json'

function LoadCfg(){ if(Test-Path $CfgPath){ return Get-Content $CfgPath -Raw | ConvertFrom-Json } else { return [pscustomobject]@{ RepoUrl=''; Branch='main'; DeployDir='C:\apps\juben'; Domain='example.com'; DbUser='botc'; DbPass='botc'; NEXTAUTH_SECRET=''; SMTP_HOST=''; SMTP_PORT='465'; SMTP_USER=''; SMTP_PASS=''; MAIL_FROM=''; } } }
function SaveCfg([object]$cfg){ $cfg | ConvertTo-Json -Depth 5 | Out-File -Encoding UTF8 $CfgPath }

function HasDocker(){ docker compose version *> $null; if($LASTEXITCODE -eq 0){return $true} docker --version *> $null; return ($LASTEXITCODE -eq 0) }
function HasGit(){ git --version *> $null; return ($LASTEXITCODE -eq 0) }

function GenSecret(){ [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).Guid + (New-Guid).Guid)) }

function Step-Config([ref]$cfgRef){
  $c = $cfgRef.Value
  T 'CONFIG'
  $v = Read-Host "GitHub repo (e.g. https://github.com/you/repo.git) [current: $($c.RepoUrl)]"; if($v){$c.RepoUrl=$v}
  $v = Read-Host "Branch [current: $($c.Branch)]"; if($v){$c.Branch=$v}
  $v = Read-Host "Deploy directory [current: $($c.DeployDir)]"; if($v){$c.DeployDir=$v}
  $v = Read-Host "Domain (for HTTPS) [current: $($c.Domain)]"; if($v){$c.Domain=$v}
  $v = Read-Host "DB user [current: $($c.DbUser)]"; if($v){$c.DbUser=$v}
  $v = Read-Host "DB password [current: $($c.DbPass)]"; if($v){$c.DbPass=$v}
  if(-not $c.NEXTAUTH_SECRET -or [string]::IsNullOrWhiteSpace($c.NEXTAUTH_SECRET)) { $c.NEXTAUTH_SECRET = GenSecret }
  Info "SMTP optional; you can configure later in Admin UI (System Email Settings)"
  $v = Read-Host "SMTP_HOST [current: $($c.SMTP_HOST)]"; if($v){$c.SMTP_HOST=$v}
  $v = Read-Host "SMTP_PORT [current: $($c.SMTP_PORT)]"; if($v){$c.SMTP_PORT=$v}
  $v = Read-Host "SMTP_USER [current: $($c.SMTP_USER)]"; if($v){$c.SMTP_USER=$v}
  $v = Read-Host "SMTP_PASS [current: $($c.SMTP_PASS)]"; if($v){$c.SMTP_PASS=$v}
  $v = Read-Host "MAIL_FROM [current: $($c.MAIL_FROM)]"; if($v){$c.MAIL_FROM=$v}
  SaveCfg $c; $cfgRef.Value = $c; OK 'config saved'
}

function Ensure-Tools(){
  if(-not (HasGit)){ Err '未检测到 Git，请先安装 Git（https://git-scm.com/download/win）'; throw 'Git missing' }
  if(-not (HasDocker)){ Err '未检测到 Docker Desktop（含 Compose），请安装后重试（https://www.docker.com/products/docker-desktop/）'; throw 'Docker missing' }
}

function Step-PrepareFiles($cfg){
  T 'GENERATE FILES'
  if(!(Test-Path $cfg.DeployDir)){ New-Item -ItemType Directory -Path $cfg.DeployDir -Force | Out-Null }
  # .env
  $envContent = @(
    "APP_BASE_URL=https://$($cfg.Domain)",
    "DATABASE_URL=postgresql://$($cfg.DbUser):$($cfg.DbPass)@db:5432/botc?schema=public",
    "NEXTAUTH_SECRET=$($cfg.NEXTAUTH_SECRET)",
    "SMTP_HOST=$($cfg.SMTP_HOST)",
    "SMTP_PORT=$($cfg.SMTP_PORT)",
    "SMTP_USER=$($cfg.SMTP_USER)",
    "SMTP_PASS=$($cfg.SMTP_PASS)",
    "MAIL_FROM=$($cfg.MAIL_FROM)"
  ) -join "`n"
  $envPath = Join-Path $cfg.DeployDir '.env'
  $envContent | Out-File -Encoding UTF8 $envPath

  # docker-compose.yml
  $compose = @'
version: "3.9"
services:
  app:
    build: ./docker
    env_file: .env
    volumes:
      - uploads:/app/uploads
    depends_on:
      - db
    networks: [net]
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: botc
      POSTGRES_USER: {DB_USER}
      POSTGRES_PASSWORD: {DB_PASS}
    volumes:
      - db_data:/var/lib/postgresql/data
    networks: [net]
  proxy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - app
    networks: [net]
volumes:
  db_data:
  uploads:
  caddy_data:
  caddy_config:
networks:
  net:
'@
  $compose = $compose -replace '\{DB_USER\}',$cfg.DbUser -replace '\{DB_PASS\}',$cfg.DbPass
  $composePath = Join-Path $cfg.DeployDir 'docker-compose.yml'
  $compose | Out-File -Encoding UTF8 $composePath

  # Caddyfile
  $caddy = @'
{DOMAIN} {
  encode zstd gzip
  reverse_proxy app:3000
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  }
}
'@
  $caddy = $caddy -replace '\{DOMAIN\}',$cfg.Domain
  $caddyPath = Join-Path $cfg.DeployDir 'Caddyfile'
  $caddy | Out-File -Encoding UTF8 $caddyPath

  OK "generated:`n - $envPath`n - $composePath`n - $caddyPath"
}

function Step-CloneOrUpdate($cfg){
  T 'CLONE/PULL'
  Ensure-Tools
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

function Step-Up($cfg){ T 'UP'; Push-Location $cfg.DeployDir; docker compose up -d --build; Pop-Location; OK 'up' }
function Step-Down($cfg){ T 'DOWN'; Push-Location $cfg.DeployDir; docker compose down; Pop-Location; OK 'down' }
function Step-Restart($cfg){ T 'RESTART/UPGRADE'; Push-Location $cfg.DeployDir; docker compose pull; docker compose up -d --build; Pop-Location; OK 'restarted' }
function Step-Logs($cfg){ T 'LOGS (Ctrl+C to exit)'; Push-Location $cfg.DeployDir; docker compose logs -f --tail=200; Pop-Location }

function Step-Backup($cfg){
  T 'BACKUP'
  $ts = Get-Date -Format 'yyyyMMdd-HHmmss'
  $backupDir = Join-Path $cfg.DeployDir 'backups'
  if(!(Test-Path $backupDir)){ New-Item -ItemType Directory -Force -Path $backupDir | Out-Null }
  $uploads = Join-Path $cfg.DeployDir 'uploads'
  $target = Join-Path $backupDir "backup-$ts.zip"
  $paths = @()
  if(Test-Path $uploads){ $paths += $uploads }
  # Postgres：使用容器导出（简化为卷备份，由于不同环境可能无法直接 pg_dump）
  if($paths.Count -gt 0){ Compress-Archive -Path $paths -DestinationPath $target -Force }
  OK "backup saved: $target"
}

function Menu(){
  $cfg = LoadCfg
  while($true){
    T 'INSTALL/UPGRADE PANEL (Windows)'
    $summary = 'repo: {0} | branch: {1} | dir: {2} | domain: {3}' -f $cfg.RepoUrl, $cfg.Branch, $cfg.DeployDir, $cfg.Domain
    Write-Host $summary -ForegroundColor Gray
    Write-Host '1) config'
    Write-Host '2) generate files (.env / docker-compose.yml / Caddyfile)'
    Write-Host '3) clone/pull repo'
    Write-Host '4) up (docker compose up -d --build)'
    Write-Host '5) down (docker compose down)'
    Write-Host '6) upgrade (pull + up -d --build)'
    Write-Host '7) logs'
    Write-Host '8) backup uploads/'
    Write-Host '9) exit'
    $sel = Read-Host 'select'
    switch($sel){
      '1' { Step-Config ([ref]$cfg); continue }
      '2' { Step-PrepareFiles $cfg; continue }
      '3' { Step-CloneOrUpdate $cfg; continue }
      '4' { Step-Up $cfg; continue }
      '5' { Step-Down $cfg; continue }
      '6' { Step-Restart $cfg; continue }
      '7' { Step-Logs $cfg; continue }
      '8' { Step-Backup $cfg; continue }
      '9' { break }
      default { Info '无效选择'; Start-Sleep -Seconds 1 }
    }
  }
}

Menu


