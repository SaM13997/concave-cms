# Concave CMS — Quickstart

Get a local development environment running in a few minutes.

## Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 20+
- A [Convex](https://convex.dev) account (free tier is fine)

## 1. Clone and install

```bash
git clone <your-repo-url>
cd concave-cms
bun install
```

## 2. Configure environment

Copy the example env file and edit values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CONVEX_URL` | Yes | Convex deployment URL (from `npx convex dev`) |
| `VITE_CONVEX_SITE_URL` | Yes (Better Auth) | Convex site URL for auth (local dev: convex port + 1) |
| `BETTER_AUTH_SECRET` | Yes | Random secret, min 16 chars (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Yes | App origin, e.g. `http://localhost:3000` |
| `SITE_URL` | Yes | Same as `BETTER_AUTH_URL` for local dev |
| `GOOGLE_CLIENT_ID` | No | Leave empty to disable Google sign-in |
| `GOOGLE_CLIENT_SECRET` | No | Required only if Google OAuth is enabled |
| `VITE_APP_ENV` | No | `development` \| `staging` \| `production` (UI banner) |

## 3. Start Convex

In one terminal, start the Convex dev server:

```bash
npx convex dev
```

Copy the deployment URL into `VITE_CONVEX_URL` in `.env.local` if prompted.

For cloud agents or CI, use isolated agent mode:

```bash
CONVEX_AGENT_MODE=anonymous npx convex dev
```

## 4. Start the app

In another terminal:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin routes require sign-in; use **Sign up** on the login page to create your first account.

## 5. Verify

```bash
bun run check   # typecheck + lint
bun run test    # unit tests
bun run test:e2e  # Playwright E2E (auto-starts servers — do not run scripts/e2e-server.sh manually)
```

> **Cloud agents:** Read [`docs/agent-testing.md`](./agent-testing.md) — never run `scripts/e2e-server.sh` directly (it blocks forever).

## Troubleshooting

**Invalid environment variables** — Ensure `BETTER_AUTH_SECRET` is at least 16 characters and URLs are valid (`http://` or `https://`).

**Convex connection errors** — Confirm `VITE_CONVEX_URL` matches the URL from `npx convex dev` and that the Convex process is running.

**Google sign-in disabled** — Leave `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` empty; email/password auth still works.

**Session expired** — Sign in again from `/login`; protected routes redirect automatically when the session ends.
