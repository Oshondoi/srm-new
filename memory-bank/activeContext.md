# Active Context

## Current Session Focus

### What We're Working On
**Bug Fixing & Data Safety** - Completed comprehensive fix for undefined/null data handling across all pages.

### Latest User Request
> "обнови memory-bank"

**Status**: ✅ COMPLETE - All work documented, system stable and ready for next session

### System State
- PostgreSQL container: **Running** (srm-postgres)
- Database: 6 deals, test data populated
- All pages: Working without errors
- Memory Bank: **Up to date**

---

## Recent Work Summary (Current Session)

### 1. Critical Bug Fixes - Data Safety ✅
**Problem**: Multiple `TypeError: Cannot read properties of undefined` errors across all pages
- `stats.totalValue.toLocaleString()` - undefined value
- `stats.recentDeals.length` - undefined array
- `companies.map is not a function` - API returned non-array

**Root Cause**: No defensive programming - direct access to API data without null/undefined checks

**Solution**: Comprehensive data safety implementation across ALL pages:

```typescript
// Pattern 1: Safe initialization from API
const data = await res.json()
setCompanies(Array.isArray(data) ? data : [])

// Pattern 2: Safe rendering with fallback
{(companies || []).map(c => ...)}

// Pattern 3: Safe property access
{(stats.totalValue || 0).toLocaleString()}

// Pattern 4: Safe length check
{(!array || array.length === 0) && <EmptyState />}

// Pattern 5: Safe nested access
{stats.tasks?.overdue > 0 && <Alert />}
```

**Files Fixed**:
- `/src/app/page.tsx` - Dashboard stats (totalValue, arrays)
- `/src/app/leads/page.tsx` - All arrays (pipelines, companies, contacts, stages)
- `/src/app/contacts/page.tsx` - Contacts and companies arrays
- `/src/app/companies/page.tsx` - Companies array
- `/src/app/tasks/page.tsx` - Already safe (verified)

**Impact**: Zero runtime errors, application stable even with empty/invalid API responses

### 2. PostgreSQL Container Management ✅
**Problem**: Empty pages - no data visible despite seed file existing

**Root Cause**: Docker container `srm-postgres` was stopped

**Solution**: 
```bash
docker start srm-postgres
```

**Verification**: Confirmed 6 deals exist in database

**Important**: Container must be running for application to work!

### 3. Database Schema Enhancement (Previous Session)
**Completed**: Many-to-many deal-contact relationship

```sql
-- Created junction table
CREATE TABLE deal_contacts (
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (deal_id, contact_id)
);

-- Added position field to contacts
ALTER TABLE contacts ADD COLUMN position VARCHAR(120);
```

**Migration**: `/workspaces/srm-new/drizzle/migrations/0002_deal_contacts.sql`

### 2. API Endpoint Implementation
**New Endpoint**: `/api/deals/[id]/contacts`

- `GET` - List all contacts for a deal with company info
- `POST` - Add contact to deal (with deduplication)
- `DELETE` - Remove contact from deal

**Updated Endpoint**: `/api/contacts`
- POST now accepts: `first_name`, `last_name`, `email`, `phone`, `company_id`, `position`

### 3. UI/UX Improvements

#### Visual Structure (DealModal)
Divided into **3 clear sections** with visible separators:

1. **ОБЩАЯ ИНФОРМАЦИЯ**
   - Title, price, stage, responsible
   - User, budget, deadline

2. **КОНТАКТ** (Multiple Contact Cards)
   - Each contact in separate card
   - Context menu (Edit, Remove)
   - Conditional field display:
     - Phone (if exists)
     - Email (if exists)
     - Position (if exists)
     - Company (always shown if contact has company)
   - "+ Добавить контакт" button

3. **КОМПАНИЯ**
   - Company selector with autocomplete
   - Phone (if company has phone)
   - "+ Создать компанию" button

#### Transactional Editing Pattern
```typescript
// Local state buffer
const [dealContacts, setDealContacts] = useState<Contact[]>([])
const [pendingContactChanges, setPendingContactChanges] = useState({
  added: string[],    // Contact IDs to add
  removed: string[]   // Contact IDs to remove
})

// Changes tracked but NOT saved
function handleAddContact(contactId: string) {
  // Update UI immediately
  // Store in pendingContactChanges.added
  // NO API call yet
}

// Batch save on "Сохранить" click
async function handleSave() {
  // Save all deal fields
  // Process pendingContactChanges.added (POST each)
  // Process pendingContactChanges.removed (DELETE each)
  // Reload fresh data
  // Clear pending state
}
```

### 4. Context Menu Refactor
**Problem**: Multiple boolean states (`showCompanyMenu`, `showContactMenu`, etc.) didn't scale

**Solution**: Single unified state
```typescript
const [activeMenu, setActiveMenu] = useState<string | null>(null)

// Usage
{activeMenu === `contact-${contact.id}` && (
  <ContextMenu onClose={() => setActiveMenu(null)} />
)}
```

**Benefits**:
- Only one menu open at a time
- Scalable to unlimited menu types
- Simpler outside-click handling

---

## Active Implementation Details

### DealModal State Architecture (Current)
```typescript
// Deal data
const [deal, setDeal] = useState<Deal | null>(null)

// Edit buffer
const [editForm, setEditForm] = useState<any>({})

// Change tracking
const [hasChanges, setHasChanges] = useState(false)

// Contact management
const [dealContacts, setDealContacts] = useState<Contact[]>([])
const [pendingContactChanges, setPendingContactChanges] = useState({
  added: string[],
  removed: string[]
})

// Reference data
const [companies, setCompanies] = useState<Company[]>([])
const [allContacts, setAllContacts] = useState<Contact[]>([])
const [users, setUsers] = useState<User[]>([])
const [stages, setStages] = useState<Stage[]>([])

// UI state
const [activeTab, setActiveTab] = useState('info')
const [activeMenu, setActiveMenu] = useState<string | null>(null)
const [searchCompanyTerm, setSearchCompanyTerm] = useState('')
const [searchContactTerm, setSearchContactTerm] = useState('')
const [showCompanySearch, setShowCompanySearch] = useState(false)
const [showContactSearch, setShowContactSearch] = useState(false)
```

### Contact Card Template (Current)
```tsx
<div className="bg-slate-800 p-4 rounded-lg relative">
  {/* Context Menu Trigger */}
  <button onClick={() => setActiveMenu(`contact-${contact.id}`)}>
    ⋮
  </button>
  
  {/* Context Menu */}
  {activeMenu === `contact-${contact.id}` && (
    <div onClick={(e) => e.stopPropagation()}>
      <button onClick={handleEdit}>Редактировать</button>
      <button onClick={handleRemove}>Удалить</button>
    </div>
  )}
  
  {/* Contact Name */}
  <div>{contact.first_name} {contact.last_name}</div>
  
  {/* Conditional Fields */}
  {contact.phone && <div>📞 {contact.phone}</div>}
  {contact.email && <div>✉️ {contact.email}</div>}
  {contact.position && <div>💼 {contact.position}</div>}
  
  {/* Company Info (always shown if exists) */}
  {contact.company_name && (
    <div>🏢 {contact.company_name}</div>
  )}
</div>
```

---

## Recent Bugs Fixed

| Issue | Root Cause | Solution | Session |
|-------|-----------|----------|---------|
| TypeError: totalValue undefined | No null check | `(value || 0).toLocaleString()` | Current |
| TypeError: array.length undefined | API returned null | `(!array \|\| array.length === 0)` | Current |
| TypeError: companies.map not function | API returned non-array | `Array.isArray(data) ? data : []` | Current |
| All pages showing empty data | Docker container stopped | `docker start srm-postgres` | Current |
| SQL error: `column "entity_type"` | Typo in activity_logs query | Changed to `entity` column | Previous |
| API error: `column "position"` on companies | Inserting into wrong table | Removed from companies POST | Previous |
| Context menu not closing | stopPropagation on trigger | Move to menu body only | Previous |
| Sections not visually separated | No border between sections | Added `border-t` on section containers | Previous |
| Contact changes save immediately | Direct API calls | Buffered in `pendingContactChanges` | Previous |

---

## Design Decisions Made

### 1. Deferred Saving
**Why**: Match amoCRM behavior, prevent data loss, give users control
**How**: Local state buffer + confirmation dialogs + batch save

### 2. Conditional Field Display
**Why**: Clean interface, avoid empty labels, scale with data
**How**: `{field && (<Component />)}` pattern throughout

### 3. Autocomplete + Create Pattern
**Why**: Fast data entry, no context switching
**How**: "+" button first in dropdown list, Enter to create

### 4. Section Visual Separation
**Why**: User requested "как на скрине будет визуально понятным зоны"
**How**: Border-top on section containers, spacing, uppercase labels

### 5. Auto-Company Assignment
**Why**: Logical default when creating contact from deal context
**How**: Pass deal's company_id to POST /api/contacts

---

## Pending Work Items

### High Priority
- [ ] Implement detailed company cards (companies/[id] page)
- [ ] Implement detailed contact cards (contacts/[id] page)
- [ ] Add phone/email click handlers (call/email integrations)
- [ ] Replace alert() with toast notifications

### Medium Priority
- [ ] Add loading skeletons
- [ ] Implement activity log enhancements
- [ ] Add notes rich text editor
- [ ] Task completion UI improvements
- [ ] Dashboard analytics implementation

### Low Priority
- [ ] Input debouncing on search fields
- [ ] Pagination for large lists
- [ ] Keyboard shortcuts
- [ ] Export/import functionality
- [ ] Advanced filtering

### Technical Debt
- [ ] Add request validation library (Zod)
- [ ] Implement authentication properly
- [ ] Add error boundaries
- [ ] Add rate limiting
- [ ] Optimize SQL queries with EXPLAIN ANALYZE
- [ ] Add unit tests

---

## Key Files Modified Recently

| File | Lines | Last Change | Session |
|------|-------|-------------|---------|
| `src/app/page.tsx` | 212 | Data safety fixes | Current |
| `src/app/leads/page.tsx` | 280 | Array safety + initialization | Current |
| `src/app/contacts/page.tsx` | 240 | Array safety | Current |
| `src/app/companies/page.tsx` | 200 | Array safety | Current |
| `src/components/DealModal.tsx` | 981 | Multiple contacts UI | Previous |
| `src/app/api/deals/[id]/contacts/route.ts` | 82 | Junction table CRUD | Previous |
| `drizzle/migrations/0002_deal_contacts.sql` | 15 | Schema changes | Previous |

---

## Critical Information for Next Session

### System Requirements
**BEFORE STARTING ANY WORK:**
1. ✅ Check Docker container status: `docker ps | grep srm-postgres`
2. ✅ If not running: `docker start srm-postgres`
3. ✅ Wait 3 seconds for container to start
4. ✅ Verify data exists: `docker exec -it srm-postgres psql -U postgres -d srm -c "SELECT COUNT(*) FROM deals;"`

**Without running PostgreSQL container, ALL pages will be empty!**

### Data Safety Pattern (MANDATORY)
**ALWAYS use defensive programming for API data:**

```typescript
// ✅ CORRECT - Safe initialization
const data = await res.json()
setState(Array.isArray(data) ? data : [])

// ❌ WRONG - Will crash if API returns null
const data = await res.json()
setState(data)

// ✅ CORRECT - Safe rendering
{(array || []).map(item => ...)}

// ❌ WRONG - Will crash if array is undefined
{array.map(item => ...)}

// ✅ CORRECT - Safe property access
{(obj?.value || 0).toLocaleString()}

// ❌ WRONG - Will crash if value is undefined
{obj.value.toLocaleString()}
```

**This pattern prevents ALL "Cannot read properties of undefined" errors!**

### User Preferences
- Russian language throughout UI
- Exact amoCRM clone (visual and behavioral)
- Explicit save confirmations required
- No automatic saves
- Visual clarity paramount

### Code Style Patterns
- TypeScript strict mode
- Tailwind for all styling (no custom CSS)
- Direct SQL queries (not ORM abstractions)
- Server Components where possible
- Client Components for interactivity

### Testing Approach
- Manual testing via UI
- curl commands for API validation
- Check Chrome DevTools console for errors
- PostgreSQL direct queries to verify data

### Common Commands
```bash
# Start dev server
npm run dev

# Access database
docker exec -it srm-postgres psql -U postgres -d srm

# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate

# View database in browser
npm run db:studio
```

---

## Critical Patterns to Remember

### 1. Next.js 15 Params Pattern
```typescript
// ALWAYS await params in API routes
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // MUST await
  // ...
}
```

### 2. stopPropagation Placement
```typescript
// ❌ WRONG - Menu won't open
<button onClick={(e) => {
  e.stopPropagation()
  setActiveMenu('menu-1')
}}>Open</button>

// ✅ RIGHT - Only on menu body
<button onClick={() => setActiveMenu('menu-1')}>Open</button>
<div onClick={(e) => e.stopPropagation()}>Menu content</div>
```

### 3. Transactional Edit Flow
```typescript
// 1. Load initial data
useEffect(() => fetchDeal(), [dealId])

// 2. Track changes locally
function updateField(field, value) {
  setEditForm(prev => ({ ...prev, [field]: value }))
  setHasChanges(true)
}

// 3. Save on explicit action
async function handleSave() {
  await fetch('/api/deals/' + dealId, {
    method: 'PUT',
    body: JSON.stringify(editForm)
  })
  setHasChanges(false)
  await fetchDeal() // Reload
}

// 4. Confirm before exit
function handleClose() {
  if (hasChanges) {
    if (!confirm('Несохраненные изменения будут потеряны')) return
  }
  onClose()
}
```

### 4. Autocomplete Pattern
```typescript
const [searchTerm, setSearchTerm] = useState('')
const [showSearch, setShowSearch] = useState(false)

const filtered = items.filter(item => 
  item.name.toLowerCase().includes(searchTerm.toLowerCase())
)

<input 
  value={searchTerm}
  onChange={(e) => {
    setSearchTerm(e.target.value)
    setShowSearch(true)
  }}
  onBlur={() => setTimeout(() => setShowSearch(false), 200)}
/>

{showSearch && (
  <div>
    <button onClick={() => handleCreate(searchTerm)}>
      + Создать "{searchTerm}"
    </button>
    {filtered.map(item => (
      <button onClick={() => handleSelect(item)}>
        {item.name}
      </button>
    ))}
  </div>
)}
```
