# Progress Log

## 2026-06-19
- Backend launch-plan work is complete and committed; next up is wiring the admin UI to live Convex APIs instead of mocks.
- Shipped the full Convex backend: auth/RBAC, system tables, schema engine, content CRUD, draft/publish, preview tokens, version history, search, presence, audit APIs, rate limiting, and backup scripts.

## 2026-06-19 (Phase 0–1)
- Added server-side configuration validation for preview tokens, presence TTL, and rate limits.
- Wired Better Auth sessions to CMS user profiles with Admin/Editor roles enforced on every mutation.

## 2026-06-19 (Phase 2)
- Created system tables for schemas, entries, media, audit log, presence, preview tokens, and publish metrics.

## 2026-06-19 (Phase 3–4)
- Built schema descriptor validation, table/field mutations with guardrails, export/import apply workflow, and schema-driven content CRUD with reference resolution.

## 2026-06-19 (Phase 5–8)
- Implemented atomic publish with latency instrumentation, revocable preview URLs, version compare/revert, Cmd+K search with RBAC, presence heartbeats, audit log queries, and Convex export/import backup scripts.
