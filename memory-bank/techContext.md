# Technical Context

## Stack Overview

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 15.3.5 | Full-stack React with App Router |
| Runtime | Node.js | 22+ | JavaScript runtime |
| Language | TypeScript | 5.8.3 | Type safety |
| Database | PostgreSQL | 15 | Primary data store |
| ORM | Drizzle | 0.39.3 | Schema management & migrations |
| Styling | Tailwind CSS | 4.0.0 | Utility-first CSS |
| UI Library | React | 18.3.1 | Component framework |
| DnD | @dnd-kit/core | 6.3.1 | Drag and drop |
| Auth | Supabase | 2.49.1 | Authentication (placeholder) |

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

# Supabase (configured but not fully used)
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Dev Server
```bash
Port: 3000
Command: npm run dev
Hot Reload: Enabled
Turbopack: Enabled (Next.js 15 default)
```

## Database Architecture

### Connection Management
```typescript
// src/lib/db.ts
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    return await client.query(text, params)
  } finally {
    client.release()
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
  ├── email, name, avatar_url
  └── created_at, updated_at

companies (organizations)
  ├── id (UUID, PK)
  ├── name (TEXT, required)
  ├── phone (VARCHAR 64)
  └── created_at, updated_at

contacts (people)
  ├── id (UUID, PK)
  ├── company_id (UUID, FK → companies)
  ├── first_name, last_name (TEXT)
  ├── email, phone (VARCHAR 255/64)
  ├── position (VARCHAR 120)
  └── created_at, updated_at

pipelines (sales workflows)
  ├── id (UUID, PK)
  ├── name (TEXT, required)
  └── created_at

stages (pipeline steps)
  ├── id (UUID, PK)
  ├── pipeline_id (UUID, FK → pipelines)
  ├── name (TEXT, required)
  ├── order (INT, default 0)
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
| Supabase | Future auth/realtime, PostgreSQL compatible |

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
