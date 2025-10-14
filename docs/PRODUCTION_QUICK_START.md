# Production Environment - Quick Start Guide

## 🎯 Solve Backup Memory Issue

This guide helps you migrate database to external storage in production environment to solve backup memory issue.

## 📋 Quick Steps

### Step 1: Upload Updated Script
```powershell
# Upload scripts/pm2-installer.ps1 to server as C:\pm2-installer.ps1
```

### Step 2: Check Current Status
```powershell
# On server
powershell -ExecutionPolicy Bypass -File C:\pm2-installer.ps1

# Select: 14) check database status
```

### Step 3: Execute Migration
```powershell
# Select: 13) migrate database to external storage
# Input: y (confirm)
# Wait for completion (~1-2 minutes)
```

### Step 4: Verify Result
```powershell
# Select: 14) check database status
# Should show: "DB: External"

# Test website functions
```

---

## 📁 After Migration

### Directory Structure
```
C:\apps\juben\          # Code directory (will be updated by git pull)
├── .env                # Points to external database
└── ...

C:\apps\juben-data\     # Data directory (never changes)
├── database\juben.db   # Migrated database
├── uploads\            # Migrated upload files
└── backups\            # Data backups
```

### Environment Variables
```env
# Automatically updated to:
DATABASE_URL="file:C:/apps/juben-data/database/juben.db"
UPLOADS_PATH="C:/apps/juben-data/uploads"
```

---

## ✅ Success Indicators

1. Menu shows: `DB: External`
2. Backup message: "External storage mode: No need to backup data during code updates"
3. Code update time: from minutes to ~30 seconds
4. No more memory errors during backup
5. All website functions work normally

---

## 📊 Benefits

| Item | Before | After |
|------|--------|-------|
| **Backup size** | GB | MB |
| **Update time** | 2-5 min | 30 sec |
| **Memory usage** | High | Low |
| **Data safety** | Medium | High |

---

## 🚨 Emergency Rollback

If migration fails:
```powershell
# 1. Stop service
npx pm2 stop juben

# 2. Restore original database
cd C:\apps\juben
copy backups\*backup*.db prisma\dev.db
xcopy backups\*backup*\uploads uploads /E /I

# 3. Update .env manually
# DATABASE_URL="file:./prisma/dev.db"

# 4. Restart service
npx pm2 restart juben
```

---

## 💡 Key Points

1. **Database location**: Automatically detected
2. **Code updates**: No need to backup database anymore
3. **Backup strategy**: Intelligent backup based on storage mode
4. **Environment config**: Automatically generated

---

**After migration, your production environment will solve backup memory issue permanently!** 🚀

