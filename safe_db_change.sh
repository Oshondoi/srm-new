#!/bin/bash
# ============================================
# SAFE DB CHANGE - Автоматический backup + изменение + возможность отката
# ============================================
# Использование: bash safe_db_change.sh <sql_file>
# Пример: bash safe_db_change.sh add_priority_column.sql
# ============================================

set -e  # Exit on error

SQL_FILE="$1"

if [ -z "$SQL_FILE" ] || [ ! -f "$SQL_FILE" ]; then
  echo "❌ SQL file not found or not specified"
  echo "Usage: bash safe_db_change.sh <sql_file>"
  exit 1
fi

echo "╔════════════════════════════════════════════════════════╗"
echo "║  SAFE DATABASE CHANGE - WITH AUTO BACKUP & ROLLBACK  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📄 SQL file: ${SQL_FILE}"
echo ""

# Step 1: Create backup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Creating backup before changes..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
bash backup_before_migration.sh

if [ $? -ne 0 ]; then
  echo "❌ Backup failed! Aborting."
  exit 1
fi

BACKUP_FILE=$(cat backups/.last_backup)
echo ""

# Step 2: Apply SQL changes
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Applying SQL changes..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PGPASSWORD='c5aXMbxyAJh9WDyj' psql \
  -h db.nywsibcnngcexjbotsaq.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f "${SQL_FILE}"

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ SQL execution failed!"
  echo ""
  echo "Do you want to restore from backup? (yes/no): "
  read RESTORE_CONFIRM
  
  if [ "$RESTORE_CONFIRM" = "yes" ]; then
    bash restore_from_backup.sh "${BACKUP_FILE}"
  fi
  
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Changes applied successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💾 Backup saved: ${BACKUP_FILE}"
echo ""
echo "If you want to rollback, run:"
echo "  bash restore_from_backup.sh"
echo ""
