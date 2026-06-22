# Troubleshooting

Common issues when installing, developing, or operating Concave CMS.

## Installation

### `docker compose config` fails

- Ensure Docker Compose v2 is installed (`docker compose version`).
- Copy `.env.example` to `.env` and set at least `VITE_CONVEX_URL` and `BETTER_AUTH_SECRET`.

### `install-smoke.sh` fails on build

- Use Bun 1.x (`curl -fsSL https://bun.sh/install | bash`) or Node 20+ with `npm ci --legacy-peer-deps`.
- Run from the repository root: `bash scripts/install-smoke.sh`.

### Missing `VITE_CONVEX_URL` at Docker build

`VITE_*` variables must be passed as **build args**. Set them in `.env` before `docker compose up --build`.

## Authentication

### Invalid environment variables / auth errors

- `BETTER_AUTH_SECRET` must be at least 16 characters (`openssl rand -base64 32`).
- `BETTER_AUTH_URL` and `SITE_URL` must match the URL users open in the browser (including port).
- For Docker, set `BETTER_AUTH_URL` and `SITE_URL` to your public origin (e.g. `https://cms.example.com`).

### Session expired / redirect loop

- Sign out and sign in again at `/login`.
- Clear site cookies for your domain.
- Confirm `SITE_URL` matches the browser address bar.

### Google sign-in disabled

Leave `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` empty. Email/password auth remains available.

## Convex

### Connection errors / "Failed to fetch"

- Confirm `npx convex dev` or `npx convex deploy` has completed successfully.
- `VITE_CONVEX_URL` must match the URL shown by the Convex CLI.
- Check firewall rules allow outbound HTTPS to `*.convex.cloud`.

### Cloud agents touching your dev deployment

Set `CONVEX_AGENT_MODE=anonymous` when running Convex from CI or cloud coding agents.

## Schema & content

### Cannot access Schema builder

- Schema changes require the **admin** role. The first registered user is promoted to admin automatically.
- Ask an existing admin to change your role if needed.

### Schema apply fails

- Open the validation panel in the schema builder for specific errors.
- Reference fields require a target content type to exist first.
- Destructive changes may require explicit confirmation when entries contain data.

### Content type not visible after apply

- Refresh the Content page or wait a few seconds for reactive queries to update.
- Confirm the schema status badge shows **active**.

## Onboarding

### Onboarding wizard does not appear

- Complete onboarding is hidden after the first published post or when you click **Skip**.
- Admins see onboarding when no published content exists yet.

### Onboarding takes longer than 2 minutes

- Use the suggested **Blog** schema (title + body fields).
- Ensure you have admin permissions before starting.
- See `e2e/onboarding.spec.ts` for the reference flow timing budget.

## E2E / CI

### Playwright hangs

**Do not run `scripts/e2e-server.sh` manually** — it blocks forever. Use:

```bash
npm run test:e2e -- e2e/<spec>.spec.ts
```

See [agent-testing.md](./agent-testing.md).

### Port 3000 in use

```bash
fuser -k 3000/tcp 2>/dev/null || true
pkill -f "convex dev"; pkill -f "vite dev --port 3000"
```

## Backup & restore

### Backup script fails

- Set `CONVEX_URL` and `CONVEX_DEPLOY_KEY` in the environment.
- Run `node scripts/backup.mjs` from the repo root.

### Restore skipped rows

- Run with `--dry-run` first: `node scripts/restore.mjs backups/<ts>/full-snapshot.json --dry-run`
- See [migration-strategy.md](./migration-strategy.md).

## Getting help

1. Check [quickstart.md](./quickstart.md) and [self-hosted.md](./self-hosted.md).
2. Review Convex dashboard logs for backend errors.
3. Open an issue with install method, error message, and redacted env variable names (never secrets).
