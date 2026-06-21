# Schema Export + Apply — Contract Test Plan

**Status:** Planned (Phase 0.3)  
**Owner:** QA  
**Implements in:** Phase 3.3 (export/apply workflow)

This plan defines contract and integration tests for schema export artifacts and the apply workflow. Tests are specified here; implementation follows in Phase 3.

## Scope

| Area | Contract under test |
|------|---------------------|
| Export artifact | Deterministic JSON for same canonical schema |
| Apply workflow | Atomic draft → active promotion |
| Conflict detection | Version mismatch blocks silent overwrite |
| Rollback | Revert restores prior `schemaVersions` snapshot |
| Self-hosted | Apply works without `npx convex deploy` |

## Test layers

### Unit (Phase 3)

- `exportSchemaArtifact(descriptor)` — stable key ordering, no timestamps in payload.
- `validateSchemaDescriptor(descriptor)` — good/bad cases per ADR-001 shape.
- `diffSchemaVersions(a, b)` — structured diff for conflict UI.

### Contract / snapshot (Phase 3.3)

**Goal:** Same input descriptor → byte-identical export (modulo optional `exportedAt` wrapper).

```
Given: active schema descriptor fixture "blog-post.v1.json"
When:  exportSchemaArtifact() called twice
Then:  artifact bodies are deep-equal (excluding envelope metadata)
```

Fixtures directory (planned): `convex/test/fixtures/schemas/`

| Fixture | Purpose |
|---------|---------|
| `minimal.json` | Single text field |
| `blog-post.json` | Rich text + reference |
| `with-relationships.json` | Multiple reference fields |

### Integration (Phase 2.1 foundation → Phase 3 apply)

Run against Convex test harness / `convex-test` or HTTP client with isolated data.

| ID | Scenario | Assert |
|----|----------|--------|
| INT-SA-01 | Create draft schema | Row in `schemas` status=draft |
| INT-SA-02 | Apply valid draft | status=active, `schemaVersions` +1 |
| INT-SA-03 | Apply invalid descriptor | Throws; draft unchanged; no new version |
| INT-SA-04 | Apply with stale baseVersion | Conflict error; draft unchanged |
| INT-SA-05 | Required field missing on entry after apply | N/A until content validation wired (Phase 4) |
| INT-SA-06 | Referential integrity | Reference field `referenceTo` must match active slug |
| INT-SA-07 | Audit on apply | `auditLog` event `schema.apply` |

### E2E (Phase 3.3)

| ID | Flow |
|----|------|
| E2E-SA-01 | Admin builds schema in UI → Apply → success toast |
| E2E-SA-02 | Invalid schema → errors shown; Apply disabled or fails |
| E2E-SA-03 | Simulate conflict → conflict modal → compare path |
| E2E-SA-04 | Export downloads JSON; hash matches API export |

## Schema invariant rules (integration, Phase 2.1)

Implemented in `convex/lib/schemaInvariants.ts` + `schemaInvariants.test.ts`:

1. **Required fields:** `slug`, `name`, `fields` array non-empty for active schemas.
2. **Field slugs:** Unique within descriptor; match `^[a-z][a-z0-9-]*$`.
3. **References:** `type: "reference"` requires `config.referenceTo` matching an active schema slug.
4. **Status:** Only `draft | active | archived` allowed.
5. **Version monotonicity:** `schemaVersions.version` strictly increases per schemaId.

## Determinism requirements for export

Export artifact schema (contract):

```typescript
{
  formatVersion: 1,
  exportedAt: string, // ISO-8601; excluded from snapshot compare
  schemas: Array<{
    slug: string,
    name: string,
    fields: [...],
    descriptorVersion: number,
  }>
}
```

- Keys sorted lexicographically at every object level.
- Arrays sorted by `slug`.
- No Convex internal IDs in export payload.

## CI gates

- Phase 3+: `bun run test` includes contract snapshot suite.
- Export snapshot update requires explicit `bun run test -- -u` in PR with review.
- Failed apply integration tests block merge.

## Test data reset

- E2E: fresh user per spec; schema tables cleared via anonymous Convex deployment per `scripts/e2e-server.sh`.
- Integration: use unique slug prefix per test run (`test-${runId}-*`).

## Traceability

| Launch plan item | Test IDs |
|------------------|----------|
| Phase 0.3 contract tests plan | This document |
| Phase 2.1 schema invariants | INT invariant rules + unit tests |
| Phase 3.1 validation | Unit good/bad cases |
| Phase 3.3 export/apply | Contract snapshot + E2E-SA-* |
