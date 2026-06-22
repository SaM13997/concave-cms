# Concave CMS — Launch Orchestration

> **MANDATORY for all spawned implementation agents:** Read this file FIRST before any other work. It is the single source of truth for status, branch assignments, and next steps.

## Orchestration metadata

| Field | Value |
|-------|-------|
| **Last updated** | 2026-06-22T10:30Z |
| **Orchestration branch** | `cursor/orchestration-agent-system-d113` |
| **Implementation branch** | `cursor/concave-cms-launch-plan-26c1` |
| **Launch plan** | `docs/launch-plan.md` |
| **Model (impl agents)** | `composer-2.5` (non-fast) |
| **Active agents** | 1 implementation agent (spawned 2026-06-22T10:30Z) |

## Current status

- **Progress:** 7 / 95 checklist items complete (~7%)
- **Phases complete:** none (Phase 0 in progress)
- **CI baseline:** `npm run check` + `npm run test` must pass before marking items done

### Phase 0 — completed items
- [x] Step 0.1 — Repository scaffolding + scripts (all 4 items)
- [x] Step 0.2 — BE config schema, FE env-aware config
- [x] Step 0.3 — BE ADRs (canonical schema, bilingual schema, apply strategy)

### Phase 0 — remaining (NEXT)
- [ ] Step 0.2 TEST: deterministic test secrets (no manual secrets in tests)
- [ ] Step 0.2 OPS: `.env.example` + quickstart docs
- [ ] Step 0.3 FE: UX contract for schema changes (draft → validate → apply)
- [ ] Step 0.3 TEST: contract tests plan for schema export + apply

### After Phase 0
Proceed sequentially through Phases 1–9 per `docs/launch-plan.md`. Check off items in the launch plan only when implementation AND tests are done.

## Agent instructions (implementation)

1. **Read this file first** — do not re-scan the whole repo for context.
2. **Branch:** checkout or create `cursor/concave-cms-launch-plan-26c1` from `master` (or current scaffold commit `29ed6b5`).
3. **Model:** you are running as `composer-2.5` (non-fast).
4. **Scope:** complete the "Phase 0 — remaining" items above, then start Phase 1 if time permits in this session.
5. **Quality loop (mandatory):**
   - After implementation, spawn a review sub-agent (`generalPurpose`, `composer-2.5`) to review your diff against `docs/launch-plan.md` and `docs/requirements.md`.
   - Fix all review feedback; repeat review until clean.
   - Run `npm run check && npm run test` — must be green.
6. **Launch plan:** check off completed items in `docs/launch-plan.md`.
7. **Commit & push** to `cursor/concave-cms-launch-plan-26c1` with clear messages.
8. **Do NOT** run `bash scripts/e2e-server.sh` directly (blocks forever). Use `npm run test:e2e -- e2e/<spec>.spec.ts` when e2e exists.
9. **Do NOT** edit `orchestration.md` — the orchestration agent updates it after you finish.

## Agent instructions (orchestration — this agent only)

- Do not implement features; only coordinate, update this file, spawn/nudge agents, Slack updates.
- Cron every 10 min: check agent status, nudge if stuck, spawn if idle, update this file.

## Session log

### 2026-06-22T10:30Z — Orchestration cron
- **Status check:** No implementation agents were running. Launch plan 7/95 on `master` scaffold branch.
- **Action:** Created `orchestration.md`. Spawned implementation agent (`composer-2.5`) to finish Phase 0 and begin Phase 1.
- **Next:** Wait for impl agent to complete review loop; then orchestrator verifies progress and assigns Phase 1+ work or continues nudging.

## Post-launch (future)

When all 95 items + release checklist are checked:
- Open/merge implementation PR to `master`
- Tag v1.0.0 per release docs
- Run live publish latency benchmark + staging backup drill
