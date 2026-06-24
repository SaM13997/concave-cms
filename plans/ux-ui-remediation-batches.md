# UX/UI Remediation — Batch Manifest

Date: 2026-06-23
Source plan: `plans/ux-ui-remediation-plan-2026-06-23.md`
Baseline commit: `a0b1585`
Ledger: `plans/ux-ui-remediation-ledger.md`

## Context budget (conservative)

Each implementation batch is sized for a **~100k token** agent window with headroom:

| Reserved for | Est. tokens |
| --- | --- |
| System + skills + tool overhead | 25–35k |
| Drift-check reads + edits + test output | 35–45k |
| Reasoning + retries | 15–25k |
| **Max batch payload** (plan excerpt + primary files) | **~25–35k** |

Rule: one batch = **one primary concern**, **≤4 source files** to read deeply, tests in the same batch only when they fit the same files.

## Batch index

| Batch | Phase | Est. input | Primary files | Prompt file | Depends on |
| --- | --- | --- | --- | --- | --- |
| 1.1 | 1 | ~28k | `schema.tsx` | `plans/batches/1.1-schema-draft-buffer.md` | — |
| 1.2 | 1 | ~18k | `schema.tsx` (select UI) | `plans/batches/1.2-select-options-editor.md` | 1.1 |
| 1.3 | 1 | ~22k | `content.tsx` | `plans/batches/1.3-content-dirty-state.md` | — |
| 1.4 | 1 | ~24k | `ContentEntryEditor.tsx` | `plans/batches/1.4-content-editor-onchange-json.md` | — |
| 1.5 | 1 | ~20k | `ContentEntryEditor` tests | `plans/batches/1.5-content-editor-unit-tests.md` | 1.4 |
| 1.6 | 1 | ~30k | `e2e/schema-builder.spec.ts`, `e2e/content*.spec.ts` | `plans/batches/1.6-phase1-e2e.md` | 1.1–1.5 |
| 2.1 | 2 | ~28k | `contentValidation.ts` | `plans/batches/2.1-compatibility-policy-validation.md` | 1.x |
| 2.2 | 2 | ~24k | `content.ts` | `plans/batches/2.2-content-payload-legacy-keys.md` | 2.1 |
| 2.3 | 2 | ~26k | `schemas.ts` (slug draft) | `plans/batches/2.3-schema-slug-draft-separation.md` | 2.1 |
| 2.4 | 2 | ~32k | `schemas.ts`, `schemaApply.ts` | `plans/batches/2.4-schema-slug-apply-migration.md` | 2.3 |
| 2.5 | 2 | ~26k | `convex/lib/*.test.ts` | `plans/batches/2.5-phase2-unit-tests.md` | 2.1–2.4 |
| 2.6 | 2 | ~28k | E2E content/schema compat | `plans/batches/2.6-phase2-e2e.md` | 2.5 |
| 3.1 | 3 | ~28k | `schemas.ts` (apply states) | `plans/batches/3.1-apply-state-transitions.md` | 2.x |
| 3.2 | 3 | ~20k | `schemas.ts` (getWorking*) | `plans/batches/3.2-working-draft-visibility.md` | 3.1 |
| 3.3 | 3 | ~26k | `schema.tsx` (errors/progress) | `plans/batches/3.3-validation-errors-progress-ui.md` | 3.2 |
| 3.4 | 3 | ~30k | `schema.tsx` (modals) | `plans/batches/3.4-discard-conflict-modals.md` | 3.3 |
| 3.5 | 3 | ~24k | `schema.tsx` (recovery/a11y) | `plans/batches/3.5-network-recovery-aria.md` | 3.4 |
| 3.6 | 3 | ~30k | schema E2E + unit | `plans/batches/3.6-phase3-tests.md` | 3.5 |
| 4.1 | 4 | ~22k | `navigation.ts` | `plans/batches/4.1-primary-navigation.md` | 3.x |
| 4.2 | 4 | ~18k | `index.tsx` | `plans/batches/4.2-dashboard-links.md` | 4.1 |
| 4.3 | 4 | ~26k | `e2e/navigation.spec.ts`, `e2e/rbac.spec.ts` | `plans/batches/4.3-phase4-e2e.md` | 4.2 |
| 5.1 | 5 | ~30k | `media.tsx`, `convex/media.ts` | `plans/batches/5.1-media-surface.md` | 4.x |
| 5.2 | 5 | ~22k | `settings.tsx` | `plans/batches/5.2-settings-exports-honesty.md` | 4.x |
| 5.3 | 5 | ~26k | media/settings E2E + a11y | `plans/batches/5.3-phase5-e2e.md` | 5.1, 5.2 |
| 6.1 | 6 | ~24k | `package.json`, E2E subset | `plans/batches/6.1-verify-critical-e2e.md` | 5.x |
| 6.2 | 6 | ~20k | `docs/agent-testing.md` | `plans/batches/6.2-lint-baseline-docs.md` | 6.1 |

**Total:** 25 implementation batches (+ orchestrator reads ledger only).

## Orchestrator selection algorithm

1. Read `plans/ux-ui-remediation-ledger.md`.
2. If `active_agent` is set and younger than 6h → **exit** (avoid duplicate agents).
3. Pick the **lowest-numbered batch** with status `pending` whose dependencies are all `done`.
4. If a batch is `blocked`, skip to next eligible or exit with ledger note.
5. Spawn **one** cloud agent with the batch prompt file + shared agent rules from `orchestration.md`.
6. Set ledger `active_agent` before spawn; agent clears it when done.

## Shared verification (all batches)

```bash
bun run test                    # required every batch
bun run check                   # informational; note pre-existing Biome failures
# E2E only when batch prompt says so:
bun run test:e2e -- e2e/<spec>.spec.ts
```

Never run `scripts/e2e-server.sh` directly — see `docs/agent-testing.md`.

## STOP → ledger

If a batch hits a STOP condition from the source plan, set batch status to `blocked`, record reason in ledger, do **not** spawn the next batch in that phase until a human clears it.
