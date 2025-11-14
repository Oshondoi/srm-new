# Product Context

## Why This Exists
This is a complete amoCRM clone - a CRM (Customer Relationship Management) system for managing sales pipelines, customer relationships, and business processes. User explicitly stated: **"ТОЧНУЮ КОПИЮ" of amoCRM**.

## Problems It Solves

### 1. Sales Pipeline Management
- **Problem**: Teams need to visualize and track deals through sales stages
- **Solution**: Kanban board with drag-and-drop deal movement between stages
- **Impact**: Clear overview of pipeline status, easy deal progression

### 2. Relationship Complexity
- **Problem**: Deals involve multiple contacts and companies with complex relationships
- **Solution**: Many-to-many deal-contact relationships, visual grouping in deal cards
- **Impact**: Accurate representation of real-world business relationships

### 3. Data Integrity
- **Problem**: Accidental changes or data loss from premature saves
- **Solution**: Transactional editing - all changes buffered until explicit save
- **Impact**: User confidence, undo capability, no accidental modifications

### 4. Information Density
- **Problem**: Too much information clutters interface; too little hides important data
- **Solution**: Conditional rendering - show only filled fields, expandable sections
- **Impact**: Clean interface that scales with data complexity

## How It Should Work

### Deal Management Flow
1. User views pipeline as Kanban board
2. Clicks deal → opens modal with full details
3. Edits fields in modal (changes buffered)
4. Explicitly saves or cancels changes
5. Confirmation required to exit with unsaved changes

### Contact Management
1. Single deal can have multiple contacts
2. Each contact shown in separate card with all details
3. New contacts automatically inherit deal's company
4. Only filled fields displayed (phone, email, position)
5. Visual separation between contacts, company, and general info

### Data Entry Pattern
- **Autocomplete everywhere**: Type to search existing entities
- **Inline creation**: Create new entity without leaving current context
- **"+ Create" first in list**: Always visible, consistent pattern
- **Smart defaults**: Auto-fill related fields (company for contacts)

## User Experience Goals

### 1. Familiarity (amoCRM Clone)
Users familiar with amoCRM should feel at home. Every interaction pattern, visual element, and workflow should match amoCRM behavior.

### 2. Visual Clarity
- **Clear sections**: "ОБЩАЯ ИНФОРМАЦИЯ", "КОНТАКТ", "КОМПАНИЯ" with visible separators
- **Grouped information**: Related fields visually grouped together
- **Contextual data**: Show company info in contact cards automatically

### 3. Data Safety
- No accidental changes
- Clear save/cancel buttons
- Exit confirmation for unsaved changes
- Explicit user control over persistence

### 4. Efficiency
- Minimal clicks to common actions
- Keyboard shortcuts (Enter to create)
- Search-as-you-type autocomplete
- Drag-and-drop for pipeline updates

### 5. Scalability
- Interface adapts to data volume
- Multiple contacts don't clutter
- Empty states guide users
- Performance maintained with large datasets

## Key Learnings
1. **Context Menus**: Single `activeMenu` state scales better than multiple `show*` states
2. **Click Handling**: `stopPropagation` only on menu body, global listener for outside clicks
3. **Transactional Edits**: Local state buffer + pending changes object prevents premature saves
4. **Visual Separation**: Border between sections + spacing more effective than background colors alone
5. **Conditional Display**: `{field && (<div>...)}` keeps interface clean and focused
