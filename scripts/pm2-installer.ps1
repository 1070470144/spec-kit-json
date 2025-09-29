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

function LoadCfg(){ if(Test-Path $CfgPath){ return Get-Content $CfgPath -Raw | ConvertFrom-Json } else { return [pscustomobject]@{ RepoUrl='https://github.com/1070470144/spec-kit-json'; Branch='master'; DeployDir='C:\apps\juben'; APP_BASE_URL='https://localhost'; APP_PORT='10080'; NEXTAUTH_SECRET=''; SMTP_HOST='smtp.qq.com'; SMTP_PORT='465'; SMTP_USER='1070470144@qq.com'; SMTP_PASS='ttcrvmnndyiqbdig'; MAIL_FROM='1070470144@qq.com'; } } }
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
    'DATABASE_URL="file:./prisma/dev.db"',
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
    $toBackup = @('.env','uploads','prisma\prisma\dev.db')
    foreach($p in $toBackup){ if(Test-Path $p){ Move-Item -Force -Path $p -Destination (Join-Path $bk ([IO.Path]::GetFileName($p))) } }

    git fetch --all --prune
    git checkout $cfg.Branch
    # drop local changes (but we've backed up important files)
    git reset --hard HEAD
    git clean -fd
    git pull --rebase

    # restore backups
    foreach($p in $toBackup){ $src = Join-Path $bk ([IO.Path]::GetFileName($p)); if(Test-Path $src){ Move-Item -Force -Path $src -Destination $p } }
    Remove-Item $bk -Force -Recurse -ErrorAction SilentlyContinue
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

# Write Caddyfile and start caddy if exists
function Step-SetupCaddy($cfg){
  T 'SETUP CADDY (reverse proxy)'
  $caddyDir = 'C:\caddy'
  if(!(Test-Path $caddyDir)){ New-Item -ItemType Directory -Force -Path $caddyDir | Out-Null }
  $caddyfile = @'
{DOMAIN} {
  encode zstd gzip
  reverse_proxy 127.0.0.1:{PORT}
}
'@
  $domain = $cfg.APP_BASE_URL -replace '^https?://', ''
  $domain = $domain -replace '/.*$', ''
  $caddyfile = $caddyfile -replace '\{DOMAIN\}', $domain
  $caddyfile = $caddyfile -replace '\{PORT\}', $cfg.APP_PORT
  $caddyPath = Join-Path $caddyDir 'Caddyfile'
  $caddyfile | Out-File -Encoding ASCII $caddyPath
  $exe = Join-Path $caddyDir 'caddy.exe'
  if(Test-Path $exe){
    Push-Location $caddyDir
    & $exe stop *> $null
    & $exe start --config $caddyPath
    Pop-Location
    OK 'caddy started (port 80/443)'
  } else {
    Info "caddy.exe not found at $caddyDir. Download from https://caddyserver.com/ and place caddy.exe in $caddyDir, then rerun this step."
  }
}

function Step-StopCaddy(){
  $exe = 'C:\caddy\caddy.exe'
  if(Test-Path $exe){ & $exe stop; OK 'caddy stopped' } else { Info 'caddy.exe not found' }
}

function Step-OpenFirewall(){
  T 'OPEN WINDOWS FIREWALL PORTS 80/443'
  try {
    netsh advfirewall firewall add rule name="Juben HTTP 80" dir=in action=allow protocol=TCP localport=80 | Out-Null
  } catch {}
  try {
    netsh advfirewall firewall add rule name="Juben HTTPS 443" dir=in action=allow protocol=TCP localport=443 | Out-Null
  } catch {}
  OK 'Windows firewall open for 80/443 (ensure cloud security group also allows)'
}

function Step-DownloadCaddy(){
  T 'DOWNLOAD CADDY (Windows amd64)'
  $caddyDir = 'C:\caddy'
  if(!(Test-Path $caddyDir)){ New-Item -ItemType Directory -Force -Path $caddyDir | Out-Null }
  $zip = Join-Path $env:TEMP 'caddy_windows_amd64.zip'
  $url = 'https://github.com/caddyserver/caddy/releases/latest/download/caddy_windows_amd64.zip'
  try {
    Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
  } catch {
    Err "download failed: $url"; throw
  }
  $tmp = Join-Path $env:TEMP ('caddy_' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Force -Path $tmp | Out-Null
  Expand-Archive -Path $zip -DestinationPath $tmp -Force
  $exe = Get-ChildItem -Path $tmp -Recurse -Filter 'caddy.exe' | Select-Object -First 1
  if(-not $exe){ Err 'caddy.exe not found in zip'; throw 'unzip failed' }
  Copy-Item -Force $exe.FullName (Join-Path $caddyDir 'caddy.exe')
  Remove-Item -Force $zip -ErrorAction SilentlyContinue
  Remove-Item -Force -Recurse $tmp -ErrorAction SilentlyContinue
  OK 'caddy.exe downloaded to C:\caddy\caddy.exe'
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
    Write-Host '10) setup caddy (reverse proxy)'
    Write-Host '11) stop caddy'
    Write-Host '12) open Windows firewall ports 80/443'
    Write-Host '13) download caddy (win64)'
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
      '10' { Step-SetupCaddy $cfg; continue }
      '11' { Step-StopCaddy; continue }
      '12' { Step-OpenFirewall; continue }
      '13' { Step-DownloadCaddy; continue }
      '0' { break }
      default { Info 'invalid option'; Start-Sleep -Seconds 1 }
    }
  }
}

Menu


