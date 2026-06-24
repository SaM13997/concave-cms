# UX/UI Remediation — Batch manifest & selection

> Orchestrator reads this file for the **selection algorithm and manifest only**. Full scope lives in `plans/ux-ui-remediation-plan-2026-06-23.md`.

## Branches

| Role | Branch |
|------|--------|
| Implementation | `dev-agent` |
| Ledger | `cursor/ux-ui-remediation-orchestration-6eea` |

## Selection algorithm

1. If `active_agent` in ledger is set and `started_at` is **< 6 hours ago** → **stop** (agent in flight).
2. If any batch is `blocked` and `human_skip` is not set → **stop** and report blockers.
3. Pick the **lowest** `pending` batch whose **depends_on** entries are all `done` in the manifest below.
4. If none `pending` → remediation **complete**, stop.
5. Orchestrator: `git checkout dev-agent && git pull`
6. Update ledger: batch → `in_progress`, fill `active_agent` (model `composer-2.5`), commit+push orchestration branch.
7. Spawn **one** cloud agent on `dev-agent` with model **`composer-2.5`** (non-fast) and the batch prompt from `plans/batches/`.

## Manifest

| Batch | Depends on | Prompt file | E2E |
|-------|------------|-------------|-----|
| 1.1 | — | `plans/batches/1.1-navigation-consistency.md` | yes |
| 1.2 | 1.1 | `plans/batches/1.2-rbac-nav-alignment.md` | yes |
| 1.3 | 1.1 | `plans/batches/1.3-shared-page-layout.md` | no |
| 2.1 | 1.3 | `plans/batches/2.1-login-legal-routes.md` | yes |
| 2.2 | 1.3 | `plans/batches/2.2-debug-nav-gating.md` | yes |
| 3.1 | 1.3 | `plans/batches/3.1-schema-dialog-modals.md` | no |

## Status vocabulary

`pending` | `in_progress` | `done` | `blocked`
