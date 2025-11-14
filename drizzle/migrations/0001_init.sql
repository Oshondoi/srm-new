-- Initial schema for srm-new (based on drizzle/schema.ts)
-- Run with your Postgres client or drizzle-kit when DATABASE_URL is configured.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL,
  full_name varchar(255),
  role varchar(32) NOT NULL DEFAULT 'manager',
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  website varchar(512),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  first_name varchar(120),
  last_name varchar(120),
  phone varchar(64),
  email varchar(320),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES pipelines(id),
  name varchar(255) NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

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
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals(id),
  assigned_to uuid REFERENCES users(id),
  title varchar(255) NOT NULL,
  description text,
  due_at timestamp with time zone,
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  deal_id uuid REFERENCES deals(id),
  contact_id uuid REFERENCES contacts(id),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  entity varchar(64) NOT NULL,
  entity_id uuid,
  action varchar(64) NOT NULL,
  payload text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
