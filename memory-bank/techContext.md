# Technical Context

## Stack Overview

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 15.3.5 | Full-stack React with App Router |
| Runtime | Node.js | 22+ | JavaScript runtime |
| Language | TypeScript | 5.8.3 | Type safety |
| Database | PostgreSQL | 15 | Primary data store (Docker) |
| ORM | Drizzle | 0.39.3 | Schema management & migrations |
| Styling | Tailwind CSS | 4.0.0 | Utility-first CSS |
| UI Library | React | 18.3.1 | Component framework |
| DnD | @dnd-kit/core | 6.3.1 | Drag and drop |
| Auth (Edge) | jose | latest | JWT for Edge Runtime (middleware) |
| Auth (Node) | jsonwebtoken | latest | JWT for API routes |
| Password Hash | bcryptjs | latest | Password hashing |

## Development Environment

### Docker Setup
```yaml
Container: srm-postgres
Image: postgres:15
Port: 5432:5432
Database: srm
User: postgres
Password: postgres
```

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/srm"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production-12345"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://nywsibcnngcexjbotsaq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55d3NpYmNubmdjZXhqYm90c2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMzIyNjgsImV4cCI6MjA3ODgwODI2OH0.CnqXhZZlBKGjZtQRXunX4Cy1VKxw8OO6h7lBkQEZyE4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55d3NpYmNubmdjZXhqYm90c2FxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIzMjI2OCwiZXhwIjoyMDc4ODA4MjY4fQ.Xy_3LpMce5d-59rdESUKLkXHjP912HhhOECFvGF0wDI
SUPABASE_URL=https://nywsibcnngcexjbotsaq.supabase.co
```

### Dev Server
```bash
Port: 3000 (or 3001)
Command: npm run dev
Hot Reload: Enabled
Turbopack: Enabled (Next.js 15 default)
```

### Known Pitfalls & Fixes (Nov 28, 2025)
- If dev shows 500/502 or `next: not found`:
  - Reinstall deps: `rm -rf node_modules package-lock.json && npm install`
  - Ensure `@swc/helpers` is present: `npm install @swc/helpers@^0.5.1`
  - Start dev: `PORT=3001 npm run dev`
- Logs location used in sessions: `/tmp/next-dev.log`

## Database Architecture

### Schema v2.0 - ACCOUNT Hierarchy (November 16, 2025)

**Multi-tenant Structure:**
```sql
ACCOUNT (id, name, subdomain, created_at)
  ├── USERS (id, account_id, email, password_hash, full_name, role)
  ├── COMPANIES (id, account_id, name, website, phone, ...)
  ├── CONTACTS (id, account_id, first_name, last_name, email, phone, company_id)
  ├── PIPELINES (id, account_id, name, created_at)
  │     └── STAGES (id, pipeline_id, name, position, color)
  │           └── DEALS (id, pipeline_id, stage_id, company_id, title, budget, ...)
  │                 └── DEAL_CONTACTS (deal_id, contact_id) [many-to-many]
  ├── TASKS (id, account_id, deal_id, title, description, due_date, assigned_to)
  ├── NOTES (id, account_id, deal_id, content, created_by)
  └── ACTIVITY_LOGS (id, account_id, user_id, entity_type, entity_id, action)
```

**Key Design Principles:**
- All data isolated by `account_id` (multi-tenancy)
- Companies & Contacts are independent entities (not tied to deals)
- Deals reference company via `company_id` (one-to-many)
- Deals ↔ Contacts via `deal_contacts` junction table (many-to-many)
- Auto-create default pipeline on account creation (PostgreSQL trigger)
- Case-insensitive email lookups via `LOWER(email)`

**Important Column Names (for API queries):**
- tasks: `due_date` (NOT due_at)
- notes: `created_by` (FK to users)
- activity_logs: `user_id` (FK to users), `entity_type` (NOT entity)
- deals: NO `contact_id` field (use deal_contacts table)

### Connection Management
```typescript
// src/lib/db.ts
import { Client } from 'pg'

export async function query(text: string, params?: any[]) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })
  await client.connect()
  try {
    return await client.query(text, params)
  } finally {
    await client.end()
  }
}
```

### Schema Management (Drizzle)
```typescript
// drizzle.config.ts
export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
}
```

### Tables Structure
```
users (authentication placeholder)
  ├── id (UUID, PK)
  ├── email (VARCHAR 320, UNIQUE)
  ├── password_hash (VARCHAR 255) -- bcrypt hashed
  ├── full_name (VARCHAR 255)
  ├── role (VARCHAR 32, default 'manager')
  └── created_at, updated_at

companies (organizations)
  ├── id (UUID, PK)
  ├── name (TEXT, required)
  ├── phone (VARCHAR 64)
  ├── user_id (UUID, FK → users) -- data isolation
  └── created_at, updated_at

contacts (people)
  ├── id (UUID, PK)
  ├── company_id (UUID, FK → companies)
  ├── first_name, last_name (TEXT)
  ├── email, phone (VARCHAR 255/64)
  ├── position (VARCHAR 120)
  ├── user_id (UUID, FK → users) -- data isolation
  └── created_at, updated_at

pipelines (sales workflows)
  ├── id (UUID, PK)
  ├── name (TEXT, required)
  ├── user_id (UUID, FK → users) -- each user has their pipelines
  └── created_at
  -- Auto-created on user registration via trigger

stages (pipeline steps)
  ├── id (UUID, PK)
  ├── pipeline_id (UUID, FK → pipelines)
  ├── name (TEXT, required)
  ├── position (INT, default 0)
  └── created_at

deals (opportunities)
  ├── id (UUID, PK)
  ├── title (TEXT, required)
  ├── price (NUMERIC)
  ├── stage_id (UUID, FK → stages)
  ├── company_id (UUID, FK → companies)
  ├── contact_id (UUID, FK → contacts) -- legacy, prefer deal_contacts
  ├── user_id (UUID, FK → users)
  └── created_at, updated_at

deal_contacts (many-to-many junction)
  ├── deal_id (UUID, FK → deals)
  ├── contact_id (UUID, FK → contacts)
  ├── PRIMARY KEY (deal_id, contact_id)
  └── created_at

tasks (todo items)
  ├── id (UUID, PK)
  ├── deal_id (UUID, FK → deals)
  ├── title (TEXT, required)
  ├── description (TEXT)
  ├── due_date (TIMESTAMP)
  ├── completed (BOOLEAN, default false)
  ├── assigned_to (UUID, FK → users)
  └── created_at, updated_at

notes (deal notes)
  ├── id (UUID, PK)
  ├── deal_id (UUID, FK → deals)
  ├── content (TEXT)
  ├── user_id (UUID, FK → users)
  └── created_at

activity_logs (audit trail)
  ├── id (UUID, PK)
  ├── entity (TEXT) -- 'deal', 'contact', etc.
  ├── entity_id (UUID)
  ├── action (TEXT) -- 'created', 'updated', etc.
  ├── user_id (UUID, FK → users)
  ├── details (JSONB)
  └── created_at
```

## API Route Patterns

### Standard CRUD Structure
```typescript
// src/app/api/[entity]/route.ts
export async function GET(request: Request) {
  // List all entities
  const result = await query(`SELECT * FROM ${entity}`)
  return Response.json(result.rows)
}

export async function POST(request: Request) {
  const body = await request.json()
  // Validate & insert
  const result = await query(
    `INSERT INTO ${entity} (...) VALUES (...) RETURNING *`,
    [...]
  )
  return Response.json(result.rows[0], { status: 201 })
}

// src/app/api/[entity]/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await query(
    `SELECT * FROM ${entity} WHERE id = $1`,
    [id]
  )
  return Response.json(result.rows[0])
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  // Update logic
  return Response.json(result.rows[0])
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await query(`DELETE FROM ${entity} WHERE id = $1`, [id])
  return Response.json({ success: true })
}
```

### Special Endpoints
```typescript
// GET /api/pipelines - Returns pipelines with stages
SELECT p.*, 
  json_agg(json_build_object(...)) as stages
FROM pipelines p
LEFT JOIN stages s ON s.pipeline_id = p.id
GROUP BY p.id

// GET /api/deals/[id]/contacts - Returns contacts for deal
SELECT c.*, co.name as company_name
FROM deal_contacts dc
JOIN contacts c ON c.id = dc.contact_id
LEFT JOIN companies co ON co.id = c.company_id
WHERE dc.deal_id = $1

// POST /api/deals/[id]/contacts - Link contact to deal
INSERT INTO deal_contacts (deal_id, contact_id) 
VALUES ($1, $2)
RETURNING *

// GET /api/stats - Dashboard statistics
SELECT 
  COUNT(*) FILTER (WHERE stage_id = $1) as stage_count,
  SUM(price) as total_value
FROM deals
```

## Frontend Architecture

### Next.js 15 App Router
```
/workspaces/srm-new/src/app/
├── page.tsx             -- Dashboard (default route)
├── layout.tsx           -- Root layout with Sidebar
├── globals.css          -- Tailwind imports + custom styles
├── leads/page.tsx       -- Kanban board view
├── contacts/page.tsx    -- Contacts list
├── companies/page.tsx   -- Companies list
├── tasks/page.tsx       -- Tasks list
└── api/                 -- Server-side routes
    ├── companies/
    ├── contacts/
    ├── deals/
    │   └── [id]/contacts/
    ├── pipelines/
    ├── stats/
    └── tasks/
```

### Component Structure
```
/workspaces/srm-new/src/components/
├── DealModal.tsx     -- Complex modal (981 lines)
│   ├── State: deal, editForm, dealContacts, pendingContactChanges
│   ├── Tabs: Info, Tasks, Notes, Activity
│   └── Features: Multi-contact, autocomplete, context menus
├── KanbanBoard.tsx   -- Drag-and-drop pipeline
│   ├── Uses @dnd-kit/core
│   └── Optimistic updates
└── Sidebar.tsx       -- Navigation menu
    └── Links to all main pages
```

### Styling System
```css
/* globals.css - Tailwind 4 */
@import "tailwindcss";

/* Dark theme colors */
slate-950: Background
slate-900: Cards/modals
slate-800: Inputs/secondary surfaces
slate-700: Borders
slate-600: Hover states
slate-400: Disabled text
slate-300: Labels
slate-200: Primary text

/* Accent colors */
blue-500: Primary actions
green-500: Success states
red-500: Danger actions
yellow-500: Warnings
```

### State Management Pattern
```typescript
// No Redux/Zustand - Direct useState
'use client'

export default function Page() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/entity')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])
  
  return <Component data={data} />
}
```

## Build & Deployment

### Scripts
```json
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "db:push": "drizzle-kit push",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio",
  "db:seed": "tsx drizzle/seed.ts"
}
```

### Migration Workflow
```bash
# 1. Modify schema
vim drizzle/schema.ts

# 2. Generate migration
npm run db:generate

# 3. Apply migration
npm run db:migrate

# 4. Seed data (optional)
npm run db:seed
```

### Key Configuration Files
```typescript
// next.config.js
module.exports = {
  reactStrictMode: true,
  experimental: {
    serverActions: true
  }
}

// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "dom"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

// postcss.config.cjs
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}
  }
}
```

## Dependencies Rationale

| Package | Why Chosen |
|---------|-----------|
| Next.js 15 | Latest stable, App Router, Server Components |
| PostgreSQL | Relational data, ACID compliance, JSON support |
| Drizzle | Type-safe schema, minimal overhead, SQL control |
| @dnd-kit | Best React DnD library, accessible, performant |
| Tailwind 4 | Fastest styling, consistent design system |
| pg (node-postgres) | Direct PostgreSQL driver, no ORM overhead |
| bcryptjs | Industry standard password hashing (10 rounds) |
| jsonwebtoken | JWT token generation/verification, widely used |

---

## Authentication Architecture

### JWT Flow
```
1. User submits credentials (email + password)
2. Server verifies password with bcrypt.compare()
3. Server generates JWT with { userId, email }
4. Token returned to client (expires in 30 days)
5. Client stores in:
   - localStorage (for client-side access)
   - Cookie (for middleware access)
6. Middleware checks cookie on each request
7. API routes can verify Bearer token if needed
```

### Security Measures
- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens signed with secret from .env
- Tokens expire after 30 days
- Middleware protects all routes except /login and /api/auth/*
- Email unique constraint prevents duplicates

### Auto-Pipeline Creation
```sql
-- Trigger function
CREATE FUNCTION create_default_pipeline_for_user()
RETURNS TRIGGER AS $$
DECLARE pipeline_id UUID;
BEGIN
  INSERT INTO pipelines (name, user_id)
  VALUES ('Основная воронка', NEW.id)
  RETURNING id INTO pipeline_id;
  
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

-- Trigger
CREATE TRIGGER trigger_create_default_pipeline
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_pipeline_for_user();
```

This ensures every new user automatically gets a fully configured pipeline with 5 stages on registration.

## Known Technical Debt
- No authentication implemented (placeholder users)
- No error boundary components
- Alerts for errors (should be toast notifications)
- No input debouncing on search fields
- No optimistic updates outside Kanban
- No loading skeletons (just text "Loading...")
- Hardcoded user_id in API routes
- No pagination on lists
- No rate limiting
- No request validation library (manual checks)
