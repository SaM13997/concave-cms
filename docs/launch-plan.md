# Concave CMS — 0→Launch Plan (Self-hosted)

Source docs:
- Design: [`docs/design.md`](./design.md)
- Requirements: [`docs/requirements.md`](./requirements.md)

This is a **0-to-launch** plan (not MVP). Tasks are grouped into phases and steps.

## Conventions

- Each step is broken into **BE / FE / TEST / OPS** workstreams, intended to be executed in lockstep.
- **Owners** are suggested defaults:
  - **BE**: backend engineer
  - **FE**: frontend engineer
  - **QA**: quality/test engineer
  - **OPS**: release/infra owner
  - **SEC**: security review owner (can be BE/OPS in small teams)
- “Done” criteria are release-grade acceptance checks.

## Testing strategy (applies to all phases)

### Test layers
- **Unit tests**: pure functions (schema validation, diffing, permission checks), deterministic.
- **Integration tests**: Convex functions + data invariants (RBAC at boundaries, atomic publish, preview token checks), run against a test Convex instance or harness.
- **E2E tests (Playwright)**: full user flows in the admin UI (auth, schema builder, content editing, preview, history, search, presence).
- **Performance tests**: publish latency measurement publish→subscription update (p50/p95), plus search latency budgets.
- **Accessibility tests**: automated checks (axe) + keyboard navigation assertions for core routes.
- **Security regression tests**: RBAC bypass attempts, preview token expiry/replay, input validation abuse cases.

### Cross-cutting testing requirements
- All sensitive behavior must be enforced and testable **server-side** (Convex mutations/queries), not only via UI restrictions.
- Tests must be deterministic:
  - isolate test data per run
  - reset DB state between specs
  - avoid time-based flake (use clocks/mocks where possible)
- Use stable selectors for E2E (data-testid) and avoid brittle DOM coupling.

### Minimum release gates
- CI must pass: typecheck, lint, unit, integration, e2e.
- A11y checks must pass on core pages.
- Publish latency benchmark must run and record results (threshold must be enforced or explicitly waived with release note).

## Launch definition (what “done” means)

Launch is achieved when:
- All requirements in `docs/requirements.md` are implemented (or explicitly deferred with rationale).
- RBAC is enforced on the server for all sensitive actions.
- Draft/publish cannot leak drafts to published consumers.
- Preview URLs work and are revocable/expire.
- Version history compare/revert works.
- Cmd+K global search works across content/schema/media.
- Presence indicators work reliably.
- Publish latency is **measured** and meets the target in a staging-like environment.
- Self-hosted install path is documented and validated by a clean-environment smoke test.
- A11y baseline is met for all core admin routes.
- Backup/restore and upgrade/migration story is documented and has at least one verified drill.

## Release checklist (per release candidate)

- [ ] **QA**: Full regression run (unit + integration + e2e) green.
- [ ] **QA**: Publish latency benchmark recorded (p50/p95) and compared to target.
- [ ] **SEC**: RBAC/security regression suite green.
- [ ] **OPS**: Self-hosted install verification run in clean environment.
- [ ] **OPS**: Backup/restore drill run (or last drill date within agreed window).
- [ ] **FE**: A11y checks green and keyboard-only smoke completed.
- [ ] **BE/OPS**: Release notes + upgrade notes written (migrations, breaking changes).
- [ ] **OPS**: Rollback plan validated.

---

## Phase 0 — Bootstrap foundations (repo, tooling, environments)

### Step 0.1 — Repository scaffolding + scripts
- [x] **BE (Owner: BE)**: Decide code organization (monorepo vs single package) and Convex directory layout.
- [x] **FE (Owner: FE)**: Scaffold TanStack Start app with shadcn baseline primitives.
- [x] **TEST (Owner: QA)**: Choose test layers + tooling (unit, integration, e2e) and define test data reset strategy.
- [x] **OPS (Owner: OPS)**: Add scripts for `dev`, `build`, `typecheck`, `lint`, `test` and wire into CI.
  - **Done**: Fresh clone → single command starts dev environment; CI runs all checks.

### Step 0.2 — Configuration and environment management (self-hosted)
- [x] **BE (Owner: BE)**: Define configuration schema (auth secrets, preview secret, Convex config, etc.).
- [x] **FE (Owner: FE)**: Implement environment-aware config loading; show env banner (dev/staging/prod).
- [x] **TEST (Owner: QA)**: Ensure tests do not require manual secrets; use deterministic test secrets.
- [x] **OPS (Owner: OPS)**: Provide `.env.example` + quickstart docs.
  - **Done**: New user can configure and run without reading code.

### Step 0.3 — Core product decisions (unblocker ADRs)
- [x] **BE (Owner: BE)**: Write ADRs for:
  - Canonical schema representation (stored in Convex).
  - Code schema vs UI schema precedence + conflict handling ("bilingual schema").
  - Schema "apply" strategy for self-hosted (e.g., export/codegen/deploy vs runtime-generic models).
- [x] **FE (Owner: FE)**: UX contract for schema changes (draft → validate → apply) and failure/rollback messaging.
- [x] **TEST (Owner: QA)**: Contract tests plan for schema export + apply.
  - **Done**: Decisions are documented and used as constraints in later tasks.

---

## Phase 1 — Authentication, sessions, RBAC (launch gate)

### Step 1.1 — Better Auth integration + session handling
- [x] **BE (Owner: BE)**: Implement session creation/validation; integrate with TanStack Start middleware.
- [x] **BE (Owner: BE)**: Ensure Convex server-side functions can verify identity and reject anonymous access.
- [x] **FE (Owner: FE)**: Login/logout flows; session-expired handling; safe redirect behavior.
- [x] **TEST (Owner: QA)**:
  - [x] Unit: session parsing/validation logic (where applicable).
  - [x] E2E: login, logout, session expiry redirect.
  - **Done**: Anonymous users cannot access admin UI routes or mutations.

### Step 1.2 — RBAC enforced on the server (Admin vs Editor)
- [x] **BE (Owner: BE)**: Define roles and permission matrix.
  - Admin: schema changes
  - Editor: content changes
- [x] **BE (Owner: BE)**: Enforce RBAC at function/mutation boundaries (never UI-only).
- [x] **FE (Owner: FE)**: Role-aware navigation; hide/disable forbidden actions; display “insufficient permissions”.
- [x] **TEST (Owner: QA)**:
  - [x] Integration: RBAC matrix tests for every sensitive mutation.
  - [x] E2E: Editor cannot access schema builder routes/actions; Admin can.
  - **Done**: RBAC bypass attempts fail even if FE is modified.

---

## Phase 2 — Convex-native foundation (system tables + reactive baseline)

### Step 2.1 — System data model (schema/content/media/audit/presence)
- [x] **BE (Owner: BE)**: Create system tables to support:
  - canonical schema definitions + schema versions
  - content entries (draft + published states in same collection)
  - version history/time travel events
  - media assets metadata
  - audit log
  - presence sessions
- [x] **FE (Owner: FE)**: Add internal debug pages to view system tables (non-public).
- [x] **TEST (Owner: QA)**:
  - [x] Integration: schema invariants (required fields, referential integrity rules).
  - **Done**: System model is stable enough to build UI features on top.

### Step 2.2 — Reactive-by-default query patterns
- [x] **BE (Owner: BE)**: Define standard query patterns for list/detail views and permission filtering.
- [x] **FE (Owner: FE)**: Ensure list/detail views are subscription-driven; handle loading and empty states.
- [x] **TEST (Owner: QA)**:
  - [x] E2E: two sessions observe live updates without refresh.
  - **Done**: Demonstrable “no refresh” content updates.

---

## Phase 3 — Visual Schema Engine (Marketer Mode) + guardrails + handover

### Step 3.1 — Canonical schema representation + validation
- [x] **BE (Owner: BE)**: Define schema structure (tables, fields, types, constraints, relationships).
- [x] **BE (Owner: BE)**: Implement validation that rejects invalid schemas with structured, actionable errors.
- [x] **FE (Owner: FE)**: Inline validation UX that maps structured errors to the correct controls.
- [x] **TEST (Owner: QA)**:
  - [x] Unit: schema validation good/bad cases.
  - [x] Integration: schema mutation atomicity (all-or-nothing).
  - **Done**: Invalid schema edits are blocked and explained.

### Step 3.2 — Drag-and-drop schema builder UX
- [x] **BE (Owner: BE)**: Implement mutations to:
  - create/rename/delete tables
  - add/edit/delete fields
  - define relationships/references
  - enforce guardrails for destructive changes
- [x] **FE (Owner: FE)**: Implement schema builder UI (drag/drop), relationship picker, confirmation modals.
- [x] **TEST (Owner: QA)**:
  - [x] E2E: build “Blog” schema via UI.
  - **Done**: Non-technical flow works end-to-end.

### Step 3.3 — “Lock into code” export + self-hosted apply workflow
- [x] **BE (Owner: BE)**: Export schema artifact (machine-readable; deterministic).
- [x] **BE (Owner: BE)**: Implement schema apply workflow consistent with self-hosting (status, rollback).
- [x] **FE (Owner: FE)**: “Export schema” + “Apply schema” UI with progress + failure recovery.
- [x] **TEST (Owner: QA)**:
  - [x] Snapshot/contract: export artifact stable for the same schema.
  - [x] E2E: apply flow works in a test environment.
  - **Done**: Developer handover is clear and testable.

---

## Phase 4 — Content engine (schema-driven CRUD) + core field types

### Step 4.1 — Schema-driven content CRUD
- [x] **BE (Owner: BE)**: CRUD APIs based on canonical schema (list/create/update/read).
- [x] **BE (Owner: BE)**: Relationship resolution for reference fields.
- [x] **FE (Owner: FE)**: Content type switcher; entries list; entry detail editor generated from schema.
- [x] **TEST (Owner: QA)**:
  - [x] Integration: CRUD for multiple types with references.
  - [x] E2E: create/edit entry; live updates appear without refresh.
  - **Done**: Generic content management works across types.

### Step 4.2 — Rich text, images/media, references
- [x] **BE (Owner: BE)**: Define rich text storage/validation; media asset metadata model; reference integrity rules.
- [x] **FE (Owner: FE)**: Rich text editor; image picker/uploader; reference picker.
- [x] **TEST (Owner: QA)**:
  - [x] E2E: create entry containing rich text + image + reference; persists and reloads.
  - **Done**: Required field types work end-to-end.

---

## Phase 5 — Draft/publish lifecycle + preview environments (launch-critical)

### Step 5.1 — Shadow drafting (draft + published)
- [x] **BE (Owner: BE)**: Implement draft/published states in the same collection; prevent leaks.
- [x] **BE (Owner: BE)**: Publish mutation is atomic; includes audit event.
- [x] **FE (Owner: FE)**: Draft/published UX (badges, publish button, discard draft).
- [x] **TEST (Owner: QA)**:
  - [x] Integration: publish atomicity and invariants.
  - [x] E2E: draft edits don’t show in published until publish.
  - **Done**: Draft safety guaranteed by BE.

### Step 5.2 — One-click preview URLs
- [x] **BE (Owner: BE)**: Preview token/URL generation bound to a draft version; expiry + revocation.
- [x] **FE (Owner: FE)**: Copy/open preview; regenerate tokens; clear warnings.
- [x] **TEST (Owner: QA)**:
  - [x] E2E: preview shows draft; published view shows published.
  - **Done**: Marketers can verify draft before publish.

### Step 5.3 — Publish latency instrumentation (<200ms target)
- [x] **BE (Owner: BE)**: Add timing instrumentation around publish and subscriber update.
- [x] **FE (Owner: FE)**: UX handles fast path and slow/failure path gracefully.
- [x] **TEST (Owner: QA)**:
  - [x] Perf: harness measures publish→subscription update latency (p50/p95) in staging-like env.
  - **Done**: Latency target is measurable and met (or explicitly documented with mitigation plan).

---

## Phase 6 — Time travel (history, compare, revert)

### Step 6.1 — Version history capture
- [x] **BE (Owner: BE)**: Persist qualitative history of changes (who/when/what summary).
- [x] **FE (Owner: FE)**: History timeline view for an entry.
- [x] **TEST (Owner: QA)**:
  - [x] Integration: each edit/publish produces expected history event.
  - **Done**: Users can review change history reliably.

### Step 6.2 — Compare + revert
- [x] **BE (Owner: BE)**: Implement compare/diff strategy; revert mutation is atomic + audited.
- [x] **FE (Owner: FE)**: Side-by-side compare UI; revert flow with confirmations.
- [x] **TEST (Owner: QA)**:
  - [x] E2E: revert restores prior version; audit event created.
  - **Done**: Mistakes are recoverable.

---

## Phase 7 — Admin experience (navigation, Cmd+K search, feedback)

### Step 7.1 — Fluid navigation (TanStack Start router)
- [ ] **BE (Owner: BE)**: Optimize queries for fast list/detail navigation.
- [ ] **FE (Owner: FE)**: Route structure, breadcrumbs, keyboard-first navigation.
- [ ] **TEST (Owner: QA)**:
  - [ ] E2E: primary navigation paths; no broken states.
  - **Done**: UI feels fast and coherent.

### Step 7.2 — Command Center (Cmd+K) global search
- [ ] **BE (Owner: BE)**: Search APIs across content/schema/media with RBAC filtering + ranking.
- [ ] **FE (Owner: FE)**: Cmd+K palette UI with grouped results and keyboard navigation.
- [ ] **TEST (Owner: QA)**:
  - [ ] E2E: search finds each entity type; forbidden results never appear.
  - **Done**: Users can jump to anything instantly.

### Step 7.3 — Presence indicators + toast notifications
- [ ] **BE (Owner: BE)**: Presence sessions with expiry; standardized event payloads.
- [ ] **FE (Owner: FE)**: Presence UI and toast UX.
- [ ] **TEST (Owner: QA)**:
  - [ ] E2E: two sessions show presence; disconnect clears.
  - **Done**: Collaboration signals are reliable.

---

## Phase 8 — Launch hardening (security, a11y, ops)

### Step 8.1 — Security hardening
- [ ] **BE (Owner: SEC/BE)**: Rate limiting/abuse controls for auth/publish/schema apply; input validation everywhere.
- [ ] **FE (Owner: FE)**: Safe error messages; no sensitive data leaks.
- [ ] **TEST (Owner: QA)**:
  - [ ] Security regression suite: RBAC bypass, expired preview token, replay attempts, injection-style payloads.
  - **Done**: Common abuse paths are tested and mitigated.

### Step 8.2 — Observability + audit log UI
- [ ] **BE (Owner: BE/OPS)**: Structured logs; correlation IDs; audit log query APIs.
- [ ] **FE (Owner: FE)**: Audit log viewer (filters, drill-down).
- [ ] **TEST (Owner: QA)**:
  - [ ] Smoke: audit events appear for schema changes and publish.
  - **Done**: Operators can debug issues.

### Step 8.3 — Backup/restore + upgrade/migrations (self-hosted requirement)
- [ ] **BE (Owner: OPS/BE)**: Backup/restore scripts and verified restore drill.
- [ ] **BE (Owner: BE)**: Migration strategy for schema/content evolution.
- [ ] **FE (Owner: FE)**: Export tools in UI (at least schema + content snapshot exports).
- [ ] **TEST (Owner: QA)**:
  - [ ] Restore drill: backup → wipe → restore → smoke test passes.
  - **Done**: Users can recover and upgrade safely.

### Step 8.4 — Accessibility baseline
- [ ] **FE (Owner: FE)**: Keyboard nav, focus management, semantics, contrast, empty/loading/error states.
- [ ] **TEST (Owner: QA)**:
  - [ ] Automated a11y checks on core routes.
  - [ ] Keyboard-only E2E for Cmd+K + schema builder.
  - **Done**: Admin UI meets baseline accessibility expectations.

---

## Phase 9 — Self-hosted packaging, docs, and release

### Step 9.1 — Packaging and install verification
- [ ] **OPS (Owner: OPS)**: Provide at least one supported install method (Docker/compose or CLI installer) with documented requirements.
- [ ] **TEST (Owner: QA)**: Clean-environment install smoke test in CI.
  - **Done**: New user can install and run without manual debugging.

### Step 9.2 — Onboarding flow + docs (meet onboarding speed metric)
- [ ] **FE (Owner: FE)**: In-product onboarding path to create Blog + publish first post.
- [ ] **OPS (Owner: OPS)**: Quickstart documentation and troubleshooting.
- [ ] **TEST (Owner: QA)**: E2E onboarding flow with step/time budget.
  - **Done**: Onboarding metric is reproducible.

### Step 9.3 — Release checklist + versioning
- [ ] **OPS (Owner: OPS)**: Versioning (SemVer), changelog, upgrade notes, rollback instructions.
- [ ] **TEST (Owner: QA)**: Release gates require unit + integration + e2e + perf checks.
  - **Done**: “Launch” is a repeatable, gated release.
