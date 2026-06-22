.PHONY: install check test build verify install-smoke docker-up docker-down

install:
	bun install --frozen-lockfile
	@test -f .env.local || cp .env.example .env.local
	@echo "Edit .env.local with your Convex URL and auth secrets, then run: npx convex dev (terminal 1) && bun run dev (terminal 2)"

check:
	bun run check

test:
	bun run test

build:
	bun run build

verify:
	bun run verify

install-smoke:
	bash scripts/install-smoke.sh

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down
