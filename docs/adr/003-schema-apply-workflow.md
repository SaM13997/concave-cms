# ADR-003: Schema Apply Workflow (Runtime-Generic)

**Status:** Accepted  
**Date:** 2026-02-07  
**Deciders:** Sole developer  
**Relates to:** ADR-001 (Canonical Schema Representation), ADR-002 (Bilingual Schema Strategy)

## Context

When a marketer (or developer) changes the schema in Concave CMS, something must happen to make those changes take effect. The question is: does changing the schema require a Convex deployment (`npx convex deploy`), or can it happen at runtime?

Three strategies were considered:

**A. Codegen + deploy** — Schema changes generate a new `convex/schema.ts` and trigger a deploy. Convex's native schema enforcement handles validation. Changes require a deploy cycle.

**B. Hybrid deploy** — Some changes (adding optional fields) happen at runtime; structural changes (new tables, required fields) require a deploy.

**C. Runtime-generic** — Schema changes never require a deploy. A generic data model stores all content. The CMS validates and enforces the schema at the application layer.

## Decision

**Runtime-generic** — Schema changes take effect immediately at runtime. No Convex deploy is needed for schema operations.

### How it works

1. **Generic `entries` table.** All content entries, regardless of content type, are stored in a single `entries` table with a structure like:

   ```typescript
   // convex/schema.ts (deployed once, rarely changes)
   entries: defineTable({
     contentType: v.string(),     // slug of the content type (e.g. "blog-post")
     status: v.union(v.literal("draft"), v.literal("published")),
     data: v.any(),               // the actual content fields (validated at app layer)
     createdBy: v.id("users"),
     updatedBy: v.id("users"),
     createdAt: v.number(),
     updatedAt: v.number(),
     publishedAt: v.optional(v.number()),
   })
     .index("by_contentType", ["contentType"])
     .index("by_contentType_status", ["contentType", "status"])
     .index("by_createdAt", ["createdAt"]),
   ```

2. **Application-layer validation.** When a mutation creates or updates an entry, it:
   - Reads the canonical schema descriptor (ADR-001) for the entry's content type
   - Validates the `data` field against the descriptor using Zod schemas generated from the descriptor at runtime
   - Rejects invalid data with structured errors

3. **Schema changes are instant.** Updating a schema descriptor in the `schemas` table takes effect immediately — the next mutation or query uses the updated descriptor.

4. **Convex `schema.ts` is static.** The Convex schema file defines only the system tables (`schemas`, `entries`, `media`, `auditLog`, `presence`, `users`, etc.). It is deployed once during initial setup and only changes when the CMS system itself evolves (not when content types change).

## Rationale

1. **Self-hosted simplicity.** The user chose self-hosted deployment. Requiring `npx convex deploy` for every schema change adds operational complexity, CI/CD coupling, and potential downtime. Runtime-generic eliminates this entirely.

2. **Marketer autonomy.** A non-technical user can create a content type and start publishing immediately, without waiting for a deploy pipeline. This directly supports the <2 minute onboarding metric (RQ-520).

3. **Matches the CMS mental model.** In WordPress, Strapi, or any CMS, adding a new content type doesn't require redeploying the application. Users expect this behavior.

4. **Enables the hybrid bilingual strategy (ADR-002).** Since both code and UI can author schema, requiring a deploy for every change would create friction for the UI path. Runtime-generic treats both paths equally.

5. **Convex supports it.** Convex's `v.any()` type is valid and documents can store arbitrary JSON. The tradeoff is moving validation to the application layer, which is acceptable for a CMS where the schema is user-defined by nature.

## Consequences

### Positive
- Zero-downtime schema changes.
- No CI/CD pipeline required for content type management.
- Instant feedback loop for marketers.
- Single deploy for the entire CMS lifecycle (until CMS system tables change).

### Negative
- **No Convex-native schema enforcement on the `data` field.** Convex won't reject malformed entries at the database level — the CMS application layer must catch everything. This is the primary tradeoff.
- **Indexes are generic, not type-specific.** You can't create a Convex index on `data.title` for a specific content type. All filtering on content fields happens at the application layer after fetching by `contentType`.
- **`v.any()` in schema.** This is intentional and scoped to the `data` field only. System fields (`contentType`, `status`, timestamps) are strictly typed.

### Mitigations
- **Validation layer is mandatory, not optional.** Every mutation that touches `entries.data` MUST validate against the schema descriptor. This is enforced by a shared validation function that mutations call — not by individual mutation authors remembering to validate.
- **Convex search indexes** can be used for full-text search across content without needing field-specific indexes.
- **Periodic consistency checks** (a Convex cron job) can scan entries against their current schema descriptor and flag orphaned or invalid data.

### Risks
- If the validation layer has a bug, invalid data can enter the database. Mitigation: comprehensive unit tests for the schema-to-Zod conversion and validation pipeline.
- Query performance for large content sets filtered by content fields may be slower than native indexes. Mitigation: for the expected scale (CMS, not analytics), this is unlikely to be a bottleneck. If it becomes one, Convex text search or computed fields can help.

## Alternatives Considered

### Codegen + deploy
- **Pro:** Full Convex schema enforcement; type-specific indexes; compile-time safety.
- **Con:** Every schema change requires a deploy. Blocks marketer autonomy. Incompatible with <2 min onboarding target.
- **Rejected** because deploy-per-change is too heavy for a CMS workflow.

### Hybrid deploy
- **Pro:** Gets the best of both — simple changes are instant, structural changes get DB enforcement.
- **Con:** Complex to implement (must classify which changes need a deploy). Confusing UX ("why does adding this field require a deploy but that one doesn't?"). Still has deploy friction for significant changes.
- **Rejected** because the classification complexity doesn't justify the partial benefit, and it creates an inconsistent user experience.
