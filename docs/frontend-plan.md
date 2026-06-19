# Concave CMS — Frontend Plan (Frontend-Only)

Source: [`docs/launch-plan.md`](./launch-plan.md), [`docs/requirements.md`](./requirements.md)

## Goal

Implement all admin UI routes with production-quality frontend (TanStack Start + shadcn). Use **mock data / local state** where backend APIs are not yet available. Mark blockers explicitly in code and in this doc.

## Stack & Conventions

- **Router**: TanStack Start file-based routes under `src/routes/`
- **UI**: shadcn components in `src/components/ui/`, lucide icons
- **Styling**: Tailwind v4, dark theme (existing)
- **Data**: Prefer Convex hooks when available; otherwise `src/lib/mock/` fixtures + React state
- **Auth UI**: Better Auth client (`authClient`) — gate admin routes in `_authenticated` layout
- **Accessibility**: keyboard nav, focus rings, semantic landmarks, loading/empty/error states
- **Blockers**: Add `// BLOCKER(BE-xxx): ...` comments + `data-blocker` attributes where BE is required

## Route Map

| Route | Page | Phase | Status |
|-------|------|-------|--------|
| `/login` | Login | 1 | Done |
| `/` | Dashboard home | 4 | Done |
| `/_authenticated` | Admin shell (sidebar, Cmd+K) | 7 | Done |
| `/schema` | Schema builder list | 3 | Done |
| `/schema/$tableId` | Table/field editor | 3 | Done |
| `/content` | Content type picker | 4 | Done |
| `/content/$type` | Entries list | 4 | Done |
| `/content/$type/new` | Create entry | 4 | Done |
| `/content/$type/$entryId` | Entry editor (draft/publish/history) | 4–6 | Done |
| `/media` | Media library | 4 | Done |
| `/settings` | Settings hub | 8 | Done |
| `/audit` | Audit log viewer | 8 | Done |
| `/onboarding` | First-run wizard | 9 | Done |

## Shared Components (build once, reuse)

- `AdminShell` — sidebar + header + outlet (`_authenticated.tsx`)
- `CommandPalette` — Cmd+K global search (mock results)
- `PageHeader` — title, breadcrumbs, actions
- `EmptyState`, `LoadingSkeleton`, `ErrorState`
- `DraftPublishBar` — draft/published badges, publish, discard, preview
- `HistoryPanel` — event timeline (mock)
- `PresenceAvatars` — who's editing (mock)
- `RoleGate` — hide admin-only actions for editor role (mock role from session)

## Mock Data Strategy

Create `src/lib/mock/`:

- `schema.ts` — sample Blog/Post tables with fields
- `content.ts` — sample entries per type
- `media.ts` — sample assets
- `search.ts` — Cmd+K grouped results
- `audit.ts` — sample audit events
- `roles.ts` — mock admin/editor from session email domain

Replace mocks incrementally when Convex queries land.

## Backend Blockers (documented)

| ID | Feature | Blocked by |
|----|---------|------------|
| BE-001 | Server RBAC enforcement | Convex auth + role matrix |
| BE-002 | Schema CRUD mutations | Phase 3 BE |
| BE-003 | Content CRUD + references | Phase 4 BE |
| BE-004 | Draft/publish atomicity | Phase 5 BE |
| BE-005 | Preview token URLs | Phase 5 BE |
| BE-006 | Version history / revert | Phase 6 BE |
| BE-007 | Global search API | Phase 7 BE |
| BE-008 | Presence sessions | Phase 7 BE |
| BE-009 | Audit log query | Phase 8 BE |
| BE-010 | Media upload/storage | Phase 4 BE |

## Implementation Order

1. Admin shell + navigation + Cmd+K
2. Dashboard (wire cards to routes)
3. Login polish (redirect, session expired)
4. Schema builder pages
5. Content list + editor pages
6. Media library
7. Settings
8. Audit log
9. Onboarding wizard

## Done Criteria (frontend-only)

- All routes render without errors (`pnpm check` passes)
- Navigation between all pages works
- Empty/loading/error states on every list/detail view
- Draft/publish/history/preview UI present on entry editor (mock actions)
- Cmd+K opens and navigates (mock search)
- Role-gated UI for schema vs content (client-side mock)
- Blockers listed in page UI where actions would call BE
