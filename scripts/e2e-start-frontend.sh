#!/usr/bin/env bash
# Invoked by `npx convex dev --run-sh` after the Convex backend is ready.
set -euo pipefail

npx convex env set E2E_TEST_SECRET "${E2E_TEST_SECRET}" >/dev/null 2>&1 || true

set -a
# shellcheck disable=SC1091
source .env.local
set +a

if [[ -z "${VITE_CONVEX_SITE_URL:-}" && "${VITE_CONVEX_URL:-}" =~ :([0-9]+)$ ]]; then
  CONVEX_PORT="${BASH_REMATCH[1]}"
  VITE_CONVEX_SITE_URL="${VITE_CONVEX_URL%:*}:$((CONVEX_PORT + 1))"
  export VITE_CONVEX_SITE_URL
fi

export E2E_TEST_SECRET BETTER_AUTH_SECRET BETTER_AUTH_URL SITE_URL VITE_APP_ENV VITE_CONVEX_URL VITE_CONVEX_SITE_URL

exec npm run dev
