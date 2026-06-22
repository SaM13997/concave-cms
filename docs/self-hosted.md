# Self-hosted deployment

Concave CMS is a **Convex-native** headless CMS. Self-hosting means you run the admin frontend on your infrastructure while the backend (database, functions, auth) runs on [Convex Cloud](https://convex.dev).

## Requirements

| Component | Requirement |
|-----------|-------------|
| **Convex** | Free or paid Convex account + deployment |
| **Runtime** | [Bun](https://bun.sh) 1.x or Node.js 20+ (local dev) |
| **Docker** (optional) | Docker Engine 24+ and Docker Compose v2 |
| **Secrets** | `BETTER_AUTH_SECRET` (≥16 chars), `PREVIEW_SECRET` (recommended) |
| **Network** | Outbound HTTPS to Convex; inbound HTTP(S) for admin users |

## Supported install methods

### Method 1 — Local development (recommended for evaluation)

See [quickstart.md](./quickstart.md):

```bash
make install          # or: bun install && cp .env.example .env.local
npx convex dev        # terminal 1 — deploys backend to your Convex project
bun run dev           # terminal 2 — admin UI at http://localhost:3000
```

### Method 2 — Docker Compose (production frontend)

1. Create a Convex deployment and deploy backend functions:

   ```bash
   npx convex login
   npx convex deploy
   ```

2. Configure environment:

   ```bash
   cp .env.example .env
   # Set VITE_CONVEX_URL, VITE_CONVEX_SITE_URL, BETTER_AUTH_SECRET, SITE_URL, BETTER_AUTH_URL
   ```

3. Build and run:

   ```bash
   docker compose up --build
   ```

   Or via Make:

   ```bash
   make docker-up
   ```

4. Open `http://localhost:3000`, sign up, and complete the in-product onboarding wizard.

> **Note:** `VITE_*` variables are baked in at **image build time**. Rebuild the image after changing Convex URLs.

### Method 3 — Manual production build

```bash
bun install --frozen-lockfile
cp .env.example .env.local   # configure VITE_* and auth secrets
bun run build
node .output/server/index.mjs
```

Set `PORT` and `HOST` as needed (default `3000` / `0.0.0.0`).

## Environment variables

See [`.env.example`](../.env.example) for the full list. Critical variables:

| Variable | Purpose |
|----------|---------|
| `VITE_CONVEX_URL` | Convex deployment URL (`.convex.cloud`) |
| `VITE_CONVEX_SITE_URL` | Convex HTTP actions URL (`.convex.site`) |
| `BETTER_AUTH_SECRET` | Session signing secret |
| `BETTER_AUTH_URL` / `SITE_URL` | Public origin of the admin app |
| `CONVEX_DEPLOY_KEY` | CI/CD deploy key (not needed for `convex dev`) |

## First user

The **first account** created on a fresh deployment is automatically assigned the **admin** role so you can run schema setup and onboarding without manual promotion.

## Verify installation

```bash
bash scripts/install-smoke.sh   # clean-environment smoke (no servers)
bun run check && bun run test   # typecheck, lint, unit tests
```

## Related docs

- [Quickstart](./quickstart.md) — local development
- [Troubleshooting](./troubleshooting.md) — common issues
- [Upgrade](./upgrade.md) / [Rollback](./rollback.md) — release operations
- [Migration strategy](./migration-strategy.md) — data and schema migrations
