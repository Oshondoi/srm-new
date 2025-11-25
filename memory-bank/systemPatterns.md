# System Patterns

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│           Next.js 15 App Router             │
│  ┌───────────────────────────────────────┐  │
│  │   Client Components (src/app/*)       │  │
│  │   - Pages with 'use client'           │  │
│  │   - State management with useState    │  │
│  │   - Direct API calls with fetch       │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │   Shared Components (src/components)  │  │
│  │   - KanbanBoard (DnD)                 │  │
│  │   - DealModal (complex state)         │  │
│  │   - Sidebar (navigation)              │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │   API Routes (src/app/api/*)          │  │
│  │   - Server-side only                  │  │
│  │   - Direct PostgreSQL queries         │  │
│  │   - CRUD operations                   │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │   Database Layer (src/lib/db.ts)      │  │
│  │   - PostgreSQL client wrapper         │  │
│  │   - Query execution                   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
          │                                   │
          ▼                                   ▼
  ┌──────────────┐                  ┌─────────────────┐
  │  PostgreSQL  │                  │  Docker         │
  │  (Supabase)  │                  │  Container      │
  │  Database    │                  │  srm-postgres   │
  └──────────────┘                  └─────────────────┘
```

## Key Technical Decisions

### 1. Multi-Tenant ACCOUNT Architecture
**Decision**: Implement account-based data isolation at database level
**Rationale**:
- Supports multiple organizations in single database
- Data isolation via account_id on all tables
- Scalable for SaaS business model
- Each account gets independent: users, companies, contacts, pipelines

**Implementation:**
- Top-level `accounts` table with subdomain
- Foreign key `account_id` on all data tables
- PostgreSQL trigger auto-creates default pipeline
- Companies & Contacts as independent entities (not embedded in deals)

**Data Relationships:**
```
Company (independent) ← deal.company_id (one-to-many)
Contact (independent) ← deal_contacts.contact_id (many-to-many)
```

This allows:
- Creating company/contact from deal modal → adds to account's master list
- Same company/contact used across multiple deals
- No data duplication

### 2. No External State Management
**Decision**: Use React's built-in useState instead of Redux/Zustand
**Rationale**: 
- Simpler codebase
- Less boilerplate
- Direct prop passing maintains clarity
- Component-level state sufficient for current scale

### 2. Direct Database Queries
**Decision**: Write raw SQL instead of full ORM usage
**Rationale**:
- More control over query performance
- Simpler debugging
- Drizzle schema for type safety, but queries in API routes
- Faster iteration during development

### 3. Server-Side API Routes Only
**Decision**: All data fetching through `/api/*` endpoints
**Rationale**:
- Clear client-server boundary
- Centralized data access
- Easier to add authentication later
- Standard REST patterns

### 4. Transactional Edit Pattern ⚠️ КРИТИЧЕСКИ ВАЖНО
**Decision**: Buffer changes locally, save on explicit action
**Rationale**:
- Prevents accidental data loss
- User control over persistence
- Better UX with undo capability
- Matches amoCRM behavior

**ПРАВИЛА РАБОТЫ С МОДАЛКОЙ:**
1. **НИКОГДА не сохраняй данные автоматически** - только по кнопке "Сохранить"
2. **Создание новых сущностей:**
   - Контакты: создаются временно (`temp-${Date.now()}`), сохраняются в `pendingContactChanges.newContacts`
   - Компании: создаются временно (`temp-company-${Date.now()}`), флаг `isNew: true`
3. **Все изменения отслеживаются** через `setHasChanges(true)`
4. **При закрытии с изменениями** - показывается диалог подтверждения
5. **При сохранении:**
   - Сначала создаются временные сущности в БД
   - Затем обновляются связи
   - Только после этого очищается `hasChanges`

## Design Patterns

### 1. Modal State Management
```typescript
// Pattern: Local State Buffer
const [editForm, setEditForm] = useState<any>({})
const [hasChanges, setHasChanges] = useState(false)
const [pendingContactChanges, setPendingContactChanges] = useState({
  added: string[],
  removed: string[]
})

// Changes tracked separately
function updateEditForm(field, value) {
  setEditForm(prev => ({ ...prev, [field]: value }))
  setHasChanges(true)
}

// Batch save
async function handleSave() {
  // Save editForm fields
  // Apply pendingContactChanges
  // Clear pending state
}
```

### 2. Unified Menu State
```typescript
// Pattern: Single Menu Tracker
const [activeMenu, setActiveMenu] = useState<string | null>(null)

// Check which menu is active
{activeMenu === 'contact-123' && (<ContextMenu />)}

// Close all menus on outside click
useEffect(() => {
  document.addEventListener('click', () => setActiveMenu(null))
}, [activeMenu])
```

### 3. Autocomplete with Creation
```typescript
// Pattern: Search + Create Pattern
const [searching, setSearching] = useState(false)
const [searchTerm, setSearchTerm] = useState('')

<input 
  value={searchTerm}
  onChange={(e) => {
    setSearchTerm(e.target.value)
    setSearching(true)
  }}
  onKeyDown={(e) => {
    if (e.key === 'Enter') handleCreate(searchTerm)
  }}
/>

{searching && (
  <dropdown>
    <button onClick={() => handleCreate(searchTerm)}>
      + Create "{searchTerm}"
    </button>
    {filteredItems.map(item => (
      <button onClick={() => handleSelect(item)}>{item.name}</button>
    ))}
  </dropdown>
)}
```

### 4. Conditional Field Display
```typescript
// Pattern: Show Only Filled Fields
{contact.phone && (
  <div>
    <label>Phone</label>
    <value>{contact.phone}</value>
  </div>
)}

{contact.email && (
  <div>
    <label>Email</label>
    <value>{contact.email}</value>
  </div>
)}
```

## Component Relationships

### DealModal (Central Component)
- **Purpose**: Complete deal editing interface
- **Tabs**: Info, Tasks, Notes, Activity
- **State Management**: 
  - `deal`: Current deal data from API
  - `editForm`: Buffered changes
  - `dealContacts`: Multiple contacts (many-to-many)
  - `pendingContactChanges`: { added, removed }
  - `hasChanges`: Boolean flag for unsaved state
  - `activeMenu`: Which context menu is open

### KanbanBoard
- **Purpose**: Visual pipeline management
- **Key Features**: 
  - Drag and drop with @dnd-kit
  - Optimistic updates
  - Rollback on API failure
- **Integration**: Triggers DealModal when deal clicked

### Data Flow
```
User Action → Local State Update → hasChanges = true
                ↓
User Clicks Save → API Call → Database Update
                ↓
Success → Reload Data → Clear hasChanges
```

## Critical Implementation Paths

### Deal Contact Management
1. Load initial contacts: `GET /api/deals/{id}/contacts`
2. Add contact locally: Update `dealContacts` array + `pendingContactChanges.added`
3. Remove contact locally: Filter `dealContacts` + `pendingContactChanges.removed`
4. Save: POST/DELETE for each pending change
5. Reload: Fetch fresh data from API

### Context Menu Pattern
1. Click field → `setActiveMenu('entity-id')`
2. Render menu if `activeMenu === 'entity-id'`
3. Menu has `onClick={(e) => e.stopPropagation()}`
4. Document click listener closes all menus
5. Menu actions call API then close menu

### Form Validation
- Client-side: Required fields checked before submit
- Server-side: Validate in API route before query
- User feedback: Alert for errors (temporary, will be replaced with toasts)

## Database Schema Key Points

### Many-to-Many: deal_contacts
```sql
CREATE TABLE deal_contacts (
  deal_id UUID REFERENCES deals(id),
  contact_id UUID REFERENCES contacts(id),
  PRIMARY KEY (deal_id, contact_id)
)
```
- No `id` column (composite primary key)
- Cascade deletes
- `created_at` for chronological ordering

### Denormalization Strategy
- Keep `contact_id` in deals table (backward compatibility)
- Use `deal_contacts` for actual relationships
- Migration populated `deal_contacts` from existing `deals.contact_id`

## Error Handling
- Try/catch in all async functions
- Alert user on error (temporary)
- Log errors to console
- Rollback optimistic updates on failure
- No global error boundary (yet)

## Performance Considerations
- Load references (companies, contacts) once on modal open
- Debounce search inputs (not implemented yet)
- Lazy load activity logs (limit 20)
- Optimistic UI updates for drag-and-drop
- SQL joins for related data (avoid N+1 queries)
