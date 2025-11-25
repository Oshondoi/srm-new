-- ============================================
-- ROLLBACK SCRIPT - Удаление только того, что создала миграция
-- ============================================
-- Применить через: Supabase Dashboard → SQL Editor → New Query → Run
-- Проект: nywsibcnngcexjbotsaq
-- 
-- ⚠️ ВНИМАНИЕ: Это удалит все таблицы и данные, созданные supabase_migration.sql
-- Используй только если миграция прошла неправильно и нужен откат
-- ============================================

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS deal_contacts CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS stages CASCADE;
DROP TABLE IF EXISTS pipelines CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions and triggers
DROP FUNCTION IF EXISTS create_default_pipeline_for_user() CASCADE;

-- Drop indexes (будут удалены с таблицами, но на всякий случай)
DROP INDEX IF EXISTS idx_pipelines_user_id;
DROP INDEX IF EXISTS idx_companies_user_id;
DROP INDEX IF EXISTS idx_contacts_user_id;
DROP INDEX IF EXISTS idx_deals_user_id;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_deals_stage_id;
DROP INDEX IF EXISTS idx_contacts_company_id;

-- Verification: show remaining tables
SELECT 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
