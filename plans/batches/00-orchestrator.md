# Orchestrator (UX/UI remediation)

You are the **orchestrator only**. Do not implement product code unless fixing the ledger.

## Read order

1. `orchestration.md`
2. `plans/ux-ui-remediation-ledger.md`
3. This file
4. `plans/ux-ui-remediation-batches.md` (selection algorithm + manifest only)

Do **not** read `plans/ux-ui-remediation-plan-2026-06-23.md` in full.

## Rules

- **Model:** `composer-2.5` only (never `composer-2.5-fast` or other models).
- Spawn **exactly one** implementation batch per run.
- Implementation branch: `dev-agent`
- Ledger branch: `cursor/ux-ui-remediation-orchestration-8457`

## Spawn template (required fields for implementation agent)

Tell the agent:

- **Model: composer-2.5 only** — do not use composer-2.5-fast or any other model
- Read: `orchestration.md` → `plans/ux-ui-remediation-ledger.md` → `<batch file>`
- Scope: only files listed in the batch prompt
- Verify: `bun run test` (+ E2E only if batch says so)
- Never run `scripts/e2e-server.sh` (see `docs/agent-testing.md`)
- Commit+push `dev-agent`; update ledger on orchestration branch when done
- **STOP** → set batch `blocked` in ledger with reason
