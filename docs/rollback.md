# Rollback guide

How to roll back Concave CMS after a failed or problematic upgrade.

## Application rollback (frontend)

Revert to the previous application build. **Convex data is unchanged.**

### Docker

```bash
git checkout vX.Y.Z          # previous tag
docker compose build
docker compose up -d
```

Or pull a previously tagged image from your registry.

### Manual

```bash
git checkout vX.Y.Z
bun install --frozen-lockfile
bun run build
# Restart node .output/server/index.mjs
```

Ensure environment variables match the rolled-back version (see that tag's `.env.example`).

## Backend rollback (Convex)

Convex deployments are versioned in the dashboard.

1. Open the Convex dashboard → **Deployments**.
2. Select the previous successful deployment and promote / roll back per Convex docs.
3. Alternatively, `git checkout` the previous tag and run `npx convex deploy`.

> Rolling back Convex **code** does not undo database writes made by a newer version. Pair backend rollback with a data restore if schema or data migrations ran.

## Data rollback

When content or system data was corrupted or migrated incorrectly:

1. Locate the latest backup: `backups/<timestamp>/full-snapshot.json` or Settings export.
2. Dry run:

   ```bash
   node scripts/restore.mjs backups/<timestamp>/full-snapshot.json --dry-run
   ```

3. Restore:

   ```bash
   node scripts/restore.mjs backups/<timestamp>/full-snapshot.json
   ```

4. Verify in admin UI and run smoke tests.

## Schema rollback

- **Content types:** Use schema version history in the Schema builder when available.
- **Destructive apply:** Restore from snapshot if history is insufficient.

## When to rollback vs forward-fix

| Situation | Recommendation |
|-----------|----------------|
| Frontend UI regression | Application rollback |
| Convex function bug | Backend rollback or hotfix forward |
| Bad schema apply | Restore snapshot + schema version rollback |
| Secret misconfiguration | Fix env vars and redeploy (no data rollback) |

## Post-rollback validation

1. Login and RBAC checks
2. List and open content entries
3. Publish smoke test on staging
4. Document incident and update [CHANGELOG.md](../CHANGELOG.md) if a patch is needed

## Related

- [Upgrade guide](./upgrade.md)
- [Migration strategy](./migration-strategy.md)
- [Release process](./release.md)
