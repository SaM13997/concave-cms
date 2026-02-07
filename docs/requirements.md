# Concave CMS — User Requirements

Source of truth: [`docs/design.md`](./design.md)

## 0) Product framing

### 0.1 Vision (what the product must achieve)

- Concave must provide a Convex-native, headless CMS experience that feels like an integrated interface to the Convex backend (not an external add-on).
- The schema must be the system source of truth, editable either via TypeScript (`schema.ts`) or via a visual UI, and treated as two views of the same logic (“bilingual schema”).
- The system must be reactive by default: content updates must propagate to consuming apps instantly via Convex subscriptions.
- The CMS must operate with a zero-sync architecture (no periodic “sync” job between CMS and DB).

### 0.2 Personas (who the product must serve)

- Developer: defines complex data logic once; avoids manual CMS UI updates and stale content APIs.
- Marketer: can autonomously define content types/structures and publish content without engineering cycles.
- End user: experiences a fast site where content changes feel live.

### 0.3 Success metrics (acceptance targets)

- Schema parity: 100% agreement between visual UI schema and backend database constraints.
- Publish latency: <200ms from clicking “Publish” to content appearing on frontend via Convex subscriptions.
- Onboarding speed: a non-technical user can create a “Blog” content type and publish their first post in <2 minutes.

---

## 1) Phase 1 — Convex-native foundation

### Step 1.1 — Zero-sync + reactive baseline

**User requirements**

- RQ-001: Users must not need to run a manual “sync” between Concave and the database.
- RQ-002: When content is updated in the CMS, consuming applications must receive updates via real-time Convex subscriptions.
- RQ-003: The CMS must present itself as the interface for the database (data management UI directly against Convex).

### Step 1.2 — Schema as source of truth (bilingual schema)

**User requirements**

- RQ-010: Developers must be able to define schema in TypeScript (`schema.ts`).
- RQ-011: Marketers must be able to define the schema via a visual builder UI.
- RQ-012: The system must treat the code schema and visual schema as two representations of the same underlying schema logic.
- RQ-013: The system must maintain strict compatibility with Convex typing constraints.

---

## 2) Phase 2 — Visual Schema Engine (Marketer Mode)

### Step 2.1 — Drag-and-drop schema authoring

**User requirements**

- RQ-100: Marketers must be able to create and modify content structures using a drag-and-drop interface.
- RQ-101: Marketers must be able to add tables (content types/collections) via the UI.
- RQ-102: Marketers must be able to define relationships between tables/content types.

### Step 2.2 — Field types & configuration

**User requirements**

- RQ-110: Marketers must be able to add fields to a table/content type via the UI.
- RQ-111: The UI must support choosing field types including (at minimum) Rich Text, Image, and Reference.
- RQ-112: The UI must map visual field definitions to concrete typed representations compatible with Convex.

### Step 2.3 — Structural guardrails (Convex typing compliance)

**User requirements**

- RQ-120: The visual schema engine must prevent marketers from creating schemas that violate Convex’s strict typing rules.
- RQ-121: When a user attempts an invalid schema change, the system must block the change (or require correction) rather than persisting an invalid schema.

### Step 2.4 — Seamless handover to developers (“lock into code”)

**User requirements**

- RQ-130: Visual schema changes must generate a corresponding configuration representation.
- RQ-131: Developers must be able to “lock” visually created schema changes into code (eventual code ownership) as needed.

---

## 3) Phase 3 — Content lifecycle: Drafts, publishing, preview, history

### Step 3.1 — Shadow drafting (draft vs published in same collection)

**User requirements**

- RQ-200: Every content entry/document must support both a Draft state and a Published state.
- RQ-201: Draft and Published states must exist within the same collection.
- RQ-202: The draft/publish state system must prevent unfinished content from leaking into production.
- RQ-203: Publishing must use Convex transactional atomicity to ensure consistent state transitions.

### Step 3.2 — Preview environments (one-click preview URLs)

**User requirements**

- RQ-210: Marketers must be able to generate preview URLs with one click.
- RQ-211: Preview URLs must allow viewing how a draft appears on the live frontend prior to publishing.

### Step 3.3 — Time travel (version history, diff/compare, revert)

**User requirements**

- RQ-220: Users must be able to view a qualitative history of changes for a content entry.
- RQ-221: Users must be able to compare versions of a content entry.
- RQ-222: Users must be able to revert a content entry to a previous version.

---

## 4) Phase 4 — Admin experience (TanStack Start + shadcn)

### Step 4.1 — High-performance, accessible management dashboard

**User requirements**

- RQ-300: The CMS must provide a management dashboard.
- RQ-301: The dashboard must prioritize high performance.
- RQ-302: The dashboard must be accessible.
- RQ-303: The dashboard UI stack must be compatible with (and intended to leverage) TanStack Start and shadcn.

### Step 4.2 — Fluid navigation

**User requirements**

- RQ-310: Users must be able to navigate between content types and entries with near-instant transitions.
- RQ-311: Navigation must leverage TanStack Start’s router.

### Step 4.3 — Command Center global search (Cmd+K)

**User requirements**

- RQ-320: The dashboard must provide a global search experience invoked via Cmd+K.
- RQ-321: Global search must find content entries.
- RQ-322: Global search must find schema definitions.
- RQ-323: Global search must find media assets.

### Step 4.4 — Contextual feedback (presence + notifications)

**User requirements**

- RQ-330: Users must be able to see real-time presence indicators showing who else is editing the same item.
- RQ-331: The system must provide toast notifications for successful deployments.

---

## 5) Phase 5 — Governance & security (Better Auth)

### Step 5.1 — Identity and session management

**User requirements**

- RQ-400: The system must provide authentication suitable for a CMS admin dashboard.
- RQ-401: Session management must be secure and modern.
- RQ-402: Session management must integrate with TanStack Start middleware.
- RQ-403: Session management must integrate with Convex server-side functions.

### Step 5.2 — Role-based access control (RBAC)

**User requirements**

- RQ-410: The system must support role-based access control.
- RQ-411: Roles must define clear boundaries for actions.
- RQ-412: Editors must be able to change content.
- RQ-413: Only admins must be able to change the schema.

---

## 6) Phase 6 — Operational requirements aligned to success metrics

### Step 6.1 — Schema parity

**User requirements**

- RQ-500: The system must ensure complete agreement between visual schema constraints and backend database constraints.

### Step 6.2 — Publish latency

**User requirements**

- RQ-510: The publish operation must be designed such that content becomes visible on the frontend via Convex subscriptions in under 200ms.

### Step 6.3 — Onboarding speed

**User requirements**

- RQ-520: The system UX must enable a non-technical user to create a “Blog” content type and publish their first post in under 2 minutes.
