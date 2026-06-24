# Concave CMS — Orchestration Log

> **MANDATORY for all spawned agents:** Read this file first before any other project files. It is the single source of truth for current progress and next actions.

## Active program

**UX/UI Remediation** (2026-06-23) — see `plans/ux-ui-remediation-ledger.md` for batch progress.

| Field | Value |
| --- | --- |
| **Last updated** | 2026-06-23T00:00Z |
| **Orchestrator** | Cursor Automation — `ux-ui-remediation-orchestrator` |
| **Implementation branch** | `dev-agent` |
| **Orchestration branch** | `cursor/ux-ui-remediation-orchestration` |
| **Source plan** | `plans/ux-ui-remediation-plan-2026-06-23.md` |
| **Batch manifest** | `plans/ux-ui-remediation-batches.md` |
| **Next batch** | 1.1 (`plans/batches/1.1-schema-draft-buffer.md`) |

## Agent rules

1. **Model:** Use `composer-2.5` only. Never `composer-2.5-fast` or any other model (orchestrator and spawned agents).
2. **Read first:** `orchestration.md` → `plans/ux-ui-remediation-ledger.md` → **only** the active `plans/batches/*.md` file (do not read the full remediation plan unless the batch says so).
3. **Work branch:** `dev-agent`.
4. **Scope:** Only files listed in the active batch prompt. One batch per agent run.
5. **Review loop:** `bun run test` every batch; `bun run check` informational (Biome backlog may be pre-existing). E2E only when batch requires it.
6. **E2E trap:** **Never run or inspect `scripts/e2e-server.sh`** — it blocks forever. Use `bun run test:e2e -- e2e/<spec>.spec.ts`. See `docs/agent-testing.md`.
7. **Push gate:** Commit and push `dev-agent` after batch completes. Verify remote if orchestrator requires it.
8. **Ledger updates:** On orchestration branch `cursor/ux-ui-remediation-orchestration`, update `plans/ux-ui-remediation-ledger.md` — set batch `done`, clear `active_agent`, append completed work log.
9. **STOP conditions:** Set batch `blocked` in ledger; do not start dependent batches.
10. **Convex:** Use `function-creator` skill; `CONVEX_AGENT_MODE=anonymous npx convex dev` for cloud agents.

## Active agent

| Agent | Model | Batch | Status |
| --- | --- | --- | --- |
| — | — | — | **none** |

## Prior program (launch — complete)

Launch plan Phases 0–9 completed 2026-06-22 on `cursor/concave-cms-launch-plan-26c1` (PR #1). See git history and `docs/launch-plan.md` on that branch for details.

---

## Completed work (remediation log)

See `plans/ux-ui-remediation-ledger.md` for per-batch status and detailed log entries.
