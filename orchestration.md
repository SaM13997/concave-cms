# Concave CMS — Orchestration State

> **Read this file first** before starting any implementation work. It is the single source of truth for project status, branch pointers, and next actions. Do not re-read the full git history or Slack thread unless something here is stale.

**Last updated:** 2026-06-22 11:10 UTC (orchestration cron)  
**Orchestration branch:** `cursor/orchestration-agent-system-7e00`  
**Implementation branch:** `cursor/concave-cms-launch-plan-26c1`  
**Launch plan:** `docs/launch-plan.md`

---

## Agent instructions (mandatory)

1. **Read this file first** — catch up here before touching code.
2. **Model:** Use `composer-2.5` (non-fast). Do not use `composer-2.5-fast`.
3. **Branch:** All implementation work goes on `cursor/concave-cms-launch-plan-26c1` (not master/orchestration branches).
4. **Review/fix loop:** After each phase or significant chunk of work, spawn a review pass. Fix all feedback before marking done. Repeat until clean.
5. **When done:** Run `npm run check` and `npm run test` (and relevant E2E). Commit, push, update this file, and notify Slack.
6. **Check off items** in `docs/launch-plan.md` as you complete them.

---

## Current status: LAUNCH COMPLETE

| Item | Status |
|------|--------|
| Implementation agents running | **None** |
| Launch plan (`docs/launch-plan.md` on impl branch) | **123/123 checked** (0 unchecked) |
| Release checklist | **8/8 checked** |
| Phases 0–9 | **Complete** |
| Latest impl commit | `9045ee3` — `test(phase-0): add unit tests for deterministic test env fixtures` |
| Tests (last verified) | `npm run check` ✅ · `npm run test` ✅ (122 tests, 18 files) |
| PR | https://github.com/SaM13997/concave-cms/pull/1 |

**No new implementation agent needed.** The launch plan is fully implemented on the implementation branch.

---

## What was done (summary)

### Phase 0 — Bootstrap
- Repo scaffolding, CI, ADRs, env config, `.env.example`, quickstart docs
- Deterministic test secrets (`src/test/fixtures/env.ts`)
- Schema apply UX contract + contract test plan

### Phase 1 — Auth & RBAC
- Better Auth integration, session handling, server-side identity verification
- RBAC matrix enforced on all sensitive mutations

### Phase 2 — Convex foundation
- System tables (schema, content, media, audit, presence)
- Reactive query patterns

### Phase 3 — Visual Schema Engine
- Canonical schema validation, drag-and-drop builder, export/apply workflow

### Phase 4 — Content engine
- Schema-driven CRUD, rich text, media, references

### Phase 5 — Draft/publish & preview
- Shadow drafting, atomic publish, preview URLs, publish latency instrumentation

### Phase 6 — Time travel
- Version history, compare, revert (`ContentHistoryPanel`, audit events)

### Phase 7 — Admin UX
- Fluid navigation, Cmd+K search, presence indicators, toasts

### Phase 8 — Launch hardening
- Rate limiting, input validation, structured logs, audit viewer
- Backup/restore scripts, a11y CI, security regression suite

### Phase 9 — Packaging & release
- Docker Compose + Dockerfile + Makefile + install-smoke CI
- Onboarding wizard (Blog → post → publish) + `e2e/onboarding.spec.ts`
- CHANGELOG, release/upgrade/rollback docs
- Release checklist fully checked

---

## What's next (post-launch)

These are **optional post-launch** steps — not launch-plan blockers:

1. **Merge** implementation PR → `master`
2. **Tag** `v1.0.0` per `docs/release.md`
3. **Measure** live publish p50/p95 latency in staging/production
4. **Run** staging backup/restore drill in a real environment

If a new implementation agent is spawned for post-launch work, assign one of the above explicitly.

---

## Branch map

| Branch | Purpose | Launch plan progress |
|--------|---------|---------------------|
| `master` / orchestration branches | Scaffold + orchestration docs only | ~7/123 (Phase 0.1 only) |
| `cursor/concave-cms-launch-plan-26c1` | **All implementation** | **123/123 complete** |

> The orchestration/scaffold branch intentionally lags. Never use its `docs/launch-plan.md` checkboxes as implementation progress — always check the impl branch.

---

## Orchestration log

| Timestamp (UTC) | Event |
|-----------------|-------|
| 2026-06-22 11:10 | Cron: verified impl branch 123/123, Phase 9 artifacts present, no agents running, launch complete. Updated `orchestration.md`. No agent spawned. |
| 2026-06-22 11:00 | Cron: verified impl branch 123/123, no agents running, launch complete. Updated `orchestration.md`. No agent spawned. |
| 2026-06-22 10:50 | Cron: verified complete, no agent spawned. |
| 2026-06-22 10:39 | Impl agent finished Phase 0 delta + verified all phases. Review loop pass. |
| 2026-06-22 10:30 | Spawned `composer-2.5` agent for Phase 0 remainder → led to full verification. |
| 2026-06-22 07:10 | Phase 9 complete — all phases 0–9 done (`1a6dd04`). |
| 2026-06-22 05:42 | Phase 8 complete — launch hardening (`0718a5c`). |
| 2026-06-22 03:31 | Phase 7 complete — admin UX (`45c5a8a`). |
| 2026-06-22 02:36 | Phase 6 complete — time travel (`3623f93`). |

---

## Spawn template (for orchestrator use)

When work remains and no agent is running, spawn with:

```
Model: composer-2.5 (NOT fast)

FIRST: Read orchestration.md at repo root — do not re-derive state from git/Slack.

Branch: cursor/concave-cms-launch-plan-26c1

Task: [specific phase/step from launch-plan.md]

After completing:
1. Run npm run check && npm run test (and E2E if UI-facing)
2. Check off items in docs/launch-plan.md
3. Spawn review/fix loop until all feedback addressed
4. Commit, push, update orchestration.md, notify Slack
```
