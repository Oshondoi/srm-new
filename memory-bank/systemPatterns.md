# System Patterns

## ⚠️ ТЕРМИНОЛОГИЯ (КРИТИЧЕСКИ ВАЖНО)

**Название: Ошондой CRM**

**Два уровня "пользователей":**

1. **ACCOUNT (Аккаунт)** = Клиент Ошондой CRM
   - Организация, которая использует систему
   - Таблица: `accounts`
   - Пример: ООО "Рога и Копыта" регистрируется → создаётся account

2. **USER (Пользователь/Сотрудник)** = Работник организации
   - Сотрудник компании, работающий в CRM
   - Таблица: `users` (с `account_id`)
   - Пример: Иванов И.И., менеджер в ООО "Рога и Копыта"

**Иерархия каскадного удаления:**
```sql
DELETE FROM accounts WHERE id = 1;
-- Автоматически удалится:
-- - Все users этого аккаунта
-- - Все pipelines → stages → deals
-- - Все companies, contacts, tasks, notes
-- - ВСЁ, что имеет account_id = 1
```

**В коде всегда помнить:**
- `account` = клиент системы (организация)
- `user` = сотрудник (работает в аккаунте)

---

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
          │
          ▼
  ┌──────────────────────────────┐
  │  PostgreSQL (Supabase)       │
  │  EU Central 1 Region         │
  │  Transaction Pooler (IPv4)   │
  └──────────────────────────────┘
```

## Key Technical Decisions

### 1. Multi-Tenant ACCOUNT Architecture
**Decision**: Implement account-based data isolation at database level
**Rationale**:
- Supports multiple organizations in single database
- Data isolation via account_id on all tables
- Scalable for SaaS business model
- Each account gets independent: users, companies, contacts, pipelines

**Pipeline Creation Logic**:
- Воронка создаётся при регистрации АККАУНТА (не пользователя)
- 1 дефолтная воронка "Основная воронка" per account
- 7 этапов: 5 видимых (Не разобранное, Первичный контакт, Переговоры, Принимают решение, Согласование договора) + 2 скрытых (Успешно реализована, Провалена)
- Скрытые этапы (is_visible=false) используются только для отчётов, не показываются в Kanban
- NO triggers на создание воронок - только через код регистрации

**Implementation:**
- Top-level `accounts` table with subdomain
- Foreign key `account_id` on all data tables
- PostgreSQL trigger auto-creates default pipeline
- Companies & Contacts as independent entities (not embedded in deals)

**Data Relationships:**
```
Company (independent) ← deal.company_id (one-to-many) [ТОЛЬКО ОДНА компания на сделку!]
Contact (independent) ← deal_contacts.contact_id (many-to-many) [может быть несколько контактов]
```

**⚠️ ВАЖНО: У сделки может быть только ОДНА компания!**
- `deals.company_id` - один-ко-многим (nullable)
- У одной сделки = максимум 1 компания (или NULL)
- У одной компании может быть много сделок
- Контакты могут быть множественные (many-to-many через deal_contacts)

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
- JWT authentication via middleware
- Multi-tenant security with account_id checks
- Standard REST patterns

**Security Pattern (Dec 5, 2025):**
```typescript
// Every API route with [id] parameter
export async function GET(request: Request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // ALWAYS filter by account_id
  const result = await query(
    'SELECT * FROM deals WHERE id = $1 AND account_id = $2',
    [dealId, user.accountId]
  )
  
  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
```

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

### 0. Context Menu Anchoring (UI Precision)
**Decision**: Position context menus relative to the exact text start, not padded containers.
**Implementation**:
- Wrap trigger text in `span` and mark with data attributes:
  - Contact name: `[data-contact-name-trigger="{id}"]`
  - Contact company name: `[data-contact-company-name-trigger="{id}"]`
  - Main company name: `[data-company-name-trigger]`
- Compute position via `getBoundingClientRect()` of the inner span.
- Apply vertical flip if insufficient space below; clamp `left` within viewport.
**Rationale**: Consistent, pixel-perfect placement regardless of container padding or negative margins.

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

## Full Access Mode (Полный доступ)

Когда владелец явно сообщает, что предоставляет полный доступ (примеры фраз: "полный доступ", "делай всё", "разрешаю всё", "не жди подтверждения", "делай подряд"), агент ИИ переходит в режим автономного выполнения.

**Правила Full Access Mode:**

1. Не спрашивать повторные подтверждения на каждую безопасную операцию (чтение файлов, редактирование кода, запуск миграций, npm install, локальные SELECT/UPDATE).
2. Продвигаться последовательно по задаче, минимизируя остановки и диалоговые окна.
3. Запрашивать подтверждение ТОЛЬКО перед потенциально разрушительными действиями:
  - Массовое удаление данных (DELETE без WHERE или с большим охватом).
  - Удаление таблиц / столбцов (DROP TABLE/COLUMN).
  - Неразвернутая/неоткатная миграция, меняющая критичные типы данных.
  - Перезапись чувствительных секретов.
4. Если действие потенциально необратимо, агент обязан коротко объяснить риск и дождаться явного "Да".
5. В остальных случаях агент действует автономно и отчитывается по вехам (краткие прогресс-апдейты) без остановки.
6. Любое явное отключение (фразы: "остановись", "спроси меня", "отключи полный доступ") немедленно выводит из режима.

**Цель:** Исключить потери времени на лишние подтверждения при активной разработке и ускорить реализацию поставленной задачи.

**Логирование:** Все изменения всё равно отражаются в истории (патчи, SQL команды) для прозрачности.

> Этот паттерн добавлен по прямому запросу владельца для минимизации фрикции. Использовать ответственно.

## Dev Server Persistence (НЕ ПРЕРЫВАТЬ СЕРВЕР)

Правило обязательно при любых сессиях разработки:

1. Никогда НЕ останавливать работающий `npm run dev` вручную без прямого явного указания владельца.
2. Для любых задач (линт, билд, миграции, sql, генерация) открывать новый терминал / новую сессию.
3. Если нужно пересобрать — запускать второй инстанс на другом порте (Next сам выберет свободный). Старый не трогать.
4. Перезапуск сервера допускается только если:
  - Владелец написал явно: «перезапусти сервер» / «останови сервер».
  - Изменена критичная env-переменная, требующая рестарта, и это подтверждено.
5. При обнаружении упавшего сервера: тихо поднять новый, зафиксировать факт (лог, сообщение), НЕ спрашивая разрешения.
6. Любая команда, способная убить процесс (Ctrl+C, kill, docker stop для контейнера с dev сервером) запрещена без прямого разрешения.
7. В README и memory-bank дублируем правило, чтобы оно переживало любые сессии.

Цель: Исключить прерывание пользовательской работы в браузере и потери контекста состояния UI.

## Responsibility Selector Pattern

**Назначение:** Управлять полем `responsible_user_id` сделки через явное сохранение (transactional edit).

**Правила:**
1. Выбор отвечает только за локальное изменение `editForm.responsible_user_id`.
2. Сохранение выполняется одной батч-операцией (PUT) вместе с другими полями.
3. Изменение ответственного генерирует `deal-updated` для синхронизации Kanban.
4. Dropdown не делит состояние с чат-получателями (отдельные стейты).
5. Отмена закрытия без сохранения возвращает предыдущее значение.

**Анти-паттерны:** Авто-сохранение при клике, общий boolean для разных dropdown.

## Stage Key Uniqueness Pattern

**Проблема:** Повторяющиеся имена этапов порождали React warnings из-за неуникальных ключей.

**Решение:** Использовать стабильный идентификатор `stage_id` из БД во всех списках и статистике.

**Реализация:**
- API `stats` добавляет `stage_id` в SELECT.
- Компоненты заменяют `key={stage.name}` → `key={stage.stage_id}`.

**Преимущества:** Отсутствие коллизий, безопасное переименование, предсказуемый diff.

**Дальше:** Возможен кеш по `stage_id` для ускорения рендера.
