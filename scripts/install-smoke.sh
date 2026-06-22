#!/usr/bin/env bash
# Clean-environment install smoke test (Phase 9).
# Validates packaging, dependencies, and build without starting long-running servers.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> install-smoke: validating packaging files"
required_files=(
  docker-compose.yml
  Dockerfile
  .env.example
  docs/quickstart.md
  docs/troubleshooting.md
  docs/self-hosted.md
  CHANGELOG.md
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "ERROR: missing required file: $file" >&2
    exit 1
  fi
done

echo "==> install-smoke: docker compose config"
if command -v docker >/dev/null 2>&1; then
  docker compose config >/dev/null
else
  echo "WARN: docker not installed; skipping compose config validation"
fi

echo "==> install-smoke: install dependencies"
if command -v bun >/dev/null 2>&1; then
  bun install --frozen-lockfile
  RUNNER=bun
else
  npm ci --legacy-peer-deps
  RUNNER=npm
fi

echo "==> install-smoke: typecheck + lint"
if [[ "$RUNNER" == "bun" ]]; then
  bun run check
else
  npm run check
fi

echo "==> install-smoke: production build"
if [[ "$RUNNER" == "bun" ]]; then
  bun run build
else
  npm run build
fi

echo "==> install-smoke: unit tests"
if [[ "$RUNNER" == "bun" ]]; then
  bun run test
else
  npm run test
fi

if [[ ! -f .output/server/index.mjs ]]; then
  echo "ERROR: build did not produce .output/server/index.mjs" >&2
  exit 1
fi

echo "==> install-smoke: PASS"
