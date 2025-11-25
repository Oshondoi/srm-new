#!/bin/bash
# ============================================
# RESTORE SCRIPT - Восстановление БД из backup
# ============================================
# Использование: bash restore_from_backup.sh <backup_file>
# Или: bash restore_from_backup.sh (восстановит последний backup)
# ============================================

set -e  # Exit on error

BACKUP_FILE="$1"
BACKUP_DIR="backups"

# If no file specified, use last backup
if [ -z "$BACKUP_FILE" ]; then
  if [ -f "${BACKUP_DIR}/.last_backup" ]; then
    BACKUP_FILE=$(cat "${BACKUP_DIR}/.last_backup")
    echo "📋 Using last backup: ${BACKUP_FILE}"
  else
    echo "❌ No backup file specified and no last backup found!"
    echo "Usage: bash restore_from_backup.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh "${BACKUP_DIR}"/*.sql 2>/dev/null || echo "  No backups found"
    exit 1
  fi
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: ${BACKUP_FILE}"
  echo ""
  echo "Available backups:"
  ls -lh "${BACKUP_DIR}"/*.sql 2>/dev/null || echo "  No backups found"
  exit 1
fi

echo "⚠️  WARNING: This will OVERWRITE current Supabase database!"
echo "📁 Backup file: ${BACKUP_FILE}"
echo "📦 Size: $(du -h ${BACKUP_FILE} | cut -f1)"
echo ""
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Restore cancelled"
  exit 0
fi

echo ""
echo "🔄 Restoring database from backup..."
echo ""

# Drop existing tables first
echo "🗑️  Dropping existing tables..."
PGPASSWORD='c5aXMbxyAJh9WDyj' psql \
  -h db.nywsibcnngcexjbotsaq.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>&1

# Restore from backup
echo "📥 Restoring data..."
PGPASSWORD='c5aXMbxyAJh9WDyj' psql \
  -h db.nywsibcnngcexjbotsaq.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  < "${BACKUP_FILE}" 2>&1

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Database restored successfully!"
  echo "🎯 Your database is now back to the state from: $(basename ${BACKUP_FILE})"
else
  echo ""
  echo "❌ Restore failed!"
  exit 1
fi
