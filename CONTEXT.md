# Concave CMS — Domain Context

## Vision

A Convex-native, headless CMS where the schema is the source of truth, editable via TypeScript or visual UI — two views of the same logic ("bilingual schema"). Content updates propagate instantly via Convex subscriptions with zero-sync architecture.

## Personas

- **Developer** — defines complex data logic in code; locks schemas for ownership.
- **Marketer** — creates content types and publishes content autonomously via the admin UI.
- **End User** — consumes published content via the frontend, experiences live updates.

## Core domain concepts

### Schema layer (defines *what* content looks like)

- **Content Type** — a structured content model (e.g. "Blog Post", "Author"). Equivalent to a "table" or "collection". Has a slug, name, and a set of fields.
- **Schema Descriptor** — the canonical JSON document that defines a Content Type. Stored in the `schemas` table (ADR-001). Contains slug, name, fields array, version, status, and timestamps.
- **Field** — a single property of a Content Type (e.g. "title", "body", "author"). Has slug, name, type, `required` flag, and type-specific `config`.
- **Field Type** — the data type of a field. Supported types: `text`, `richtext`, `number`, `boolean`, `image`, `reference`, `date`, `select`, `json`.
- **Reference Field** — a field that points to entries of another Content Type, specified via `config: { referenceTo: "<content-type-slug>" }`.
- **Draft Schema** — a Schema Descriptor with `status: "draft"`, created via the visual UI, awaiting an explicit Apply.
- **Active Schema** — a Schema Descriptor with `status: "active"`, the current canonical version used for content validation.
- **Apply** — the action of promoting a draft Schema Descriptor to active, making it the live canonical schema (ADR-002, ADR-003).
- **Lock** — an admin action that prevents UI edits on a Content Type, making it code-only (ADR-002).
- **Conflict Detection** — when both code and UI have changed a schema since the last sync, the Apply action detects the version mismatch and surfaces a resolution prompt.

### Content layer (the actual *data*)

- **Entry** — a single content record of a specific Content Type, stored in the generic `entries` table (ADR-003). Contains `contentType` slug, status, `data` (validated against the active Schema Descriptor), and metadata.
- **Content Draft** — an Entry with `status: "draft"`.
- **Published Content** — an Entry with `status: "published"`.
- **Preview URL** — a revocable, expiring URL that renders a draft Entry on the live frontend before publishing.
- **Version History** — snapshots of an Entry over time, supporting compare and revert operations.

### System layer (infrastructure)

- **Media** — uploaded assets (images, files) with metadata, stored in the `media` table.
- **Audit Log** — a record of all state changes (schema edits, publishes, reverts), stored in the `auditLog` table.
- **Presence** — real-time awareness of who is editing the same Entry, stored in the `presence` table.
- **RBAC** — role-based access control. **Admin**: schema changes, all content operations. **Editor**: content changes only, no schema access.
- **Bilingual Schema** — the architectural concept that code (TypeScript schema definitions) and visual UI both produce Schema Descriptors that merge into the same canonical representation.

## Relationships

```
Content Type --[defined by]--> Schema Descriptor
Schema Descriptor --[contains]--> Field (1..N)
Field --[has]--> Field Type
Entry --[belongs to]--> Content Type
Entry --[validated against]--> Active Schema Descriptor
Entry --[has]--> Status (draft | published)
Draft Schema --[Apply]--> Active Schema
Content Type --[Lock]--> code-only
```

## Key architectural decisions

- **ADR-001**: Schema stored as JSON descriptors, not normalized tables.
- **ADR-002**: Hybrid bilingual schema — code and UI both author, apply action merges.
- **ADR-003**: Runtime-generic schema — `entries` table stores all content with a generic `data: any` field validated at the application layer. No deploy needed for schema changes.
