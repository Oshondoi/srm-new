-- ============================================
-- SUPABASE MIGRATION - FULL SCHEMA SETUP
-- ============================================
-- Применить через: Supabase Dashboard → SQL Editor → New Query → Run
-- Проект: nywsibcnngcexjbotsaq
-- Дата: November 16, 2025
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table (authentication)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL,
  full_name varchar(255),
  role varchar(32) NOT NULL DEFAULT 'manager',
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  website varchar(512),
  phone varchar(64),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  first_name varchar(120),
  last_name varchar(120),
  phone varchar(64),
  email varchar(320),
  position varchar(120),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Pipelines table (sales funnels)
CREATE TABLE IF NOT EXISTS pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Stages table (pipeline steps)
CREATE TABLE IF NOT EXISTS stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES pipelines(id),
  name varchar(255) NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(512) NOT NULL,
  company_id uuid REFERENCES companies(id),
  contact_id uuid REFERENCES contacts(id),
  pipeline_id uuid REFERENCES pipelines(id),
  stage_id uuid REFERENCES stages(id),
  value integer DEFAULT 0,
  currency varchar(8) DEFAULT 'USD',
  closed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals(id),
  assigned_to uuid REFERENCES users(id),
  title varchar(255) NOT NULL,
  description text,
  due_at timestamp with time zone,
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  deal_id uuid REFERENCES deals(id),
  contact_id uuid REFERENCES contacts(id),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  entity varchar(64) NOT NULL,
  entity_id uuid,
  action varchar(64) NOT NULL,
  payload text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================
-- MANY-TO-MANY RELATIONSHIPS
-- ============================================

-- Deal-Contacts junction table
CREATE TABLE IF NOT EXISTS deal_contacts (
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (deal_id, contact_id)
);

-- Migrate existing contact_id from deals to deal_contacts
INSERT INTO deal_contacts (deal_id, contact_id)
SELECT id, contact_id 
FROM deals 
WHERE contact_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================
-- AUTHENTICATION & USER ISOLATION
-- ============================================

-- Add password hash column
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Make email unique
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
  END IF;
END $$;

-- Add user_id to pipelines (each pipeline belongs to a user)
ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Add user_id to other entities for data isolation
ALTER TABLE companies ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- ============================================
-- AUTO-CREATE PIPELINE ON USER REGISTRATION
-- ============================================

-- Function to create default pipeline for new users
CREATE OR REPLACE FUNCTION create_default_pipeline_for_user()
RETURNS TRIGGER AS $$
DECLARE
  pipeline_id UUID;
BEGIN
  -- Create default pipeline
  INSERT INTO pipelines (name, user_id)
  VALUES ('Основная воронка', NEW.id)
  RETURNING id INTO pipeline_id;
  
  -- Create default stages for the pipeline
  INSERT INTO stages (pipeline_id, name, position)
  VALUES 
    (pipeline_id, 'Первичный контакт', 1),
    (pipeline_id, 'Переговоры', 2),
    (pipeline_id, 'Принимают решение', 3),
    (pipeline_id, 'Согласование договора', 4),
    (pipeline_id, 'Успешно реализовано', 5);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create pipeline on user registration
DROP TRIGGER IF EXISTS trigger_create_default_pipeline ON users;
CREATE TRIGGER trigger_create_default_pipeline
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_pipeline_for_user();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pipelines_user_id ON pipelines(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);

-- ============================================
-- VERIFICATION
-- ============================================

-- Show created tables
SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
