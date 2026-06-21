# Schema Apply UX Contract

**Status:** Accepted (Phase 0.3)  
**Relates to:** [ADR-002](./adr/002-bilingual-schema-strategy.md), [ADR-003](./adr/003-schema-apply-workflow.md)

This document defines the user-facing contract for schema changes in Concave CMS: draft → validate → apply, plus failure and rollback messaging. Implementation lands in Phase 3; this contract is the constraint for that work.

## Goals

- Marketers can change schema without deploys (runtime-generic, ADR-003).
- Invalid changes are blocked with actionable errors before they affect content.
- Conflicts between UI drafts and code/canonical state are surfaced explicitly (ADR-002 hybrid).
- Failures never leave the system in a half-applied state without clear recovery steps.

## States

| State | Meaning | User-visible label |
|-------|---------|-------------------|
| `draft` | Editable in schema builder; not used for content validation | Draft |
| `validating` | Client requested apply; server running validation | Validating… |
| `active` | Canonical schema; drives content validation | Active |
| `archived` | Retired type; no new entries | Archived |
| `apply_failed` | Last apply attempt failed; draft unchanged | Apply failed |

Transitions:

```
draft ──(Save draft)──► draft
draft ──(Apply)──► validating ──(success)──► active
validating ──(validation error)──► draft (+ errors)
validating ──(conflict)──► draft (+ conflict UI)
validating ──(server error)──► apply_failed
apply_failed ──(Retry / Edit)──► draft
active ──(new draft from active)──► draft
```

## Draft → validate → apply flow

### 1. Draft editing

- All schema builder edits auto-save to **draft** status (debounced).
- UI shows badge: **Draft** (not yet applied).
- Banner when draft differs from active: “You have unpublished schema changes.”
- **Discard draft** restores draft from last active snapshot (confirmation modal).

### 2. Validate (inline + on apply)

- Inline validation runs on field/table edits (Phase 3).
- **Apply** runs full server validation before promotion:
  - Descriptor shape (Zod)
  - Required fields present
  - Reference targets exist and are active
  - No destructive changes without explicit confirmation (e.g. delete field with data)

Validation errors map to controls:

| Error code | UX |
|------------|-----|
| `FIELD_REQUIRED` | Highlight field row; message under control |
| `INVALID_TYPE` | Highlight type selector |
| `DUPLICATE_SLUG` | Highlight slug input |
| `REFERENCE_TARGET_MISSING` | Highlight relationship picker |
| `DESTRUCTIVE_CHANGE` | Modal with impact summary + confirm |

### 3. Apply

- Primary action: **Apply schema** (admin only).
- Progress states:
  1. **Validating schema…** (spinner, disable navigation away or show blocker)
  2. **Applying changes…** (atomic promotion draft → active)
  3. **Done** — toast: “Schema applied. Content types updated.”

On success:

- Draft promoted to `active`.
- Previous active version stored in `schemaVersions`.
- Audit event: `schema.apply`.
- Content mutations immediately use new descriptor (runtime-generic).

## Failure messaging

### Validation failure

- **Title:** “Schema could not be applied”
- **Body:** List of errors with links to affected controls.
- **Actions:** Fix issues (stay on builder), Discard draft, Cancel.
- Do not clear draft data.

### Version conflict (bilingual)

When canonical version changed since draft started (ADR-002):

- **Title:** “Schema changed elsewhere”
- **Body:** “The active schema was updated while you were editing. Review differences before applying.”
- **Actions:**
  - **Compare** — side-by-side draft vs current active
  - **Use current** — discard draft, load active
  - **Overwrite** — admin-only; apply draft anyway (second confirmation)

### Server / network failure

- **Title:** “Apply interrupted”
- **Body:** “Changes were not applied. Your draft is saved.”
- **Actions:** Retry apply, Copy error ID (support), Cancel.
- State: `apply_failed` until user retries or edits.

### Partial failure (must not occur)

Apply is **all-or-nothing**. If the UI shows partial success, that is a bug. Messaging if detected:

- **Title:** “Unexpected error”
- **Body:** “Schema may be inconsistent. Contact support with error ID.”
- Link to audit log (admin).

## Rollback messaging

Rollback is not automatic on apply failure (draft is never promoted). For explicit rollback of an **already applied** version (Phase 6):

- **Title:** “Revert schema version?”
- **Body:** Impact summary (fields added/removed, affected entry counts if known).
- **Confirm:** “Revert to version {n}”
- **Success toast:** “Schema reverted to version {n}.”
- **Failure:** “Revert failed. Active schema unchanged.” + audit reference.

## Permissions

| Action | Admin | Editor |
|--------|-------|--------|
| View schema builder | Yes | No |
| Edit draft | Yes | No |
| Apply schema | Yes | No |
| Export schema | Yes | No |
| View apply errors | Yes | No |

Server enforces via `schema:read` / `schema:write`; UI mirrors with disabled/hidden controls.

## Accessibility

- Apply progress announced via `aria-live="polite"`.
- Error list is keyboard-navigable; focus moves to first error on failure.
- Confirmation modals trap focus and support Escape to cancel.

## data-testid conventions (E2E)

| Element | test id |
|---------|---------|
| Apply button | `schema-apply-button` |
| Discard draft | `schema-discard-draft` |
| Validation error list | `schema-validation-errors` |
| Conflict modal | `schema-conflict-modal` |
| Apply progress | `schema-apply-progress` |
| Success toast | `schema-apply-success` |

## Non-goals (this contract)

- Code import CLI UX (Phase 3.3).
- Content entry migration after destructive schema changes (Phase 4+).
- Publish latency instrumentation (Phase 5.3).
