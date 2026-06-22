# Agent testing guide

> **For Cursor/cloud agents.** Read this instead of `scripts/e2e-server.sh`.

## Do not run `scripts/e2e-server.sh` directly

That script is **only** for Playwright's `webServer` config. It starts Convex + Vite and **blocks forever** until Playwright kills it. Running it in a shell (or trying to "read and execute" it) will hang the agent session.

## What to run instead

| Goal | Command |
|------|---------|
| Review loop (default) | `npm run check && npm run test` |
| Build verification | `npm run verify` |
| Single E2E spec | `npm run test:e2e -- e2e/navigation.spec.ts` |
| Full E2E suite | `npm run test:e2e` |
| Install smoke (Phase 9) | `bash scripts/install-smoke.sh` |

Playwright starts the servers automatically when you run `npm run test:e2e`. You do not need a separate dev server.

## E2E environment

- `CONVEX_AGENT_MODE=anonymous` is set in `playwright.config.ts` (cloud agents must not use a personal Convex deployment).
- Test secrets are injected via `playwright.config.ts` `webServer.env`.
- E2E specs live in `e2e/*.spec.ts`.

## When to run E2E

- **Yes:** UI routes, navigation, onboarding, or Playwright specs you added/changed.
- **No:** Backend-only Convex changes — `npm run check && npm run test` is enough for the review loop.

## If E2E seems stuck

1. Do **not** open or run `scripts/e2e-server.sh` manually.
2. Kill stray processes: `pkill -f "convex dev"; pkill -f "vite dev --port 3000"`
3. Re-run a **single** spec: `npm run test:e2e -- e2e/<spec>.spec.ts`
4. If port 3000 is busy: `fuser -k 3000/tcp 2>/dev/null || true`

## CI reference

GitHub Actions runs `bun run test:e2e` with `CI=true` (see `.github/workflows/ci.yml`). Local/agent runs use the same Playwright config.
