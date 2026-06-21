#!/usr/bin/env bash
# Starts Convex dev + Vite for Playwright E2E tests.
set -euo pipefail

export CONVEX_AGENT_MODE="${CONVEX_AGENT_MODE:-anonymous}"
export E2E_TEST_SECRET="${E2E_TEST_SECRET:-e2e-test-secret-value-32chars}"
export BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET:-test-better-auth-secret-value-32c}"
export BETTER_AUTH_URL="${BETTER_AUTH_URL:-http://localhost:3000}"
export SITE_URL="${SITE_URL:-http://localhost:3000}"
export VITE_APP_ENV="${VITE_APP_ENV:-development}"

cleanup() {
  if [[ -n "${CONVEX_PID:-}" ]]; then
    kill "$CONVEX_PID" 2>/dev/null || true
  fi
  if [[ -n "${VITE_PID:-}" ]]; then
    kill "$VITE_PID" 2>/dev/null || true
  fi
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

CONVEX_LOG="$(mktemp)"
npx convex dev >"$CONVEX_LOG" 2>&1 &
CONVEX_PID=$!

echo "Waiting for Convex dev..."
for _ in $(seq 1 120); do
  if grep -q "Convex functions ready" "$CONVEX_LOG" 2>/dev/null; then
    echo "Convex is ready"
    npx convex env set E2E_TEST_SECRET "${E2E_TEST_SECRET}" >/dev/null 2>&1 || true
    break
  fi
  if ! kill -0 "$CONVEX_PID" 2>/dev/null; then
    echo "Convex dev exited unexpectedly:"
    cat "$CONVEX_LOG"
    exit 1
  fi
  sleep 1
done

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local after convex dev"
  cat "$CONVEX_LOG"
  exit 1
fi

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

bun run dev >"${CONVEX_LOG}.vite" 2>&1 &
VITE_PID=$!

echo "Waiting for app at http://localhost:3000..."
for _ in $(seq 1 120); do
  if curl -sf "http://localhost:3000/login" >/dev/null 2>&1; then
    echo "App is ready at http://localhost:3000 (Convex: ${VITE_CONVEX_URL})"
    break
  fi
  if ! kill -0 "$VITE_PID" 2>/dev/null; then
    echo "Vite exited unexpectedly:"
    cat "${CONVEX_LOG}.vite"
    exit 1
  fi
  sleep 1
done

wait "$VITE_PID"
