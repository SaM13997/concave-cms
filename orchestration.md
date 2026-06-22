# Concave CMS — Orchestration Log

> **MANDATORY for all spawned agents:** Read this file first before any other project files. It is the single source of truth for current progress and next actions.

## Session

| Field | Value |
|-------|-------|
| **Last updated** | 2026-06-22T06:50Z |
| **Orchestrator** | Cursor Automation (cron) |
| **Implementation branch** | `cursor/concave-cms-launch-plan-26c1` |
| **Orchestration branch** | `cursor/orchestration-agent-system-f88e` |
| **Impl PR** | https://github.com/SaM13997/concave-cms/pull/1 |
| **Launch plan** | `docs/launch-plan.md` |
| **Slack thread** | ts: 1782091709.754369 (#concave-cms) |

## Agent rules

1. **Model:** Use `composer-2.5` (non-fast) only.
2. **Read first:** `orchestration.md` → `docs/launch-plan.md` → `docs/agent-testing.md` if running E2E (do not re-read full git history).
3. **Work branch:** Check out `cursor/concave-cms-launch-plan-26c1` (has Phases 0–8).
4. **Review loop:** After implementation, spawn review/fix sub-agents until all feedback is addressed (`npm run check` + `npm run test`; run e2e if UI touched).
5. **E2E trap (important):** **Never run or inspect `scripts/e2e-server.sh`** — it blocks forever. Use `npm run test:e2e -- e2e/<spec>.spec.ts` only. See `docs/agent-testing.md`.
6. **Push gate:** NEVER mark a phase complete without verifying remote:
   ```bash
   git push -u origin cursor/concave-cms-launch-plan-26c1
   git ls-remote origin cursor/concave-cms-launch-plan-26c1  # must show NEW commit
   ```
7. **Update this file** when task + review loop completes (on orchestration branch `cursor/orchestration-agent-system-f88e`).
8. **Convex:** Use `function-creator` skill; `CONVEX_AGENT_MODE=anonymous npx convex dev` for cloud agents.
9. **Commit & push** impl branch after review loop passes.
10. **Check off** completed items in `docs/launch-plan.md` on the impl branch.

## Current status

| Phase | Status |
|-------|--------|
| 0 — Bootstrap | ✅ Complete |
| 1 — Auth + RBAC | ✅ Complete |
| 2 — Convex foundation | ✅ Complete |
| 3 — Schema engine | ✅ Complete |
| 4 — Content engine | ✅ Complete |
| 5 — Draft/publish + preview | ✅ Complete |
| 6 — Time travel | ✅ Complete (`3623f93`) |
| 7 — Admin UX | ✅ Complete (`45c5a8a`) |
| 8 — Hardening | ✅ Complete (`0718a5c`) |
| **9 — Packaging** | 🔄 **IN PROGRESS** |

**Impl branch HEAD:** `f68c123` (E2E agent-hang fix; Phase 9 not yet implemented)

**CI on PR #1:** Green through Phase 8 commit `0718a5c`.

## Active agent

| Agent | Model | Task | Status |
|-------|-------|------|--------|
| Phase 9 impl | composer-2.5 | Phase 9.1–9.3 packaging + release | **spawned 2026-06-22T06:50Z** |

## Completed work (log)

### 2026-06-22T06:38Z — E2E agent hang fix

- **Branch:** cursor/concave-cms-launch-plan-26c1
- **Commit:** `f68c123`
- **Done:** `scripts/e2e-server.sh` now rejects direct execution; Playwright sets `PLAYWRIGHT_E2E_SERVER=1`; added `docs/agent-testing.md`; simplified startup via `convex dev --run-sh`.
- **Why:** Agents were reading/running `e2e-server.sh` and hanging on `wait`.

### 2026-06-22T05:45Z — Phase 8 launch hardening

- **Agent:** composer-2.5
- **Commit:** `0718a5c`
- **Done:** Rate limiting, validation, audit viewer, backup/restore, a11y CI, security regression tests.
- **Tests:** check ✅ · unit 119 ✅ · E2E 32/35 (3 flaky content specs)
- **Next:** Phase 9

### 2026-06-22T03:28Z — Phase 7 admin experience

- **Commit:** `45c5a8a`
- **Done:** Global search, presence, breadcrumbs, Cmd+K, toasts, URL routing.

### 2026-06-22T02:36Z — Phase 6 time travel

- **Commit:** `3623f93`
- **Done:** History capture, compare, revert APIs + ContentHistoryPanel.

## Next up

1. **Phase 9.1** — Docker Compose packaging + clean-environment install smoke test in CI
2. **Phase 9.2** — In-product onboarding (Blog + first post) + quickstart/troubleshooting docs
3. **Phase 9.3** — SemVer, CHANGELOG, upgrade/rollback notes + release checklist completion
4. **Release checklist** — Check off all items at top of `docs/launch-plan.md` when gates pass

## Phase 9 task spec (for implementation agent)

Implement **Phase 9 — Self-hosted packaging, docs, and release** per `docs/launch-plan.md`:

### Step 9.1 — Packaging and install verification
- **OPS:** Docker Compose (or equivalent) with documented requirements (Node, Convex, env vars)
- **OPS:** `.env.example` aligned with compose; install script or `make install`
- **TEST:** Clean-environment install smoke test in CI (can be scripted validation of compose config + health checks)

### Step 9.2 — Onboarding flow + docs
- **FE:** In-product onboarding wizard/path: create Blog schema → create post → publish first post
- **OPS:** `docs/quickstart.md` and `docs/troubleshooting.md` (or expand README)
- **TEST:** E2E spec `e2e/onboarding.spec.ts` with step/time budget

### Step 9.3 — Release checklist + versioning
- **OPS:** `CHANGELOG.md`, version in `package.json`, `docs/upgrade.md`, `docs/rollback.md`
- **TEST:** Ensure CI release gates cover unit + integration + e2e (document in `docs/release.md`)
- Check off Phase 9 steps and release checklist in `docs/launch-plan.md`

### Acceptance
- `npm run check && npm run test` pass
- Run targeted E2E: `npm run test:e2e -- e2e/onboarding.spec.ts` (and any new specs)
- Push verified on remote before marking complete
- Spawn review/fix loop until clean

## Update template (agents: append after review loop)

```markdown
### YYYY-MM-DD — <short title>
- **Agent:** composer-2.5
- **Branch:** cursor/concave-cms-launch-plan-26c1
- **Commit:** <sha after push verified>
- **Done:** ...
- **Tests:** ...
- **Next:** ...
```
