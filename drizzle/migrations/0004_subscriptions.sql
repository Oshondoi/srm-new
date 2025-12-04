-- Migration: Subscription System (Тарифная система)
-- Created: 2025-11-25
-- Description: Добавляет систему тарификации с возможностью контроля доступа к функциям

-- Тарифные планы для аккаунтов
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  plan_name VARCHAR(64) NOT NULL, -- 'free', 'professional', 'business'
  status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP, -- NULL = бессрочно (для free)
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_account ON subscriptions(account_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Функции/возможности системы
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL UNIQUE, -- машинное имя: 'chat_search', 'advanced_analytics'
  display_name VARCHAR(255) NOT NULL, -- для UI: 'Поиск по сообщениям'
  description TEXT, -- описание функции
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Связь тарифов и функций (матрица доступа)
CREATE TABLE IF NOT EXISTS subscription_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name VARCHAR(64) NOT NULL, -- 'free', 'professional', 'business'
  feature_name VARCHAR(128) NOT NULL REFERENCES features(name) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(plan_name, feature_name) -- один тариф не может иметь дубли функций
);

CREATE INDEX idx_subscription_features_plan ON subscription_features(plan_name);
CREATE INDEX idx_subscription_features_feature ON subscription_features(feature_name);

-- === НАЧАЛЬНЫЕ ДАННЫЕ ===

-- Добавляем функции системы
INSERT INTO features (name, display_name, description) VALUES
  ('chat_search', 'Поиск по сообщениям', 'Расширенный поиск по истории переписки в сделках'),
  ('advanced_filters', 'Расширенные фильтры', 'Дополнительные фильтры для анализа данных'),
  ('api_access', 'API доступ', 'Доступ к REST API для интеграций'),
  ('custom_fields', 'Пользовательские поля', 'Создание кастомных полей в сделках/контактах'),
  ('bulk_operations', 'Массовые операции', 'Массовое редактирование и импорт/экспорт данных'),
  ('advanced_analytics', 'Продвинутая аналитика', 'Расширенные отчеты и дашборды'),
  ('automation', 'Автоматизация', 'Триггеры и автоматические действия'),
  ('email_integration', 'Email интеграция', 'Синхронизация с почтовыми сервисами'),
  ('priority_support', 'Приоритетная поддержка', 'Ускоренная техническая поддержка'),
  ('white_label', 'White-label', 'Персонализация интерфейса под бренд компании')
ON CONFLICT (name) DO NOTHING;

-- Матрица доступа: FREE план (базовые возможности)
-- FREE не имеет премиум функций - пустая матрица

-- Матрица доступа: PROFESSIONAL план
INSERT INTO subscription_features (plan_name, feature_name) VALUES
  ('professional', 'chat_search'),
  ('professional', 'advanced_filters'),
  ('professional', 'api_access'),
  ('professional', 'custom_fields'),
  ('professional', 'advanced_analytics')
ON CONFLICT DO NOTHING;

-- Матрица доступа: BUSINESS план (всё из Professional + дополнительно)
INSERT INTO subscription_features (plan_name, feature_name) VALUES
  ('business', 'chat_search'),
  ('business', 'advanced_filters'),
  ('business', 'api_access'),
  ('business', 'custom_fields'),
  ('business', 'advanced_analytics'),
  ('business', 'bulk_operations'),
  ('business', 'automation'),
  ('business', 'email_integration'),
  ('business', 'priority_support'),
  ('business', 'white_label')
ON CONFLICT DO NOTHING;

-- Создаем FREE подписки для всех существующих аккаунтов
INSERT INTO subscriptions (account_id, plan_name, status)
SELECT id, 'free', 'active'
FROM accounts
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE subscriptions.account_id = accounts.id
);

COMMENT ON TABLE subscriptions IS 'Тарифные планы аккаунтов';
COMMENT ON TABLE features IS 'Функции системы, доступные в разных тарифах';
COMMENT ON TABLE subscription_features IS 'Матрица доступа: какие функции доступны в каких тарифах';
