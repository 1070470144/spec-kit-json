# Check if server code is correctly updated
# Run this on the cloud server

Write-Host "=== Checking Server Code Updates ===" -ForegroundColor Yellow

cd C:\apps\juben

# Check login API
Write-Host "`n1. Checking login API:" -ForegroundColor Cyan
$loginCode = Get-Content "app\api\admin\auth\login\route.ts" -Raw
if($loginCode -match "signAdminSession"){
    Write-Host "   ✓ Login API updated correctly (using signAdminSession)" -ForegroundColor Green
} else {
    Write-Host "   ✗ Login API NOT updated (still using old session)" -ForegroundColor Red
    Write-Host "   Fix: Upload the correct login/route.ts file" -ForegroundColor Yellow
}

# Check logout API
Write-Host "`n2. Checking logout API:" -ForegroundColor Cyan
$logoutCode = Get-Content "app\api\admin\auth\logout\route.ts" -Raw
if($logoutCode -match "clearAdminSessionCookie"){
    Write-Host "   ✓ Logout API updated correctly (using clearAdminSessionCookie)" -ForegroundColor Green
} else {
    Write-Host "   ✗ Logout API NOT updated (still using old session)" -ForegroundColor Red
    Write-Host "   Fix: Upload the correct logout/route.ts file" -ForegroundColor Yellow
}

# Check build time
Write-Host "`n3. Checking build time:" -ForegroundColor Cyan
if(Test-Path ".next"){
    $buildTime = (Get-Item ".next").LastWriteTime
    Write-Host "   Last build: $buildTime" -ForegroundColor Green
    $now = Get-Date
    $diff = ($now - $buildTime).TotalMinutes
    if($diff -gt 10){
        Write-Host "   ! Build is old (>10 min), need to rebuild" -ForegroundColor Yellow
    } else {
        Write-Host "   ✓ Build is recent" -ForegroundColor Green
    }
} else {
    Write-Host "   ✗ .next directory not found - MUST BUILD!" -ForegroundColor Red
}

# Check PM2 status
Write-Host "`n4. Checking PM2 status:" -ForegroundColor Cyan
$pm2Status = npx pm2 jlist 2>$null | ConvertFrom-Json
$juben = $pm2Status | Where-Object { $_.name -eq 'juben' } | Select-Object -First 1
if($juben){
    Write-Host "   Status: $($juben.pm2_env.status)" -ForegroundColor Green
    Write-Host "   Uptime: $([math]::Round($juben.pm2_env.pm_uptime / 60000, 1)) minutes" -ForegroundColor Green
} else {
    Write-Host "   ✗ PM2 service not found" -ForegroundColor Red
}

Write-Host "`n=== Action Required ===" -ForegroundColor Yellow
Write-Host "If any checks failed:" -ForegroundColor White
Write-Host "  1. Upload correct files" -ForegroundColor Gray
Write-Host "  2. Run: npm run build" -ForegroundColor Gray
Write-Host "  3. Run: npx pm2 restart juben" -ForegroundColor Gray
Write-Host "  4. Clear browser cache and re-login" -ForegroundColor Gray

