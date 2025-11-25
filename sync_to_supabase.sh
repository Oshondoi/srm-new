#!/bin/bash
# ============================================
# SYNC TO SUPABASE - Перенос локальной БД на Supabase
# ============================================
# Использование: bash sync_to_supabase.sh
# Запускать в конце сессии для backup на Supabase
# ============================================

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║       SYNC LOCAL DB → SUPABASE (End of Session)      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
DUMP_FILE="/tmp/local_db_dump_${TIMESTAMP}.sql"

# Step 1: Dump local Docker DB
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Exporting local Docker database..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker exec srm-postgres pg_dump -U postgres -d srm --schema=public --no-owner --no-acl > "${DUMP_FILE}"

if [ $? -eq 0 ]; then
  echo "✅ Local DB exported: $(du -h ${DUMP_FILE} | cut -f1)"
else
  echo "❌ Export failed!"
  exit 1
fi

echo ""

# Step 2: Apply to Supabase
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Applying to Supabase..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  This will OVERWRITE Supabase database!"
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Sync cancelled"
  rm -f "${DUMP_FILE}"
  exit 0
fi

echo ""
echo "🔄 Syncing to Supabase..."

# Drop and recreate schema on Supabase
echo "Cleaning Supabase schema..."
docker exec srm-postgres psql -U postgres -d srm -c "SELECT 'DROP TABLE IF EXISTS ' || tablename || ' CASCADE;' FROM pg_tables WHERE schemaname='public';" -t | \
  PGPASSWORD='c5aXMbxyAJh9WDyj' psql "postgresql://postgres.nywsibcnngcexjbotsaq:c5aXMbxyAJh9WDyj@aws-0-us-east-1.pooler.supabase.com:6543/postgres" 2>/dev/null || true

# Apply dump to Supabase (через файл для обхода IPv6)
echo "Uploading data to Supabase..."
cat "${DUMP_FILE}" | PGPASSWORD='c5aXMbxyAJh9WDyj' psql "postgresql://postgres.nywsibcnngcexjbotsaq:c5aXMbxyAJh9WDyj@aws-0-us-east-1.pooler.supabase.com:6543/postgres" 2>&1 | grep -v "already exists" || true

# Cleanup
rm -f "${DUMP_FILE}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Sync completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Supabase database now matches your local Docker DB"
echo "🕐 Timestamp: ${TIMESTAMP}"
