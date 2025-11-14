import { pgTable, varchar, text, serial, timestamp, uuid, integer, boolean } from 'drizzle-orm/pg-core'

// Пользователи
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 320 }).notNull(),
  full_name: varchar('full_name', { length: 255 }),
  role: varchar('role', { length: 32 }).notNull().default('manager'),
  created_at: timestamp('created_at').defaultNow().notNull()
})

// Компании
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  website: varchar('website', { length: 512 }),
  phone: varchar('phone', { length: 64 }),
  created_at: timestamp('created_at').defaultNow().notNull()
})

// Контакты
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id'),
  first_name: varchar('first_name', { length: 120 }),
  last_name: varchar('last_name', { length: 120 }),
  phone: varchar('phone', { length: 64 }),
  email: varchar('email', { length: 320 }),
  created_at: timestamp('created_at').defaultNow().notNull()
})

// Воронки
export const pipelines = pgTable('pipelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
})

// Стадии воронки
export const stages = pgTable('stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipeline_id: uuid('pipeline_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  position: integer('position').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull()
})

// Сделки
export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 512 }).notNull(),
  company_id: uuid('company_id'),
  contact_id: uuid('contact_id'),
  pipeline_id: uuid('pipeline_id'),
  stage_id: uuid('stage_id'),
  value: integer('value').default(0),
  currency: varchar('currency', { length: 8 }).default('USD'),
  closed: boolean('closed').default(false),
  created_at: timestamp('created_at').defaultNow().notNull()
})

// Задачи
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  deal_id: uuid('deal_id'),
  assigned_to: uuid('assigned_to'),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  due_at: timestamp('due_at'),
  completed: boolean('completed').default(false),
  created_at: timestamp('created_at').defaultNow().notNull()
})

// Заметки / активности
export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id'),
  deal_id: uuid('deal_id'),
  contact_id: uuid('contact_id'),
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
})

// Audit log
export const activity_logs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id'),
  entity: varchar('entity', { length: 64 }).notNull(),
  entity_id: uuid('entity_id'),
  action: varchar('action', { length: 64 }).notNull(),
  payload: text('payload'),
  created_at: timestamp('created_at').defaultNow().notNull()
})
