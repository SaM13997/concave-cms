# Upgrade guide

Steps to upgrade a self-hosted Concave CMS instance to a newer version.

## Before you upgrade

1. **Export a snapshot** — Settings → Export full snapshot, or `node scripts/backup.mjs`.
2. **Read the changelog** — [CHANGELOG.md](../CHANGELOG.md) for breaking changes.
3. **Note your current version** — `package.json` `version` field or git tag.

## Upgrade steps

### 1. Backend (Convex)

```bash
git pull
bun install --frozen-lockfile
npx convex deploy
```

Review Convex dashboard for migration warnings on system tables (`convex/schema.ts`).

### 2. Frontend

**Docker:**

```bash
docker compose build --no-cache
docker compose up -d
```

**Manual:**

```bash
bun run build
# Restart your process manager serving .output/server/index.mjs
```

Rebuild is required when `VITE_CONVEX_URL` or other build-time variables change.

### 3. Content-type schema changes

System table migrations are applied by `convex deploy`. **Content types** (Blog, etc.) evolve through the admin schema builder:

1. Open **Schema** → edit draft → validate → apply.
2. Prefer additive changes (new optional fields).
3. For destructive changes, export content first.

See [migration-strategy.md](./migration-strategy.md) for patterns.

### 4. Post-upgrade verification

- Sign in at `/login`
- List content types and open an entry
- Publish or preview a test entry
- Check audit log (`/audit`)
- Run smoke: `bash scripts/install-smoke.sh` (on a staging clone)

## Breaking changes

Breaking releases are called out in `CHANGELOG.md` under **Breaking**. Typical actions:

| Change | Action |
|--------|--------|
| New required env var | Update `.env` / `.env.local` per `.env.example` |
| Convex system schema change | `npx convex deploy` (may require data migration notes in changelog) |
| Auth URL change | Update `SITE_URL` and `BETTER_AUTH_URL`, clear user sessions |

## Rolling upgrade (zero-downtime)

1. Deploy Convex backend first (backward-compatible releases).
2. Deploy new frontend once backend is live.
3. Old frontend may work briefly if API is compatible; prefer a short maintenance window for major releases.

## Related

- [Rollback guide](./rollback.md)
- [Release process](./release.md)
