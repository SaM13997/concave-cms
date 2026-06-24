# Concave CMS UX/UI + Functional Audit

Date: 2026-06-23
Scope: repo-level audit of `src/`, `convex/`, `docs/`, and test coverage, with parallel read-only subagent review focused on UX/UI and user-visible breakage.

## Verification snapshot

- `bun run test`: passes (`18` files, `122` tests)
- `bun run check`: fails with a large Biome formatting backlog (`105` reported issues), so the default `verify` path is already red for repo-health reasons unrelated to the UX bugs below
- `verify` does **not** exercise Playwright, so a green product-level workflow gate does not currently exist

## Highest-leverage findings

### 1. Schema builder typing is coupled to server round-trips

- Evidence: `src/routes/_authenticated/schema.tsx:162` sends every field edit through `updateField`.
- Evidence: `src/routes/_authenticated/schema.tsx:442-501` renders name/slug/type/required controls directly from `selectedTable.fields`, which comes from the live `builderState` query (`src/routes/_authenticated/schema.tsx:69-70`).
- Impact: fast typing can snap back, drop characters, or show the exact "last character replaced" behavior you called out. The highest-frequency editing surface is effectively network-shaped instead of locally buffered.
- Severity: Critical UX

### 2. Content editing can overwrite in-progress local work

- Evidence: `src/routes/_authenticated/content.tsx:136` loads the selected entry from a live Convex query.
- Evidence: `src/routes/_authenticated/content.tsx:165-166` unconditionally rehydrates `editTitle` and `editData` whenever `selectedEntry` changes.
- Evidence: `src/components/content/ContentEntryEditor.tsx:290` merges field edits from render-time `data` via `{ ...data, [field.slug]: value }`, which is vulnerable to stale merges.
- Impact: local edits can revert when the query refreshes, and quick consecutive field updates can clobber one another.
- Severity: Critical UX / data-loss risk

### 3. Two field editors are currently unusable in realistic workflows

- Evidence: `src/components/content/ContentEntryEditor.tsx:246-250` controls JSON from `JSON.stringify(...)` and ignores parse failures, so transiently invalid JSON cannot be typed.
- Evidence: `src/routes/_authenticated/schema.tsx:462-494` exposes extra config only for `reference`; there is no builder UI for `select` options.
- Evidence: `src/components/content/ContentEntryEditor.tsx:216-230` renders `select` choices from `field.config.options`, defaulting to an empty array.
- Impact: JSON fields exhibit snap-back behavior while typing, and required `select` fields can be created in schema builder but cannot be filled from the content UI.
- Severity: High

### 4. The schema apply flow violates its own UX contract and has a real recovery bug

- Evidence: `convex/schemas.ts:44-51` only reads `draftName` / `draftFields` when schema status is `active`.
- Evidence: `convex/schemas.ts:703` marks validation failure as `status: "apply_failed"`.
- Evidence: `src/routes/_authenticated/schema.tsx:442` renders `selectedTable.fields`, so a failed apply can surface stale active fields instead of the failed draft.
- Evidence: `src/routes/_authenticated/schema.tsx:220-239` shows only a `Validating schema…` state; there is no distinct "Applying changes…" state from the contract.
- Evidence: `src/routes/_authenticated/schema.tsx:385-400`, `570-620` omit discard confirmation, focus trapping, Escape handling, and the full conflict actions promised in `docs/schema-apply-ux-contract.md`.
- Impact: failed apply attempts can hide the draft the user needs to fix, and even the happy-path/failure-path UX is below the accepted product contract for the most sensitive workflow in the app.
- Severity: High

### 5. Destructive schema changes can break existing content end-to-end

- Evidence: `convex/content.ts:189-210` returns editable fields from the current active schema, but also returns the full stored `entry.data`.
- Evidence: `src/routes/_authenticated/content.tsx:165-166` copies the full stored data into local editor state, while `src/routes/_authenticated/content.tsx:454-457` only renders controls for the current schema fields.
- Evidence: `convex/lib/contentValidation.ts` rejects unknown keys, so hidden legacy fields from renamed/deleted schema fields can make entries unsavable.
- Evidence: `convex/schemas.ts:397-405` allows schema slug changes, while content entries store `contentType` as a plain string and are queried by that slug in `convex/content.ts:154-167`.
- Impact: removing/renaming fields can strand existing entries in an unsavable state, and renaming a schema slug can orphan content from the content UI.
- Severity: Critical functional breakage

### 6. Core navigation is miscategorized and teaches the wrong product mental model

- Evidence: `src/config/navigation.ts:14-64` gives permanent bottom-nav space to `Audit`, `Settings`, `Debug`, and `Live`, but not `Media`.
- Evidence: `src/routes/_authenticated/index.tsx:11-34` presents `Media Library` as a top-level dashboard action.
- Evidence: `src/config/navigation.ts:47-60` exposes `Settings` and `Debug` to `schema:read`, while `src/routes/_authenticated/settings.tsx:36-44` and `src/routes/_authenticated/debug/system.tsx:37-39` are effectively admin-only dead ends.
- Evidence: `src/routes/_authenticated/index.tsx:50-51` uses raw `<a href>` cards on the home dashboard instead of SPA navigation.
- Impact: the shell emphasizes internal tools over core CMS work, hides media after leaving home, and sends some users into permission dead ends. Even basic "go from dashboard to a task" navigation is less fluid than the product docs promise.
- Severity: High UX / IA

### 7. Media and settings are present as destinations, but not yet usable as product surfaces

- Evidence: `src/routes/_authenticated/media.tsx:38-56` is only an empty state or flat filename list; there are no upload, preview, filter, or organization affordances.
- Evidence: `src/routes/_authenticated/index.tsx:26-34` markets media and settings as first-class management areas.
- Evidence: `src/routes/_authenticated/settings.tsx:46-80` is effectively an exports page, not a real settings surface.
- Impact: the app looks broader than it actually is. Users are invited into pages that do not yet support the jobs their labels imply.
- Severity: Medium-high UX completeness gap

### 8. The verification story does not protect the shipped UX

- Evidence: `package.json` keeps Playwright in `test:e2e`, while `verify` only runs build/check/unit tests.
- Evidence: UX-critical specs exist in `e2e/onboarding.spec.ts`, `e2e/content-publish.spec.ts`, `e2e/navigation.spec.ts`, and `e2e/keyboard.spec.ts`, but they are outside the default verification path.
- Evidence: current keyboard/schema E2E coverage is mostly happy-path and shallow; it does not pin conflict recovery, failed apply, modal keyboard behavior, or fast-edit state integrity.
- Impact: the repo can look "green enough" while the most important admin workflows regress.
- Severity: High process gap

## Recommended fix order

1. Stabilize local editor state in schema/content editing.
2. Fix schema/content compatibility around failed apply, destructive changes, and slug/field evolution.
3. Bring schema apply UX up to its documented contract.
4. Rework primary navigation and page categorization around core CMS jobs.
5. Raise media/settings from placeholder destinations to usable surfaces, or narrow their labels.
6. Make the verification baseline cover UX-critical workflows.

## Short verdict

The codebase is ahead on backend helpers and unit coverage, but the user-facing admin product is still in a prototype state. The biggest problems are not visual polish; they are state-management flaws, workflow recovery gaps, and information architecture choices that make core tasks feel unreliable.
