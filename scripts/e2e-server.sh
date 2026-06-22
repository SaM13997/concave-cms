#!/usr/bin/env bash
# Playwright webServer entrypoint — blocks forever by design (keeps Convex + Vite alive).
#
# AGENTS: Do NOT run or deeply inspect this script. It will hang your session.
#   • E2E docs (read this instead): docs/agent-testing.md
#   • Run E2E: npm run test:e2e -- e2e/<spec>.spec.ts
#   • Review loop: npm run check && npm run test
set -euo pipefail

if [[ "${PLAYWRIGHT_E2E_SERVER:-}" != "1" ]]; then
  cat >&2 <<'EOF'
ERROR: scripts/e2e-server.sh must not be run directly — it starts long-running servers and blocks forever.

Agents should read docs/agent-testing.md instead of this script.

Run E2E via Playwright:
  npm run test:e2e -- e2e/navigation.spec.ts

Validate without E2E (preferred for review loops):
  npm run check && npm run test
EOF
  exit 1
fi

export CONVEX_AGENT_MODE="${CONVEX_AGENT_MODE:-anonymous}"
export E2E_TEST_SECRET="${E2E_TEST_SECRET:-e2e-test-secret-value-32chars}"
export BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET:-test-better-auth-secret-value-32c}"
export BETTER_AUTH_URL="${BETTER_AUTH_URL:-http://localhost:3000}"
export SITE_URL="${SITE_URL:-http://localhost:3000}"
export VITE_APP_ENV="${VITE_APP_ENV:-development}"

cleanup() {
  pkill -f "convex dev" 2>/dev/null || true
  pkill -f "vite dev --port 3000" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

pkill -f "convex dev" 2>/dev/null || true
pkill -f "vite dev --port 3000" 2>/dev/null || true
sleep 1

cat > .env.local <<EOF
E2E_TEST_SECRET=${E2E_TEST_SECRET}
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
BETTER_AUTH_URL=${BETTER_AUTH_URL}
SITE_URL=${SITE_URL}
VITE_APP_ENV=${VITE_APP_ENV}
EOF

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export E2E_TEST_SECRET BETTER_AUTH_SECRET BETTER_AUTH_URL SITE_URL VITE_APP_ENV

# Convex starts the frontend via --run-sh once the backend push succeeds.
# Playwright polls http://localhost:3000/login until ready (see playwright.config.ts).
exec npx convex dev --run-sh "bash ${ROOT_DIR}/scripts/e2e-start-frontend.sh"
