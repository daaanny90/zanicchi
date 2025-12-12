# Database Backup & Safe Update Guide

This guide explains how to safely manage your database and update your application without losing data.

## 🔴 The Problem (Before)

Previously, when updating the application:
```bash
git pull
docker compose down
docker compose up -d
```

This would **wipe your database** because:
- The volume mapping was incorrect for linuxserver/mariadb
- No backup system was in place
- No safe update procedure existed

## ✅ The Solution (Now)

We've implemented a complete backup and safe update system that preserves your data.

---

## 📦 Backup System

### Create a Backup

```bash
./backup-db.sh
```

**What it does:**
- Creates a timestamped SQL dump of your entire database
- Compresses it with gzip (saves 80-90% space)
- Stores it in `./backups/` directory
- Automatically keeps only the last 10 backups
- Shows you the file size and location

**Output example:**
```
============================================================================
  ✓ Backup completed successfully!
============================================================================

Backup details:
  File: ./backups/freelancer_finance_backup_20241127_143022.sql.gz
  Size: 24K
  Date: 2024-11-27 14:30:22
```

### Automatic Backups

For automated backups (e.g., cron jobs):
```bash
./backup-db.sh --auto
```

This runs quietly and outputs a single line for logging.

### Set Up Automatic Daily Backups

Add to your crontab:
```bash
crontab -e
```

Add this line (runs every day at 2 AM):
```
0 2 * * * cd /path/to/zanicchi && ./backup-db.sh --auto >> /var/log/zanicchi-backup.log 2>&1
```

---

## 🔄 Restore from Backup

```bash
./restore-db.sh ./backups/freelancer_finance_backup_20241127_143022.sql.gz
```

**What it does:**
- Shows you which backup you're restoring
- **Creates a safety backup** of your current database first
- Asks for confirmation (because this replaces your current data)
- Restores the selected backup
- Tells you how to undo if needed

**Safety feature:** Before restoring, it creates a backup of your current database, so you can always go back if something goes wrong.

---

## 🚀 Safe Update (Recommended Method)

This is the **recommended way** to update your application on the Raspberry Pi.

```bash
./safe-update.sh
```

Or update from a specific branch:
```bash
./safe-update.sh armv7
```

**What it does automatically:**

1. **📦 Backs up your database** (automatic safety backup)
2. **⬇️ Pulls latest code** from git
3. **🔄 Rebuilds containers** WITHOUT removing volumes (your data stays!)
4. **⏳ Waits for database** to be ready
5. **📊 Applies migrations** to update database schema
6. **✅ Verifies** everything is working

**Your data is safe because:**
- Database volume persists across container rebuilds
- Automatic backup is created before any changes
- Migrations are designed to add/update, never delete

**Example output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1/5: Creating database backup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2024-11-27 14:30:22 - Backup created: ./backups/... (24K)
✓ Backup completed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 2/5: Pulling latest code from branch 'armv7'
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Code updated successfully

... and so on for all 5 steps
```

---

## 🛠️ Manual Update (Advanced)

If you prefer to update manually:

```bash
# 1. Create a backup first (important!)
./backup-db.sh

# 2. Pull latest code
git pull origin armv7

# 3. Rebuild containers (note: no -v flag, keeps volumes!)
docker compose down
docker compose up -d --build

# 4. Wait for database to be ready (about 30 seconds)
sleep 30

# 5. Apply migrations
./update-db.sh
```

**⚠️ Important:** Never use `docker compose down -v` as this deletes volumes and wipes your data!

---

## 🔧 What Was Fixed

### 1. Volume Mapping Fix

**Before:**
```yaml
volumes:
  - mysql-data:/var/lib/mysql  # ❌ Wrong path for linuxserver/mariadb
```

**After:**
```yaml
volumes:
  - mysql-data:/config  # ✅ Correct path for linuxserver/mariadb
```

The `linuxserver/mariadb` image uses `/config` as its data directory, not `/var/lib/mysql`. This was causing data loss on container rebuilds.

### 2. Backup Scripts

- `backup-db.sh` - Create database backups
- `restore-db.sh` - Restore from backups
- Both with safety features and user-friendly output

### 3. Safe Update Script

- `safe-update.sh` - One-command update that handles everything safely
- Automatic backup before updates
- Database migration application
- Status verification

---

## 📋 Quick Reference

| Task | Command |
|------|---------|
| Create backup | `./backup-db.sh` |
| Restore backup | `./restore-db.sh <backup_file>` |
| Safe update | `./safe-update.sh` |
| Manual migration | `./update-db.sh` |
| List backups | `ls -lh ./backups/` |
| View containers | `docker compose ps` |
| View logs | `docker compose logs -f` |
| Stop (keep data) | `docker compose down` |
| Stop (DELETE data) | `docker compose down -v` ⚠️ |

---

## ⚠️ Important Notes

### DO:
- ✅ Use `./safe-update.sh` to update
- ✅ Create regular backups with `./backup-db.sh`
- ✅ Use `docker compose down` (without `-v`) to stop containers
- ✅ Keep your backups in a safe place (consider copying to another device)

### DON'T:
- ❌ Use `docker compose down -v` (deletes your data!)
- ❌ Delete the `mysql-data` volume manually
- ❌ Skip backups before major updates
- ❌ Edit database directly without backing up first

---

## 🆘 Troubleshooting

### "Database container is not running"
```bash
docker compose up -d
# Wait 30 seconds for database to initialize
```

### "I accidentally deleted my data!"
If you have a recent backup:
```bash
./restore-db.sh ./backups/freelancer_finance_backup_<timestamp>.sql.gz
```

### "Update failed, how do I go back?"
The safe-update script creates a backup before updating. Find it in `./backups/` and restore:
```bash
ls -lt ./backups/ | head
./restore-db.sh ./backups/freelancer_finance_backup_<timestamp>.sql.gz
```

### "I want to start fresh"
To completely reset (⚠️ this deletes all data):
```bash
docker compose down -v
docker compose up -d
```

---

## 📱 Backup Best Practices

1. **Regular backups**: Run `./backup-db.sh` at least weekly
2. **Before updates**: Always backup before pulling new code
3. **Off-site storage**: Copy important backups to another device/cloud
4. **Test restores**: Occasionally test that your backups work
5. **Automate**: Set up a cron job for automatic daily backups

---

## 🎯 Common Workflows

### Weekly Maintenance
```bash
# Create a backup
./backup-db.sh

# Check for updates
./safe-update.sh
```

### Before Major Changes
```bash
# Create a backup with a meaningful name
./backup-db.sh
mv ./backups/freelancer_finance_backup_*.sql.gz ./backups/before_migration_$(date +%Y%m%d).sql.gz

# Make your changes...
```

### Moving to a New Server
```bash
# On old server
./backup-db.sh

# Copy backup to new server
scp ./backups/freelancer_finance_backup_*.sql.gz user@newserver:/path/to/zanicchi/backups/

# On new server
./restore-db.sh ./backups/freelancer_finance_backup_<timestamp>.sql.gz
```

---

## 📞 Need Help?

If you encounter issues:
1. Check the logs: `docker compose logs -f mysql`
2. Verify volume exists: `docker volume ls | grep mysql-data`
3. Check backups: `ls -lh ./backups/`
4. Ensure scripts are executable: `chmod +x *.sh`

Your data is precious. When in doubt, **backup first, ask questions later**! 🛡️
