# ADR-002: Bilingual Schema Strategy

**Status:** Accepted  
**Date:** 2026-02-07  
**Deciders:** Sole developer  
**Relates to:** ADR-001 (Canonical Schema Representation), ADR-003 (Schema Apply Workflow)

## Context

Concave CMS promises a "bilingual schema" — developers define schema in code (TypeScript), marketers define schema via a visual UI, and both are treated as views of the same underlying logic. This creates a precedence question: when code and UI disagree, who wins?

Three strategies were considered:

**A. Code-first** — `schema.ts` is always canonical. The UI is read-only or generates PRs. Code always wins.

**B. Hybrid** — Both can author. The UI stores drafts independently. An explicit "apply" action merges UI changes into the canonical representation. Conflicts are surfaced and resolved.

**C. UI-first** — The visual builder is canonical. Code is generated from it. Developers can export but not directly author the canonical schema.

## Decision

**Hybrid** — Both code and UI can author schema. The canonical representation (ADR-001) is the single source of truth. Both code and UI produce changes that merge into it.

### How it works

1. **Developers** can define or modify content types via code. A CLI/import tool reads a TypeScript schema definition and upserts the canonical JSON descriptors in Convex.

2. **Marketers** use the visual schema builder to create or modify content types. Changes are saved as **draft schema descriptors** (status: `"draft"`) in Convex.

3. **Apply action** — When a marketer clicks "Apply", the draft is validated and promoted to `"active"`. This is the merge point.

4. **Conflict detection** — If a developer has changed the canonical schema (via code import) since the marketer started editing, the apply action detects the version mismatch and surfaces the conflict. The marketer must review and resolve before applying.

5. **Lock mechanism** — An admin can "lock" a content type, preventing UI edits (e.g. after a developer has taken ownership of a complex type in code). Locked types are visible in the UI but read-only.

### Precedence rules

| Scenario | Resolution |
|----------|-----------|
| Developer imports schema, no UI draft exists | Code wins (canonical updated) |
| Marketer applies draft, no code conflict | UI draft wins (becomes canonical) |
| Both changed since last sync | Conflict surfaced; marketer must resolve |
| Content type is locked | Code-only; UI is read-only |

## Rationale

1. **Matches the "two views" philosophy.** Neither code nor UI is inherently superior — they're different interfaces to the same data.

2. **Practical for a sole developer.** The developer can use code for complex types and the UI for quick iterations, without one overriding the other.

3. **Explicit merge avoids silent data loss.** Unlike code-first (where UI changes could be overwritten on next deploy) or UI-first (where code changes are ignored), hybrid requires an explicit action to merge.

4. **Scales to teams later.** If the project grows to have both developers and marketers, the hybrid model already handles the collaboration boundary.

## Consequences

### Positive
- Maximum flexibility: use whichever interface suits the task.
- Conflict detection prevents surprises.
- Lock mechanism gives developers escape hatch for complex schemas.

### Negative
- More complex than pure code-first or UI-first.
- Conflict resolution UI needs to be built (Phase 3).
- Two authoring paths means more testing surface.

### Risks
- If the code import tool is rarely used, it may rot. Mitigation: the visual builder is the primary path; code import is a power-user feature built later.
- Conflict resolution UX must be clear enough for non-technical users. Mitigation: design it as a simple "your version vs current version" comparison, not a git-style merge.

## Alternatives Considered

### Code-first
- **Pro:** Simple mental model; familiar to developers.
- **Con:** Defeats the marketer autonomy goal (RQ-011, RQ-100). Non-technical users can't iterate without developer involvement.
- **Rejected** because it undermines the core CMS value proposition.

### UI-first
- **Pro:** Simple for marketers; no conflict possible.
- **Con:** Developers lose the ability to define complex schemas in code (e.g. computed fields, custom validators). Export-only code is less useful than import.
- **Rejected** because it limits developer workflows unnecessarily.
