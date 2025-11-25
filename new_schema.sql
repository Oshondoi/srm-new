-- ============================================
-- NEW SCHEMA: Account-based hierarchy
-- ============================================
-- Применить к локальной БД: docker exec -i srm-postgres psql -U postgres -d srm < new_schema.sql
-- ============================================

-- Drop existing tables
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
DROP FUNCTION IF EXISTS create_default_pipeline_for_user CASCADE;

-- ============================================
-- LEVEL 0: АККАУНТ (высшая форма)
-- ============================================

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(64) UNIQUE, -- для multi-tenancy
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- LEVEL 1: Сотрудники (Users)
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  email VARCHAR(320) NOT NULL,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  role VARCHAR(32) NOT NULL DEFAULT 'manager', -- admin, manager, employee
  permissions JSONB DEFAULT '{}', -- гибкие права доступа
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(account_id, email) -- email уникален внутри аккаунта
);

-- ============================================
-- LEVEL 2: Компании
-- ============================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  website VARCHAR(512),
  phone VARCHAR(64),
  email VARCHAR(320),
  address TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- LEVEL 3: Контакты
-- ============================================

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  first_name VARCHAR(120),
  last_name VARCHAR(120),
  position VARCHAR(120),
  phone VARCHAR(64),
  email VARCHAR(320),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- LEVEL 4: Воронки
-- ============================================

CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- LEVEL 5: Этапы воронки
-- ============================================

CREATE TABLE stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  color VARCHAR(7), -- hex color for UI
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- LEVEL 6: Сделки
-- ============================================

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES pipelines(id),
  stage_id UUID REFERENCES stages(id),
  
  -- Общая информация (1.2.1)
  title VARCHAR(512) NOT NULL,
  budget NUMERIC(15, 2) DEFAULT 0,
  currency VARCHAR(8) DEFAULT 'RUB',
  
  -- Компания (1.2.3)
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  
  -- Ответственный
  responsible_user_id UUID REFERENCES users(id),
  
  -- Dates
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  closed_at TIMESTAMP,
  
  -- Status
  is_closed BOOLEAN DEFAULT false
);

-- ============================================
-- LEVEL 7: Контакты сделки (Many-to-Many)
-- ============================================

CREATE TABLE deal_contacts (
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false, -- главный контакт
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (deal_id, contact_id)
);

-- ============================================
-- LEVEL 8: Задачи
-- ============================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- LEVEL 9: Заметки
-- ============================================

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- LEVEL 10: История активности
-- ============================================

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR(64) NOT NULL, -- deal, contact, company, task
  entity_id UUID,
  action VARCHAR(64) NOT NULL, -- created, updated, deleted, stage_changed
  changes JSONB, -- что изменилось
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- INDEXES для производительности
-- ============================================

CREATE INDEX idx_users_account_id ON users(account_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_companies_account_id ON companies(account_id);
CREATE INDEX idx_contacts_account_id ON contacts(account_id);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_pipelines_account_id ON pipelines(account_id);
CREATE INDEX idx_stages_pipeline_id ON stages(pipeline_id);
CREATE INDEX idx_deals_account_id ON deals(account_id);
CREATE INDEX idx_deals_stage_id ON deals(stage_id);
CREATE INDEX idx_deals_company_id ON deals(company_id);
CREATE INDEX idx_tasks_account_id ON tasks(account_id);
CREATE INDEX idx_tasks_deal_id ON tasks(deal_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_activity_logs_account_id ON activity_logs(account_id);

-- ============================================
-- TRIGGER: Auto-create default pipeline for new account
-- ============================================

CREATE OR REPLACE FUNCTION create_default_pipeline_for_account()
RETURNS TRIGGER AS $$
DECLARE
  pipeline_id UUID;
BEGIN
  -- Create default pipeline
  INSERT INTO pipelines (account_id, name, is_default)
  VALUES (NEW.id, 'Основная воронка', true)
  RETURNING id INTO pipeline_id;
  
  -- Create default stages
  INSERT INTO stages (pipeline_id, name, position, color)
  VALUES 
    (pipeline_id, 'Первичный контакт', 1, '#3b82f6'),
    (pipeline_id, 'Переговоры', 2, '#8b5cf6'),
    (pipeline_id, 'Принимают решение', 3, '#f59e0b'),
    (pipeline_id, 'Согласование договора', 4, '#10b981'),
    (pipeline_id, 'Успешно реализовано', 5, '#22c55e');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_pipeline
  AFTER INSERT ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION create_default_pipeline_for_account();

-- ============================================
-- SEED: Тестовый аккаунт
-- ============================================

-- Создать тестовый аккаунт
INSERT INTO accounts (name, subdomain) 
VALUES ('Тестовая компания', 'test')
RETURNING id;

-- Вывести созданные таблицы
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as columns
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
