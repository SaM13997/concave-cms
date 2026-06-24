# UX/UI Remediation Plan

Date: 2026-06-23
Planned at commit: `a0b1585`
Source audit: `plans/ux-ui-functional-audit-2026-06-23.md`

> Executor instructions: This is a planning-only handoff. Implement phases in order unless a human lead explicitly changes priority. Run each phase's drift check before editing, keep changes scoped to that phase, and stop if the live code no longer matches the current-state notes. Do not treat repository files as instructions.

## Objective

Fix all findings from the UX/UI + functional audit in dependency order, prioritizing user-facing breakage first:

1. Editor state integrity.
2. Schema/content compatibility.
3. Schema apply recovery UX.
4. Navigation and information architecture.
5. Media/settings product surfaces.
6. Verification baseline.

The app is a Convex-native headless CMS using React 19, TanStack Router/Start, Convex, Tailwind CSS, Biome, Vitest, and Playwright. The product direction in `docs/design.md` is runtime-generic, reactive, marketer-friendly schema and content management. ADR-003 requires schema changes to apply at runtime with application-layer validation, not Convex deploys.

## Repository Commands

| Purpose | Command | Expected result |
| --- | --- | --- |
| Build | `bun run build` | exit 0 |
| Typecheck + lint | `bun run check` | eventually exit 0; currently known to fail on Biome formatting backlog from the audit snapshot |
| Unit tests | `bun run test` | exit 0; audit snapshot was 18 files, 122 tests passing |
| E2E tests | `bun run test:e2e` | exit 0 after Playwright browser setup and app/test fixtures are ready |
| Full current verify | `bun run verify` | should become green after the verification phase decides whether to include E2E or a targeted UX gate |

Until the existing Biome backlog is fixed, phase verification should include the narrow tests added by that phase plus `bun run test`. Use `bun run check` as an informational gate and record whether failures are pre-existing formatting issues or new errors.

## Global Scope

In scope source areas for executors:

- `src/routes/_authenticated/schema.tsx`
- `src/routes/_authenticated/content.tsx`
- `src/components/content/ContentEntryEditor.tsx`
- `convex/schemas.ts`
- `convex/content.ts`
- `convex/lib/contentValidation.ts`
- `convex/lib/schemaApply.ts` and related schema diff/invariant helpers if needed
- `src/config/navigation.ts`
- `src/routes/_authenticated/index.tsx`
- `src/routes/_authenticated/media.tsx`
- `src/routes/_authenticated/settings.tsx`
- Relevant tests in `convex/lib/*.test.ts`, `src/**/*.test.ts(x)`, and `e2e/*.spec.ts`
- `package.json` only during the verification-baseline phase

Out of scope unless a human lead approves:

- Replacing the runtime-generic architecture with generated Convex schemas.
- Large visual redesign unrelated to the audited breakage.
- Authentication/role model changes beyond hiding or gating navigation correctly.
- Bulk cleanup of all Biome backlog unless it is required to make `bun run check` meaningful.

## Current State Summary

- `src/routes/_authenticated/schema.tsx:70-77` reads live builder state and mutations from Convex. `handleFieldChange` at lines 162-173 sends every field edit directly through `updateField`.
- `src/routes/_authenticated/schema.tsx:442-501` renders field name, slug, type, reference config, and required controls directly from `selectedTable.fields`.
- `src/routes/_authenticated/content.tsx:136-168` loads `selectedEntry` from a live query and unconditionally copies `selectedEntry.title` and `selectedEntry.data` into local edit state whenever the query changes.
- `src/components/content/ContentEntryEditor.tsx:245-253` controls JSON text from `JSON.stringify(value)` and ignores parse failures, which prevents typing temporarily invalid JSON.
- `src/components/content/ContentEntryEditor.tsx:290` merges changes from render-time `data` with `{ ...data, [field.slug]: value }`, which can clobber rapid consecutive edits.
- `convex/schemas.ts:44-55` only reads `draftFields`/`draftName` when schema status is `active`, so `apply_failed` can fall back to stale active data.
- `convex/schemas.ts:397-405` allows an active schema slug to be patched while editing, before successful apply.
- `convex/schemas.ts:702-705` patches validation failures to `status: "apply_failed"` even though the UX contract says validation failure returns to draft with errors.
- `convex/content.ts:189-210` returns full stored `entry.data` alongside current active `schemaFields`.
- `convex/lib/contentValidation.ts:196-204` rejects unknown stored data keys as `UNKNOWN_FIELD`.
- `src/config/navigation.ts:14-70` gives bottom-nav slots to Audit, Settings, Debug, and Live but not Media.
- `src/routes/_authenticated/index.tsx:50-68` uses raw anchors for dashboard cards instead of TanStack Router `Link`.
- `src/routes/_authenticated/media.tsx:43-64` is only an empty state or flat filename list.
- `src/routes/_authenticated/settings.tsx:40-55` is an admin-only exports page despite navigation and dashboard copy presenting it as general settings.

## Phase 1: Stabilize Editor State Integrity

Priority: P0
Effort: L
Risk: Medium
Dependencies: none

Why this matters: The schema builder and content editor are the highest-frequency editing surfaces. If typing is network-shaped or live queries overwrite local changes, users experience dropped characters, stale merges, and possible data loss.

Drift check:

`git diff --stat a0b1585..HEAD -- src/routes/_authenticated/schema.tsx src/routes/_authenticated/content.tsx src/components/content/ContentEntryEditor.tsx`

Checklist:

- [ ] Add a local draft buffer for schema field rows in `src/routes/_authenticated/schema.tsx` so text inputs update synchronously while persistence is debounced or committed on blur/submit.
- [ ] Keep server mutation errors visible without replacing the user's in-progress input with stale query data.
- [ ] Ensure field identity is stable when editing slugs. Prefer an immutable field id if the schema model already has one; if not, treat slug editing as a risky subtask and avoid using the in-progress slug as the React key while the row is being edited.
- [ ] Add a select-field options editor in the schema builder when `field.type === "select"` so required select fields can be configured before use.
- [ ] In `src/routes/_authenticated/content.tsx`, rehydrate `editTitle` and `editData` only when the selected entry id changes, when there are no dirty local edits, or after a successful save/discard. Do not overwrite dirty local state on ordinary Convex query refreshes.
- [ ] Change `ContentEntryEditor` so field changes use a functional update shape. If the current `onChange` prop only accepts an object, update it to accept either a next object or an updater callback, then call it with `prev => ({ ...prev, [field.slug]: value })`.
- [ ] Split JSON editor display text from parsed JSON value. Store raw textarea text locally, show inline parse errors for invalid JSON, and only call parent `onChange` when parsing succeeds.
- [ ] Keep all existing field types working: text, richtext, number, boolean, date, select, json, image, reference.

Tests to add or update:

- [ ] Component/unit coverage for `ContentEntryEditor` proving rapid edits to two fields preserve both values.
- [ ] Component/unit coverage for JSON fields proving invalid intermediate text remains visible and does not call `onChange` until valid JSON is entered.
- [ ] E2E coverage in `e2e/schema-builder.spec.ts` for fast typing in field name/slug without dropped characters.
- [ ] E2E coverage in `e2e/content.spec.ts` or `e2e/content-publish.spec.ts` for local edits surviving a query refresh or non-selected-entry list update.
- [ ] E2E coverage for configuring select options in schema builder and filling a required select field in content editing.

Verification:

- [ ] `bun run test` exits 0.
- [ ] Targeted Playwright specs for schema builder and content editing exit 0.
- [ ] `bun run check` has no new TypeScript errors; any Biome failures are confirmed pre-existing or fixed.
- [ ] Manual smoke: type quickly in schema field name/slug and content fields; no snap-back or lost characters.

STOP conditions:

- The schema field model cannot support stable field identity without a backend migration. Stop and split that migration into a separate plan.
- Dirty-state protection requires changing content history or publish semantics. Stop and get product review.

## Phase 2: Fix Schema/Content Compatibility

Priority: P0
Effort: L
Risk: High
Dependencies: Phase 1

Why this matters: Destructive schema changes can make existing entries unsavable, and slug edits can orphan content because entries store `contentType` as a plain string. This is functional breakage, not polish.

Drift check:

`git diff --stat a0b1585..HEAD -- convex/schemas.ts convex/content.ts convex/lib/contentValidation.ts convex/lib/schemaApply.ts convex/lib/schema*.test.ts src/routes/_authenticated/content.tsx src/routes/_authenticated/schema.tsx`

Checklist:

- [ ] Decide and document the compatibility policy before coding: either strip legacy unknown keys from edit payloads, tolerate stored unknown keys during validation while preserving them, or expose a migration/cleanup action. Prefer preserving data while validating only active fields for normal content saves.
- [ ] Update `convex/content.ts` and/or `convex/lib/contentValidation.ts` so hidden legacy fields from deleted/renamed schema fields do not make normal edits unsavable.
- [ ] Ensure content updates only submit current editable schema fields unless the chosen policy intentionally preserves legacy keys.
- [ ] Add explicit UX messaging for entries with legacy/orphaned fields if data is preserved but hidden.
- [ ] Prevent active schema slug changes from taking effect before successful apply. Active schemas should keep their current slug while draft slug changes are stored separately.
- [ ] Extend schema apply planning so slug changes are validated as a destructive or compatibility-sensitive operation before promotion.
- [ ] On successful schema slug apply, either migrate affected `contentEntries.contentType` values atomically or block slug changes until a dedicated migration path exists.
- [ ] Ensure queries by content type continue to find existing entries after approved slug changes.

Risky migration callouts:

- Legacy field cleanup: Do not delete unknown keys from stored `entry.data` silently. Silent cleanup risks irreversible data loss. If cleanup is needed, create an explicit admin-reviewed migration with entry counts, backup guidance, and rollback notes.
- Schema slug handling: Changing a schema slug affects `contentEntries.contentType`, content list queries, audit resource identifiers, references, preview URLs, and possibly export/import payloads. Treat slug apply as a migration, not a simple field rename.

Tests to add or update:

- [ ] Unit tests in `convex/lib/contentValidation.test.ts` for entries containing unknown legacy keys: normal update behavior matches the chosen policy.
- [ ] Unit/integration tests in schema apply tests for field deletion/rename with existing data.
- [ ] Unit/integration tests for schema slug draft edits: active content remains queryable before apply.
- [ ] Unit/integration tests for successful or blocked schema slug apply.
- [ ] E2E coverage for editing and saving an entry after a field has been removed from the active schema.

Verification:

- [ ] `bun run test` exits 0.
- [ ] Targeted E2E content/schema compatibility specs exit 0.
- [ ] Manual smoke: create content, remove/rename a field, then edit another field on the same entry without validation failure from hidden data.
- [ ] Manual smoke: attempt schema slug edit; content is not orphaned before or after the operation.

STOP conditions:

- Atomic contentType migration is not feasible within existing Convex mutation limits. Stop and choose an explicit "block slug changes with explanation" release instead.
- The compatibility policy would hide data deletion from admins. Stop for product review.

## Phase 3: Bring Schema Apply Recovery UX Up To Contract

Priority: P1
Effort: L
Risk: Medium-high
Dependencies: Phases 1 and 2

Why this matters: `docs/schema-apply-ux-contract.md` promises draft preservation, actionable validation errors, conflict recovery, and accessible modal behavior. The current flow can hide the draft after failure and does not expose the full recovery path.

Drift check:

`git diff --stat a0b1585..HEAD -- docs/schema-apply-ux-contract.md convex/schemas.ts src/routes/_authenticated/schema.tsx e2e/schema-builder.spec.ts e2e/keyboard.spec.ts`

Checklist:

- [ ] Align server state transitions with the contract: validation failure should return/remain `draft` with errors; server/network interruption may use `apply_failed`; successful apply promotes draft to active.
- [ ] Update `getWorkingFields` and `getWorkingName` so draft data remains visible in all editable recovery states, including `apply_failed` if that state still stores draft fields.
- [ ] Add separate UI progress labels for `Validating schema...` and `Applying changes...`.
- [ ] Preserve and display server validation errors in `data-testid="schema-validation-errors"` with links or buttons that move focus to affected controls.
- [ ] Implement discard draft confirmation using an accessible modal with focus trap and Escape-to-cancel behavior.
- [ ] Expand conflict modal actions to match the contract: Compare, Use current, Overwrite with second confirmation, Cancel. If Compare cannot be built fully in this phase, ship a minimal side-by-side field/name/slug diff and mark richer comparison as follow-up.
- [ ] Add server/network failure recovery UI: Retry apply, Copy error ID when available, Cancel.
- [ ] Add `aria-live="polite"` for apply progress and success/failure announcements.
- [ ] Keep permission behavior consistent: schema apply/edit/export remain admin-only; read-only users should not see enabled mutation controls.

Tests to add or update:

- [ ] Unit tests for schema apply state transitions: validation, conflict, destructive, server/apply_failed, success.
- [ ] E2E tests for validation failure preserving draft fields and focusing first error.
- [ ] E2E tests for discard confirmation modal keyboard behavior.
- [ ] E2E tests for conflict modal actions and Escape behavior.
- [ ] E2E tests for apply progress labels and success toast test ids from the contract.

Verification:

- [ ] `bun run test` exits 0.
- [ ] `bun run test:e2e -- e2e/schema-builder.spec.ts e2e/keyboard.spec.ts` exits 0, or equivalent Playwright filter exits 0.
- [ ] Manual smoke: force validation failure, verify draft remains editable and visible; retry after fixing succeeds.

STOP conditions:

- Server apply currently cannot distinguish validation failure from server interruption reliably. Stop and add a backend result-shape subplan before UI work.
- Implementing Compare requires a large schema diff feature beyond current helpers. Stop after shipping other recovery actions and document Compare as blocked.

## Phase 4: Rework Navigation And Information Architecture

Priority: P1
Effort: M
Risk: Medium
Dependencies: Phases 1-3 can proceed independently, but land this after state/recovery fixes to avoid churn in E2E flows.

Why this matters: The shell currently teaches an internal-tool mental model by promoting Audit, Settings, Debug, and Live over core CMS work. Media is discoverable only from home despite being marketed as a first-class area.

Drift check:

`git diff --stat a0b1585..HEAD -- src/config/navigation.ts src/routes/_authenticated/index.tsx src/routes/_authenticated/media.tsx src/routes/_authenticated/settings.tsx e2e/navigation.spec.ts e2e/rbac.spec.ts`

Checklist:

- [ ] Redefine primary navigation around core CMS jobs: Home, Content, Schema, Media, and a clearly admin-scoped Operations/Settings area if needed.
- [ ] Move Debug, Reactive/Live, and Audit out of permanent bottom navigation unless the current user is an admin and the label makes the operational nature clear.
- [ ] Align required permissions with destination reality. Do not show Settings to users who will immediately hit an admin-only dead end.
- [ ] Replace raw dashboard `<a href>` cards in `src/routes/_authenticated/index.tsx` with TanStack Router `Link` for SPA navigation.
- [ ] Update dashboard card titles/descriptions so they only promise implemented or immediately planned capabilities.
- [ ] Preserve accessible labels, focus order, and existing route test ids where possible.

Tests to add or update:

- [ ] E2E navigation tests proving dashboard cards use client-side navigation and land on the right route.
- [ ] RBAC/navigation tests proving non-admin users do not see admin-only destinations that lead to dead ends.
- [ ] E2E/mobile viewport check for bottom navigation item count and labels.

Verification:

- [ ] `bun run test` exits 0.
- [ ] `bun run test:e2e -- e2e/navigation.spec.ts e2e/rbac.spec.ts` exits 0, or equivalent Playwright filter exits 0.
- [ ] Manual smoke: editor user sees Content and Media but not admin-only operations; admin can still reach audit/debug if retained.

STOP conditions:

- A destination has active users depending on current bottom-nav placement. Stop for product confirmation before removing it.

## Phase 5: Make Media And Settings Honest Product Surfaces

Priority: P2
Effort: M-L
Risk: Medium
Dependencies: Phase 4

Why this matters: The app currently invites users into "Media Library" and "Settings" but those routes do not support the jobs implied by their labels. Either raise them to usable surfaces or narrow the labels so the product does not overpromise.

Drift check:

`git diff --stat a0b1585..HEAD -- src/routes/_authenticated/media.tsx src/routes/_authenticated/settings.tsx convex/media.ts convex/exports.ts e2e/navigation.spec.ts e2e/a11y.spec.ts`

Checklist:

- [ ] For Media, choose a release target: either a usable media library or a clearly labeled read-only asset inventory. Prefer usable library if upload/list/delete APIs already exist.
- [ ] If upload exists or can be completed safely, add upload control, progress/error feedback, image preview/thumbnail where mime type supports it, filename/type/size metadata, empty state action, and basic filter/search.
- [ ] If upload does not exist, rename/copy the page as "Asset inventory" or similar and remove dashboard claims about uploading/organizing until backend support lands.
- [ ] For Settings, either build a real grouped admin settings surface or rename it to "Exports" everywhere it appears.
- [ ] Keep exports available to admins with the current snapshot/download functionality.
- [ ] Ensure non-admin users do not see settings/export affordances they cannot use.
- [ ] Add accessible empty states and loading/error states for both surfaces.

Tests to add or update:

- [ ] E2E media tests for empty state, populated list, selected asset, and upload if implemented.
- [ ] E2E settings/exports tests for admin access and non-admin navigation hiding.
- [ ] A11y checks for media/settings loading, empty, and populated states.

Verification:

- [ ] `bun run test` exits 0.
- [ ] Targeted Playwright specs for media/settings exit 0.
- [ ] Manual smoke: dashboard/nav labels match actual page capability.

STOP conditions:

- Media upload requires storage/security decisions not present in the repo. Stop and choose the honest read-only labeling path.
- Settings requirements expand into tenant, auth, or environment configuration. Stop and split into a product requirements plan.

## Phase 6: Establish A UX Verification Baseline

Priority: P1 for process, execute after Phases 1-5 add coverage
Effort: M
Risk: Low-medium
Dependencies: Phases 1-5

Why this matters: The audit found that `verify` can be green enough without running Playwright, while the most important regressions are workflow-level UX failures. The repo needs a baseline that protects the admin product users actually touch.

Drift check:

`git diff --stat a0b1585..HEAD -- package.json e2e src convex docs/agent-testing.md docs/schema-export-apply-test-plan.md`

Checklist:

- [ ] Decide whether `bun run verify` should include all Playwright tests or a faster critical-path E2E subset.
- [ ] Add a script such as `test:e2e:critical` if full Playwright is too slow for default verification.
- [ ] Include critical E2E coverage for: schema builder fast typing, content editor dirty-state preservation, JSON/select editing, schema apply validation failure, conflict/destructive modals, navigation IA/RBAC, and media/settings route honesty.
- [ ] Document local prerequisites for E2E in `docs/agent-testing.md` or another existing testing doc.
- [ ] Fix or quarantine the known Biome backlog so `bun run check` can become a meaningful gate. If full cleanup is too large, create a separate explicit lint-baseline plan before changing `verify`.
- [ ] Update CI or documented release verification commands if CI config exists.

Verification:

- [ ] `bun run test` exits 0.
- [ ] Critical E2E command exits 0.
- [ ] `bun run verify` exits 0 or has a documented, intentionally temporary exception with an owner and follow-up.
- [ ] New tests fail on the old audited behavior and pass after the fixes.

STOP conditions:

- E2E requires external services or credentials not available in local/CI environments. Stop and document a fixture/test-environment plan first.
- The Biome backlog is too large to clean safely in this phase. Stop after adding a separate lint-baseline follow-up and avoid pretending `verify` is green.

## Recommended Execution Order

1. Phase 1: Editor state integrity.
2. Phase 2: Schema/content compatibility.
3. Phase 3: Schema apply recovery UX.
4. Phase 4: Navigation and IA.
5. Phase 5: Media/settings surfaces.
6. Phase 6: Verification baseline.

Dependency notes:

- Phase 2 should follow Phase 1 because content submit semantics depend on stable local edit state.
- Phase 3 should follow Phase 2 because apply recovery must preserve the correct draft/content compatibility model.
- Phase 5 should follow Phase 4 because page labels and route placement define whether Media/Settings need richer implementation or narrower copy.
- Phase 6 should land after the product fixes so its E2E baseline captures the intended final behavior.

## Cross-Phase Done Criteria

- [ ] Schema builder typing no longer drops characters, snaps back, or persists every keystroke as the only source of truth.
- [ ] Content editor dirty state is preserved across live query refreshes and rapid field edits.
- [ ] JSON fields allow temporarily invalid text while editing and show actionable parse feedback.
- [ ] Select fields can be configured in schema builder and filled in content editor.
- [ ] Validation failure preserves the schema draft and returns actionable errors.
- [ ] Apply failure, conflict, destructive-change, discard, and retry paths match `docs/schema-apply-ux-contract.md` or have documented product-approved exceptions.
- [ ] Deleted/renamed fields do not strand existing entries in an unsavable state.
- [ ] Schema slug changes are blocked or migrated safely; content is not orphaned.
- [ ] Primary navigation emphasizes core CMS jobs and avoids permission dead ends.
- [ ] Media and Settings/Exports labels match actual capability.
- [ ] A default or documented critical verification command protects UX-critical workflows.

## Review Guidance

Reviewers should focus on preservation of user work, data compatibility, and migration safety before visual polish. Any PR that silently drops entry data, changes schema slugs without migrating or blocking content, or weakens application-layer validation violates the runtime-generic architecture in ADR-003 and should not merge.
