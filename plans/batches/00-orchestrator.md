# Orchestrator — UX/UI Remediation

**Role:** Pick and spawn exactly **one** implementation batch per run. Do not implement code yourself unless unblocking the ledger.

## Read order (strict — minimize context)

1. `orchestration.md` — agent rules, branches, verification traps
2. `plans/ux-ui-remediation-ledger.md` — batch status, blockers, active agent
3. `plans/ux-ui-remediation-batches.md` — selection algorithm only (not full plan)
4. Active batch file from ledger (e.g. `plans/batches/1.1-schema-draft-buffer.md`)

Do **not** read `plans/ux-ui-remediation-plan-2026-06-23.md` in full — implementation agents read phase excerpts via batch files.

## Algorithm

1. If `active_agent` is set and started &lt; 6 hours ago → log "agent in flight" and **stop**.
2. If any batch is `blocked` and no human `skipped` override → **stop** and summarize blockers.
3. Find lowest batch ID where status is `pending` and all dependencies in manifest are `done`.
4. If none → log "remediation complete" and **stop**.
5. Checkout `dev-agent`, pull latest.
6. Set ledger: batch → `in_progress`, fill `active_agent` row (model: `composer-2.5`).
7. Commit ledger update to `cursor/ux-ui-remediation-orchestration` branch and push.
8. Spawn **one** cloud agent on `dev-agent` with model **`composer-2.5` only** (never `composer-2.5-fast` or any other model) and prompt:

```
You are implementing batch {ID} for Concave CMS UX/UI remediation.

Read in order:
1. orchestration.md
2. plans/ux-ui-remediation-ledger.md
3. {batch prompt path}

Rules:
- Model: composer-2.5 ONLY — not composer-2.5-fast, not any other model
- Branch: dev-agent
- Scope: only files listed in the batch prompt
- After implementation: bun run test (and E2E only if batch requires)
- Never run scripts/e2e-server.sh
- Commit + push dev-agent
- Update ledger on orchestration branch: batch done, clear active_agent, append completed work log
- If STOP condition: set batch blocked, do not proceed to next batch
```

9. Do not spawn a second agent in the same run.

## Branches

| Purpose | Branch |
| --- | --- |
| Implementation | `dev-agent` |
| Ledger / orchestration metadata | `cursor/ux-ui-remediation-orchestration` |

## When remediation completes

Post summary: batches done, any blocked/skipped, final `dev-agent` HEAD, suggest PR to default branch.
