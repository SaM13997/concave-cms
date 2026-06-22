# Migration strategy (self-hosted)

Concave CMS stores canonical schema definitions and content in Convex. Upgrades should preserve data while allowing schema evolution.

## Principles

1. **System tables vs content types** — Convex `schema.ts` defines CMS system tables only. Content types live in the `schemas` table and evolve through the schema builder apply workflow.
2. **Backward-compatible changes first** — Prefer additive schema changes (new optional fields, new tables) over destructive edits.
3. **Export before upgrade** — Always take a snapshot before applying migrations or upgrading the CMS package.

## Upgrade workflow

1. Run `node scripts/backup.mjs` (requires `CONVEX_URL` and `CONVEX_DEPLOY_KEY`).
2. Deploy the new CMS version (`npx convex deploy` for backend, rebuild frontend).
3. Review release notes for breaking Convex schema changes to system tables.
4. If content-type schema changes are needed, use the admin schema builder (draft → validate → apply).
5. Smoke test: login, list content, publish, preview, audit log.

## Content-type migrations

| Change type | Strategy |
|-------------|----------|
| Add optional field | Apply in schema builder; existing entries remain valid |
| Add required field | Add field as optional, backfill content, then mark required |
| Rename field | Treat as destructive; export content, apply rename, re-import if needed |
| Delete field | Blocked when entries contain data unless admin confirms destructive apply |

## Restore workflow

1. `node scripts/restore.mjs backups/<timestamp>/full-snapshot.json --dry-run`
2. Review counts (restored vs skipped).
3. `node scripts/restore.mjs backups/<timestamp>/full-snapshot.json`
4. Verify content in admin UI and run smoke tests.

## UI exports

Admins can also download snapshots from **Settings** (`/settings`):

- Full snapshot (schemas + content)
- Content-only snapshot

These JSON files use `formatVersion: 1` and match the backup script output.

## Rollback

- **Application rollback**: redeploy previous CMS build; Convex data is unchanged.
- **Data rollback**: restore from the latest backup snapshot using `scripts/restore.mjs`.
- **Schema rollback**: use schema version history in the admin schema builder where available.

## Verified drill

The restore drill is covered by:

- Unit test: `convex/lib/restoreDrill.test.ts`
- Manual/CI: run backup → dry-run restore → restore → smoke test in staging
