# Concave CMS — Launch Orchestration

> **Read this file first** before doing any implementation work. It is the single source of truth for orchestration state so agents can catch up without re-reading the full change history.

## Current status (2026-06-22T12:30Z)

| Item | Value |
|------|-------|
| **Launch plan** | **COMPLETE** — 123/123 checked on impl branch |
| **Implementation branch** | `cursor/concave-cms-launch-plan-26c1` @ `9045ee3` |
| **Implementation PR** | https://github.com/SaM13997/concave-cms/pull/1 |
| **Orchestration branch** | `cursor/orchestration-agent-system-c027` |
| **Scaffold branch progress** | 7/123 (expected — impl lives on separate branch) |
| **Active implementation agents** | none |
| **Phases** | 0–9 complete |

## What was done (implementation branch)

Phases 0–9 of `docs/launch-plan.md` are fully implemented and checked off on `cursor/concave-cms-launch-plan-26c1`:

- **Phase 0** — Bootstrap: test env fixtures, `.env.example`, quickstart, schema UX contract, contract test plan
- **Phase 1** — Auth/RBAC: sessions, roles, server-side enforcement
- **Phase 2** — Schema builder: canonical schema, bilingual strategy, apply workflow
- **Phase 3** — Content editing: draft/publish, preview tokens
- **Phase 4** — Version history: compare/revert
- **Phase 5** — Global search (Cmd+K)
- **Phase 6** — Presence indicators
- **Phase 7** — Publish latency benchmarks
- **Phase 8** — Accessibility baseline
- **Phase 9** — Self-hosted packaging: Docker, docker-compose, onboarding E2E, CHANGELOG, release docs

Release checklist (8 items) is also fully checked on the impl branch.

Verified artifacts on impl branch: `CHANGELOG.md`, `docs/release.md`, `Dockerfile`, `docker-compose.yml`, `e2e/onboarding.spec.ts`.

Last implementation commit: `9045ee3` — `test(phase-0): add unit tests for deterministic test env fixtures`.

## What's next (post-launch)

No further implementation agents are needed for `docs/launch-plan.md`. Optional human/OPS steps:

1. **Merge** PR #1 (`cursor/concave-cms-launch-plan-26c1` → `master`)
2. **Tag** v1.0.0 per `docs/release.md` on impl branch
3. **Run** live publish latency benchmark (p50/p95) in staging
4. **Run** staging backup/restore drill

## Orchestrator instructions

This agent **does not implement code**. It monitors implementation agents and coordinates work until `docs/launch-plan.md` is complete.

### Each cron turn

1. Read this file (`orchestration.md`) for current state.
2. Check whether any implementation agents are running (terminals, Slack, branch activity).
3. Verify impl branch `cursor/concave-cms-launch-plan-26c1` launch-plan checkbox counts remotely.
4. If no agents running and launch plan incomplete → spawn one (see below).
5. If agent appears stuck → nudge via Slack with specific next step from launch plan.
6. If agent finished + review loop passed → update this file and post Slack summary.
7. Commit and push this file on the orchestration branch.

### Spawning an implementation agent

Use model **`composer-2.5`** (not fast).

**Branch:** `cursor/concave-cms-launch-plan-26c1` (create from `master` if missing).

**Prompt must include:**

1. Read `orchestration.md` first for context.
2. Read `docs/launch-plan.md` and find the first unchecked items.
3. Implement the next phase/step on the impl branch.
4. Run `npm run check && npm run test` before finishing.
5. Spawn a **review/fix loop**: review work against launch plan + `docs/requirements.md`; fix all feedback; repeat until clean.
6. Check off completed items in `docs/launch-plan.md`.
7. Commit, push, and post completion summary to Slack #concave-cms.

### Agent rules

- **E2E:** Never run `bash scripts/e2e-server.sh` directly (blocks forever). Use `npm run test:e2e -- e2e/<spec>.spec.ts`.
- **Convex dev:** Use `CONVEX_AGENT_MODE=anonymous npx convex dev` in cloud agent environments.
- **Review loop:** Mandatory before marking a phase done. At least one review round; more if issues found.

## Session log

### 2026-06-22T12:30Z — Orchestration cron (`cursor/orchestration-agent-system-c027`)

- **Checked:** No implementation agents running.
- **Verified:** Impl branch `9045ee3` — 123/123 launch-plan items checked; 0 unchecked; Phase 9 artifacts present.
- **Action:** Created `orchestration.md`. No agent spawned — launch plan fully implemented.
- **Slack:** Status update posted.

### 2026-06-22T12:20Z — Orchestration cron (`cursor/orchestration-agent-system-0aae`)

- **Checked:** No implementation agents running.
- **Verified:** Impl branch `9045ee3` — 123/123 launch-plan items checked; 0 unchecked; Phase 9 artifacts present.
- **Action:** Created `orchestration.md`. No agent spawned — launch plan fully implemented.
- **Slack:** Status update posted.
