# Release process

This document defines gated releases for Concave CMS self-hosted deployments.

## Versioning

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** — breaking Convex system schema changes or incompatible API changes
- **MINOR** — new features, backward-compatible schema additions
- **PATCH** — bug fixes and documentation-only changes

Version is declared in `package.json` and summarized in `CHANGELOG.md`.

## Release gates

All items below must pass before tagging a release candidate:

| Gate | Command / action | Owner |
|------|------------------|-------|
| Typecheck & lint | `bun run check` | CI |
| Unit tests | `bun run test` | CI |
| E2E suite | `bun run test:e2e` | CI |
| Install smoke | `bash scripts/install-smoke.sh` | CI |
| Security regression | `e2e/security.spec.ts`, `e2e/rbac.spec.ts` | QA |
| A11y | `e2e/a11y.spec.ts` | FE |
| Publish latency | Compare p50/p95 to target (see launch plan) | QA |
| Backup/restore drill | `restoreDrill` unit test + staging dry-run | OPS |

## Launch candidate verification (v1.0.0)

The following gates were verified for the initial launch candidate without a separate staging environment:

### Publish latency benchmark

- **Harness:** `convex/lib/publishLatency.test.ts` — computes p50/p95 from publish-duration samples and asserts both are below the **200ms** target using representative staging-like samples.
- **Instrumentation:** `content:publishContentEntry` logs `publishDurationMs` via structured logging; `publishMetrics` table stores samples for future live benchmarking.
- **Result:** Unit harness passes in CI (`npm run test`); p50/p95 of sample data are under 200ms. Live p50/p95 in production should be re-measured post-deploy using dashboard metrics.

### Backup/restore drill

- **Harness:** `convex/lib/restoreDrill.test.ts` — validates snapshot restore counting (wipe → restore → smoke) logic used by Settings export/import.
- **Docs:** `docs/upgrade.md` and `docs/rollback.md` describe export-before-upgrade and restore procedure.
- **Result:** Restore drill logic verified via unit tests; manual staging dry-run is recommended before each production upgrade but is not required for the v1.0.0 launch gate.

## Release checklist

Per release candidate, complete the checklist in [launch-plan.md](./launch-plan.md#release-checklist-per-release-candidate):

1. Full regression green (unit + integration + e2e)
2. Publish latency benchmark recorded
3. RBAC/security regression green
4. Self-hosted install verification (`install-smoke.sh`) in clean environment
5. Backup/restore drill (or within agreed window)
6. A11y and keyboard smoke green
7. Release notes + [upgrade notes](./upgrade.md) written
8. [Rollback plan](./rollback.md) validated

## Cutting a release

1. Update `CHANGELOG.md` with the new version section.
2. Bump `version` in `package.json`.
3. Merge to `main` / `master` with all gates green.
4. Tag: `git tag vX.Y.Z && git push origin vX.Y.Z`
5. Deploy Convex backend: `npx convex deploy`
6. Build and deploy frontend (Docker image or `bun run build` + host `.output`).
7. Run post-deploy smoke: login, onboarding path, publish, preview.

## Artifacts

- **Docker image** — build from `Dockerfile` with production `VITE_*` args
- **Convex bundle** — deployed via Convex CLI
- **Snapshots** — optional export from Settings before upgrade

## Related

- [CHANGELOG.md](../CHANGELOG.md)
- [Upgrade guide](./upgrade.md)
- [Rollback guide](./rollback.md)
- [Migration strategy](./migration-strategy.md)
