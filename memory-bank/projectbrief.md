# Project Brief: srm-new

## Core Mission
Create a **ТОЧНУЮ КОПИЮ amoCRM** - complete CRM platform clone with Next.js 15, PostgreSQL, and modern web technologies.

## Primary Goal
Build a fully functional CRM system that replicates amoCRM's core features:
- Deal management with Kanban board
- Contact and company management
- Task tracking
- Activity history
- Multi-entity relationships

## Key Requirements
1. **Exact amoCRM Clone**: UI/UX must match amoCRM patterns and behavior
2. **Data Integrity**: All changes require explicit save confirmation
3. **Relationship Management**: Support for many-to-many relationships (deals-contacts)
4. **Real-time Updates**: Immediate feedback but transactional saves
5. **Visual Clarity**: Clear section separation and intuitive interfaces

## Scope
**In Scope:**
- Deal pipeline management (Kanban)
- Contact/company CRUD with relationships
- Task management with due dates
- Deal modal with multiple tabs (info, tasks, notes, activity)
- Dashboard with statistics
- Multiple contacts per deal

**Out of Scope (Current Phase):**
- Authentication (placeholder users)
- Email integration
- Advanced reporting
- Mobile apps
- Third-party integrations

## Success Criteria
- Users can manage deals through drag-and-drop Kanban
- All changes protected by save confirmation
- Contact/company autocomplete with inline creation
- Multiple contacts can be linked to single deal
- Visual sections clearly separated in deal modal
- Only filled fields displayed in contact cards

## Technical Constraints
- Next.js 15 with App Router (no Pages Router)
- PostgreSQL as primary database
- No external state management libraries
- Server-side API routes only
- Russian language throughout UI
