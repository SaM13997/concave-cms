# ADR-001: Canonical Schema Representation

**Status:** Accepted  
**Date:** 2026-02-07  
**Deciders:** Sole developer  
**Relates to:** ADR-002 (Bilingual Schema Strategy), ADR-003 (Schema Apply Workflow)

## Context

Concave CMS needs a way to store content type definitions (tables, fields, relationships, constraints). These definitions drive:

1. The visual schema builder UI (Marketer Mode)
2. The content entry editor (field rendering, validation)
3. Content CRUD mutations (field-level validation, references)
4. The "bilingual schema" promise (code ↔ UI parity)

Two broad approaches exist:

**A. Normalized Convex tables** — A `contentTypes` table, a `fields` table with foreign keys, a `relationships` table, etc. Each entity is a row. Changes are individual mutations.

**B. JSON schema descriptors** — A single `schemas` table where each row holds a complete content type definition as a structured JSON object (validated by Zod). The entire type definition is one document.

## Decision

**JSON schema descriptors** stored in a Convex `schemas` table.

Each content type is a single document containing:

```typescript
{
  // Identity
  slug: string,           // e.g. "blog-post"
  name: string,           // e.g. "Blog Post"

  // Schema definition (the descriptor)
  fields: Array<{
    slug: string,          // e.g. "title"
    name: string,          // e.g. "Title"
    type: FieldType,       // "text" | "richtext" | "number" | "boolean" | "image" | "reference" | "date" | "select" | "json"
    required: boolean,
    config: Record<string, unknown>,  // type-specific config (e.g. { referenceTo: "author" } for references)
  }>,

  // Metadata
  version: number,        // auto-incremented on each change
  status: "draft" | "active" | "archived",
  createdAt: number,
  updatedAt: number,
}
```

## Rationale

1. **Required by runtime-generic approach (ADR-003).** Since schema changes don't trigger a Convex deploy, the schema must be data (queryable at runtime), not code.

2. **Atomic content type operations.** A content type definition is a cohesive unit — reading, validating, or updating it should be one operation, not a multi-table join. Convex mutations are transactional per-document, so a single document = atomic schema updates.

3. **Simpler diffing and versioning.** Comparing two schema versions is a JSON diff, not a multi-table reconciliation. This directly supports time travel for schema changes.

4. **Matches the mental model.** A "Blog Post" content type with its fields is conceptually one thing. Storing it as one document reflects that.

5. **Convex-friendly.** Convex documents are schemaless JSON by default. Storing structured JSON descriptors is idiomatic. Validation happens at the application layer via Zod.

## Consequences

### Positive
- Content type CRUD is simple: one read, one write.
- Schema validation is a pure function (Zod parse on the descriptor).
- Version history is straightforward (snapshot the descriptor on each change).
- The visual builder works directly against this structure.

### Negative
- Cross-type queries (e.g. "find all fields of type `reference`") require scanning all schema documents rather than a simple table query. Acceptable at CMS scale (dozens of content types, not thousands).
- Field-level permissions (e.g. "lock field X") would need to be encoded within the JSON rather than as row-level constraints. Not currently a requirement.

### Risks
- Schema descriptor shape must be versioned carefully if the CMS itself evolves. Mitigation: include a `descriptorVersion` field for forward compatibility.

## Alternatives Considered

### Normalized tables
- **Pro:** Relational queries on fields/relationships; familiar RDBMS pattern.
- **Con:** Convex is not relational — joins are manual. Multi-document transactions add complexity. Doesn't align with runtime-generic (ADR-003) as naturally.
- **Rejected** because it fights Convex's document model and adds unnecessary complexity for the expected scale.
