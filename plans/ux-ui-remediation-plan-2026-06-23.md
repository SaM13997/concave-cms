# UX/UI Remediation Plan (2026-06-23)

Post-launch polish for Concave CMS admin UI. Phase 7 features exist; this plan addresses **consistency, navigation, and RBAC alignment** gaps found after launch.

## Goals

- First-class navigation to all primary admin areas (including Media)
- Consistent TanStack Router `Link` usage (no full-page `<a href>` in admin)
- RBAC-aligned nav visibility
- Shared page layout (width, headers)
- Fix broken login legal links
- Gate debug routes appropriately
- Standardize schema modals on shadcn Dialog (later batch)

## Batches

See `plans/ux-ui-remediation-batches.md` manifest.

## Verification

- Default: `bun run test`
- Navigation/RBAC batches: add targeted E2E (`e2e/navigation.spec.ts`, `e2e/rbac.spec.ts`)
- Never run `scripts/e2e-server.sh` — use `bun run test:e2e -- e2e/<spec>.spec.ts`

## Completion

All manifest batches `done` in `plans/ux-ui-remediation-ledger.md`.
