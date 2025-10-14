# Fix Admin Session Authentication
# Run this script on the cloud server: C:\apps\juben\fix-admin-session.ps1

Write-Host "=== Fixing Admin Session Authentication ===" -ForegroundColor Yellow

cd C:\apps\juben

# Backup original files
Write-Host "`nBacking up original files..." -ForegroundColor Cyan
copy "app\api\admin\auth\login\route.ts" "app\api\admin\auth\login\route.ts.backup" -ErrorAction SilentlyContinue
copy "app\api\admin\auth\logout\route.ts" "app\api\admin\auth\logout\route.ts.backup" -ErrorAction SilentlyContinue

# Fix login/route.ts
Write-Host "Fixing login/route.ts..." -ForegroundColor Cyan
$loginContent = @'
import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { verifyPassword } from '@/src/auth/password'
import { parseJson } from '@/src/api/validate'
import { unauthorized, ok, forbidden } from '@/src/api/http'
import { signAdminSession, setAdminSessionCookie } from '@/src/auth/adminSession'

const schema = z.object({ email: z.string().email(), password: z.string().min(6) })

export async function POST(req: Request) {
  const parsed = await parseJson(req, schema)
  if (!parsed.ok) return parsed.res
  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, passwordHash: true, roles: { select: { key: true } } } })
  if (!user || !verifyPassword(password, user.passwordHash)) return unauthorized('INVALID_CREDENTIALS')
  const roleKeys = (user.roles||[]).map(r=>r.key)
  const isAdmin = roleKeys.includes('admin') || roleKeys.includes('superuser')
  if (!isAdmin) return forbidden('NOT_ADMIN')
  
  // 使用管理员专用会话系统
  const token = signAdminSession({ userId: user.id, email: user.email, role: 'admin' })
  await setAdminSessionCookie(token)
  
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
    const ua = req.headers.get('user-agent') || ''
    await prisma.auditLog.create({ data: { actorId: user.id, action: 'admin_login', objectType: 'user', objectId: user.id, result: 'ok', ip, userAgent: ua } })
  } catch {}
  
  return ok({ id: user.id, email: user.email, role: 'admin' })
}
'@
$loginContent | Out-File "app\api\admin\auth\login\route.ts" -Encoding UTF8

# Fix logout/route.ts
Write-Host "Fixing logout/route.ts..." -ForegroundColor Cyan
$logoutContent = @'
import { NextResponse } from 'next/server'
import { clearAdminSessionCookie } from '@/src/auth/adminSession'

export async function POST() {
  // 清除管理员专用会话cookie
  await clearAdminSessionCookie()
  
  return NextResponse.json({ ok: true })
}
'@
$logoutContent | Out-File "app\api\admin\auth\logout\route.ts" -Encoding UTF8

Write-Host "`n=== Files Updated ===" -ForegroundColor Green
Write-Host "  ✓ app\api\admin\auth\login\route.ts" -ForegroundColor Green
Write-Host "  ✓ app\api\admin\auth\logout\route.ts" -ForegroundColor Green

# Verify changes
Write-Host "`nVerifying changes..." -ForegroundColor Cyan
$loginCheck = Get-Content "app\api\admin\auth\login\route.ts" -Raw
if($loginCheck -match "signAdminSession"){
    Write-Host "  ✓ Login API updated correctly" -ForegroundColor Green
} else {
    Write-Host "  ✗ Login API update failed" -ForegroundColor Red
}

# Rebuild
Write-Host "`n=== Next Steps ===" -ForegroundColor Yellow
Write-Host "1. Run: npx pm2 stop juben" -ForegroundColor White
Write-Host "2. Run: npm run build" -ForegroundColor White
Write-Host "3. Run: npx pm2 start juben" -ForegroundColor White
Write-Host "4. Clear browser cache and re-login to admin panel" -ForegroundColor White
Write-Host "`nExecute these commands now? (Run them manually)" -ForegroundColor Yellow
