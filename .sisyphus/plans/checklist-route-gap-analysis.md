# Dev Checklist Route + Launch Gap Analysis

## TL;DR
> **Summary**: Add repo workflow artifacts and a dev-only live checklist route that turns `docs/requirements.md` + `docs/launch-plan.md` into a traceable macro/micro development review surface.
> **Deliverables**:
> - Root `featureList.json` seeded conservatively from requirements and launch plan.
> - `docs/gap-analysis.md` durable report.
> - Root `AGENTS.md` with exact project rules and changelog maintenance rule.
> - Root lowercase `changelog.md` with actioned-item entries only.
> - `/dev/checklist` route at `src/routes/dev/checklist.tsx`.
> - Focused Vitest/build verification plus agent-browser evidence.
> **Effort**: Medium
> **Parallel**: YES - 2 implementation waves + final verification wave
> **Critical Path**: Task 1 → Task 4 → Final Verification

## Context
### Original Request
- Verify and perform a gap-analysis review for `docs/launch-plan.md` and `docs/requirements.md`.
- Create a checklist route with all context and macro/micro developer review capability.
- Create an `AGENTS.md`.
- Add `changelog.md` maintenance rule in `AGENTS.md`.
- Include the supplied Core Rules in `AGENTS.md`.

### Interview Summary
- Checklist route behavior: **live progress tool**.
- Checklist route access: **dev-only**.
- Gap analysis output: **both** durable markdown report and route-visible gap categories.
- Test strategy: **Vitest + build + agent-browser**; do not add Playwright as a dependency.
- Create root `featureList.json`, seeded from the requirements and launch plan.

### Metis Review (gaps addressed)
- Exact durable report path fixed: `docs/gap-analysis.md`.
- Exact data source fixed: root `featureList.json`; route must not parse Markdown at runtime.
- Exact route fixed: `src/routes/dev/checklist.tsx` for `/dev/checklist`.
- Exact status taxonomy fixed: `planned`, `in_progress`, `blocked`, `implemented`, `verified`, `deferred`.
- Exact gap taxonomy fixed: `missing_traceability`, `missing_acceptance_criteria`, `missing_evidence`, `implementation_gap`, `test_gap`, `documentation_gap`, `launch_gate_gap`.
- Dev-only behavior fixed: `/dev/checklist` must not expose internal state outside dev mode.
- Scope guardrail fixed: read-only checklist route, not an admin dashboard/editor.

## Work Objectives
### Core Objective
Create a conservative, evidence-driven launch checklist system that lets the user review development progress at:
- **Macro level**: launch phases, release gates, requirement coverage, top risks.
- **Micro level**: individual requirements/features, acceptance criteria, evidence, gaps, test state, and changelog/featureList hygiene.

### Deliverables
- `featureList.json` at repo root.
- `docs/gap-analysis.md`.
- `AGENTS.md` at repo root.
- `changelog.md` at repo root.
- `src/routes/dev/checklist.tsx`.
- Optional focused test file(s) only if needed for deterministic verification, following existing Vitest setup.
- Evidence files under `.sisyphus/evidence/`.

### Definition of Done (verifiable conditions with commands)
- `node -e "JSON.parse(require('fs').readFileSync('featureList.json','utf8')); console.log('valid')"` prints `valid`.
- `npm run test` exits 0.
- `npm run build` exits 0.
- Agent-browser QA captures `/dev/checklist` in dev mode and verifies required macro/micro sections.
- Production-mode verification confirms `/dev/checklist` does not expose internal checklist content.
- `AGENTS.md` contains the exact supplied Core Rules and changelog maintenance rule.
- `changelog.md` contains only dated, actioned item(s), not plan updates.

### Must Have
- Conservative seeding: no item may be `verified` without concrete evidence.
- Route-visible sections: requirement coverage, launch gates/phase status, gap categories, evidence/test status, changelog/featureList hygiene.
- `featureList.json` must cite both `docs/requirements.md` and `docs/launch-plan.md`.
- The route must be read-only.
- The route must be dev-only.
- The executor must provide a commit message in chat only; do not create a commit.

### Must NOT Have
- No Playwright/Cypress dependency addition.
- No CI setup.
- No lint/typecheck script addition unless already present.
- No admin dashboard/auth expansion.
- No route beyond `/dev/checklist` for this request.
- No runtime Markdown parsing for checklist state.
- No false completion labels.
- No changelog entries for plans or plan updates.

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: Vitest/build using existing scripts, plus agent-browser QA.
- Existing commands from `package.json`: `npm run test` → `vitest run`; `npm run build` → `vite build`.
- QA policy: Every task has agent-executed scenarios.
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`.

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. This plan is intentionally smaller; Wave 1 contains independent artifact tasks, Wave 2 contains route/test work that depends on `featureList.json`.

Wave 1:
- Task 1 — Create seeded `featureList.json`.
- Task 2 — Create `docs/gap-analysis.md`.
- Task 3 — Create `AGENTS.md` and `changelog.md`.

Wave 2:
- Task 4 — Create dev-only `/dev/checklist` route.
- Task 5 — Add focused tests/verification fixtures if needed and run build/test.
- Task 6 — Agent-browser QA and production non-exposure verification.

### Dependency Matrix (full, all tasks)
| Task | Depends On | Blocks |
|---|---|---|
| 1 | None | 4, 5, 6 |
| 2 | None | 4, 6 |
| 3 | None | 6 |
| 4 | 1, 2 | 5, 6 |
| 5 | 1, 4 | 6 |
| 6 | 1, 2, 3, 4, 5 | Final Verification |

### Agent Dispatch Summary (wave → task count → categories)
| Wave | Count | Categories |
|---|---:|---|
| 1 | 3 | writing, quick |
| 2 | 3 | quick, unspecified-high |
| Final | 4 | oracle, unspecified-high, deep |

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. Create seeded root `featureList.json`

  **What to do**: Create `featureList.json` at repo root as the single live progress data source for `/dev/checklist`. Seed it from `docs/requirements.md` and `docs/launch-plan.md` without claiming completed work. Use this exact top-level shape:
  ```json
  {
    "version": 1,
    "lastUpdated": "2026-06-15",
    "sources": ["docs/requirements.md", "docs/launch-plan.md"],
    "statusValues": ["planned", "in_progress", "blocked", "implemented", "verified", "deferred"],
    "gapCategories": ["missing_traceability", "missing_acceptance_criteria", "missing_evidence", "implementation_gap", "test_gap", "documentation_gap", "launch_gate_gap"],
    "features": [],
    "launchGates": [],
    "hygieneChecks": []
  }
  ```
  Populate `features` with entries for every requirement ID in `docs/requirements.md`: `RQ-001`, `RQ-002`, `RQ-003`, `RQ-010`, `RQ-011`, `RQ-012`, `RQ-013`, `RQ-100`, `RQ-101`, `RQ-102`, `RQ-110`, `RQ-111`, `RQ-112`, `RQ-120`, `RQ-121`, `RQ-130`, `RQ-131`, `RQ-200`, `RQ-201`, `RQ-202`, `RQ-203`, `RQ-210`, `RQ-211`, `RQ-220`, `RQ-221`, `RQ-222`, `RQ-300`, `RQ-301`, `RQ-302`, `RQ-303`, `RQ-310`, `RQ-311`, `RQ-320`, `RQ-321`, `RQ-322`, `RQ-323`, `RQ-330`, `RQ-331`, `RQ-400`, `RQ-401`, `RQ-402`, `RQ-403`, `RQ-410`, `RQ-411`, `RQ-412`, `RQ-413`, `RQ-500`, `RQ-510`, `RQ-520`. Each feature object must include: `id`, `title`, `source`, `category`, `phase`, `status`, `acceptanceCriteria`, `evidence`, `gaps`, `launchPlanRefs`, `notes`. Default `status` to `planned`. Default `evidence` to `[]`. Add `missing_evidence` and `implementation_gap` gaps to every seeded item unless there is concrete implementation evidence in the repo.

  Populate `launchGates` from `docs/launch-plan.md` lines 43-67 and phases/steps from lines 71-318. Each launch gate object must include: `id`, `title`, `source`, `status`, `relatedFeatureIds`, `acceptanceCriteria`, `evidence`, `gaps`. Use IDs like `LG-001`, `LG-002`, etc. Default gate `status` to `planned` unless evidence exists.

  Populate `hygieneChecks` with exactly these objects: `HC-001` featureList updated, `HC-002` changelog updated, `HC-003` acceptance criteria satisfied before completion, `HC-004` one pending feature at a time, `HC-005` commit message produced in chat only. Each hygiene object must include: `id`, `title`, `status`, `source`, `evidence`, `gaps`. Default `status` to `planned`.

  **Must NOT do**: Do not mark any item `verified`. Do not invent implementation evidence. Do not parse Markdown at runtime as route state.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: structured data creation from existing docs with conservative wording.
  - Skills: [] - No special skill needed.
  - Omitted: [`playwright`] - Browser tooling is not needed for JSON seeding.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4, 5, 6 | Blocked By: none

  **References**:
  - Source: `docs/requirements.md:20-24` - success metrics to seed macro review.
  - Source: `docs/requirements.md:30-187` - full requirement IDs and titles.
  - Source: `docs/launch-plan.md:43-67` - launch definition and release checklist.
  - Source: `docs/launch-plan.md:71-318` - launch phases and steps.

  **Acceptance Criteria**:
  - [ ] `featureList.json` exists at repo root.
  - [ ] `node -e "const f=JSON.parse(require('fs').readFileSync('featureList.json','utf8')); if(!Array.isArray(f.features)||f.features.length!==49) throw new Error('expected 49 requirement features'); console.log('valid')"` prints `valid`.
  - [ ] `node -e "const f=JSON.parse(require('fs').readFileSync('featureList.json','utf8')); if(f.features.some(x=>x.status==='verified')) throw new Error('no seeded verified items allowed'); console.log('conservative')"` prints `conservative`.
  - [ ] `node -e "const f=JSON.parse(require('fs').readFileSync('featureList.json','utf8')); for (const s of ['docs/requirements.md','docs/launch-plan.md']) if(!f.sources.includes(s)) throw new Error('missing '+s); console.log('sources-ok')"` prints `sources-ok`.
  - [ ] `node -e "const f=JSON.parse(require('fs').readFileSync('featureList.json','utf8')); for (const g of f.launchGates) for (const k of ['id','title','source','status','relatedFeatureIds','acceptanceCriteria','evidence','gaps']) if(!(k in g)) throw new Error('launchGate missing '+k); if(!f.launchGates.length) throw new Error('expected launch gates'); console.log('launch-gates-ok')"` prints `launch-gates-ok`.
  - [ ] `node -e "const f=JSON.parse(require('fs').readFileSync('featureList.json','utf8')); const ids=f.hygieneChecks.map(x=>x.id).sort().join(','); if(ids!=='HC-001,HC-002,HC-003,HC-004,HC-005') throw new Error(ids); console.log('hygiene-ok')"` prints `hygiene-ok`.

  **QA Scenarios**:
  ```
  Scenario: Seeded JSON is valid and conservative
    Tool: Bash
    Steps: Run all node validation commands from Acceptance Criteria.
    Expected: Commands exit 0 and print valid/conservative/sources-ok.
    Evidence: .sisyphus/evidence/task-1-feature-list-json.txt

  Scenario: Invalid status cannot slip into seeded data
    Tool: Bash
    Steps: Run `node -e "const f=JSON.parse(require('fs').readFileSync('featureList.json','utf8')); const allowed=new Set(f.statusValues); const bad=f.features.filter(x=>!allowed.has(x.status)); if(bad.length) throw new Error(JSON.stringify(bad.map(x=>x.id))); console.log('statuses-ok')"`.
    Expected: Command exits 0 and prints `statuses-ok`.
    Evidence: .sisyphus/evidence/task-1-feature-list-statuses.txt
  ```

  **Commit**: NO | Message: `feat(dev): seed launch checklist feature list` | Files: [`featureList.json`]

- [ ] 2. Create durable `docs/gap-analysis.md`

  **What to do**: Create `docs/gap-analysis.md` as the human-readable gap analysis report. Include sections: `Summary`, `Coverage Matrix`, `Requirement Gaps`, `Launch Plan Gaps`, `Risk Register`, `Recommended Next Actions`. The report must state that requirements are documented but implementation evidence is not yet present unless evidence is discovered. Include these specific initial gap findings:
  - Missing machine-readable traceability/status/evidence matrix before this work.
  - `RQ-001` zero-sync is stated in requirements but needs an explicit no-manual-sync acceptance check.
  - `RQ-003` database-interface framing is broad and needs route/workflow acceptance criteria.
  - `RQ-010` TypeScript schema support needs explicit implementation evidence beyond ADR planning.
  - `RQ-013` Convex typing compatibility needs concrete contract tests.
  - `RQ-130`/`RQ-131` lock-into-code needs exact artifact/apply ownership criteria.
  - `RQ-211` preview of live frontend needs a defined frontend preview fixture or integration target.
  - `RQ-331` successful deployment toast needs clarification of what deployment event means in this self-hosted CMS.
  - Launch release gates exist, but there is no evidence file/status linkage yet.

  **Must NOT do**: Do not claim gaps are fixed by writing the report. Do not move requirements or launch-plan content. Do not create plan-update changelog entries.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: documentation synthesis and traceability reporting.
  - Skills: [] - No special skill needed.
  - Omitted: [`frontend-design`] - This task is documentation, not UI design.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4, 6 | Blocked By: none

  **References**:
  - Requirement source: `docs/requirements.md:20-24` - metrics.
  - Requirement source: `docs/requirements.md:30-187` - RQ catalog.
  - Launch source: `docs/launch-plan.md:38-67` - release gates.
  - Launch source: `docs/launch-plan.md:71-318` - phase plan.

  **Acceptance Criteria**:
  - [ ] `docs/gap-analysis.md` exists.
  - [ ] `grep -q "Coverage Matrix" docs/gap-analysis.md` exits 0.
  - [ ] `grep -q "RQ-001" docs/gap-analysis.md` exits 0.
  - [ ] `grep -q "RQ-520" docs/gap-analysis.md` exits 0.
  - [ ] `grep -q "missing_evidence" docs/gap-analysis.md` exits 0.

  **QA Scenarios**:
  ```
  Scenario: Report contains macro and micro review anchors
    Tool: Bash
    Steps: Run grep checks for Summary, Coverage Matrix, Requirement Gaps, Launch Plan Gaps, Risk Register, Recommended Next Actions.
    Expected: Every grep exits 0.
    Evidence: .sisyphus/evidence/task-2-gap-analysis-anchors.txt

  Scenario: Report does not falsely claim implementation completion
    Tool: Bash
    Steps: Run `! grep -E "all requirements (are )?(complete|implemented|verified)" docs/gap-analysis.md`.
    Expected: Command exits 0 because no false completion claim exists.
    Evidence: .sisyphus/evidence/task-2-gap-analysis-no-false-complete.txt
  ```

  **Commit**: NO | Message: `docs: add launch requirements gap analysis` | Files: [`docs/gap-analysis.md`]

- [ ] 3. Create root `AGENTS.md` and lowercase `changelog.md`

  **What to do**: Create root `AGENTS.md` containing this exact `## Core Rules` section. Preserve rule numbering exactly as supplied, including the skipped number 5 and original wording:

  ```md
  ## Core Rules

  1. Work on only **one** pending feature at a time.
  2. Do not mark a feature as complete unless its acceptance criteria are satisfied.
  3. Update both `featureList.json` and `changelog.md` after each work session.
  4. Prefer small, testable changes over large multi-part edits.
  6. Create a commit message (only the message, in chat. not the actual commit) for work
  7. After finishing a change/modifiation request write a brief, no-specific-code mention one liner in changelog.md. Add a date for that day if not there already. No plans and their updates. only actioned items.
  ```

  Create root lowercase `changelog.md` if missing. Add date heading `## 2026-06-15` if absent, then add this exact actioned-item bullet for the implementation only, not for the plan: `- Added dev launch checklist workflow artifacts for requirements traceability and progress review.`

  **Must NOT do**: Do not create `CHANGELOG.md` uppercase. Do not add plan updates to changelog. Do not create a git commit.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: small repo-root documentation artifacts.
  - Skills: [] - No special skill needed.
  - Omitted: [`git-master`] - User requested commit message only, not a real commit.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 6 | Blocked By: none

  **References**:
  - User supplied Core Rules in current request.
  - `docs/launch-plan.md:315-318` - release checklist/versioning mentions changelog and upgrade notes.

  **Acceptance Criteria**:
  - [ ] `AGENTS.md` exists at repo root.
  - [ ] `changelog.md` exists at repo root.
  - [ ] `grep -q "Work on only \*\*one\*\* pending feature at a time" AGENTS.md` exits 0.
  - [ ] `grep -q "featureList.json" AGENTS.md` exits 0.
  - [ ] `grep -q "changelog.md" AGENTS.md` exits 0.
  - [ ] `grep -q "## 2026-06-15" changelog.md` exits 0.
  - [ ] `grep -Fq -- "- Added dev launch checklist workflow artifacts for requirements traceability and progress review." changelog.md` exits 0.
  - [ ] `node -e "const s=require('fs').readFileSync('changelog.md','utf8'); const m=s.match(/## 2026-06-15\\n([\\s\\S]*?)(\\n## |$)/); if(!m) throw new Error('missing date section'); const bullets=m[1].split('\\n').filter(l=>l.trim().startsWith('- ')); if(!bullets.includes('- Added dev launch checklist workflow artifacts for requirements traceability and progress review.')) throw new Error('missing expected bullet'); if(bullets.some(l=>/plan/i.test(l))) throw new Error('new bullet mentions plan'); console.log('changelog-ok')"` prints `changelog-ok`.

  **QA Scenarios**:
  ```
  Scenario: Root agent rules exist
    Tool: Bash
    Steps: Run the grep commands from Acceptance Criteria against AGENTS.md.
    Expected: Every grep exits 0.
    Evidence: .sisyphus/evidence/task-3-agents-rules.txt

  Scenario: Changelog contains only actioned implementation item
    Tool: Bash
    Steps: Read `changelog.md` and verify it has today's heading plus an implementation bullet with no plan-update wording.
    Expected: Date exists and no new bullet mentions planning-only activity.
    Evidence: .sisyphus/evidence/task-3-changelog-hygiene.txt
  ```

  **Commit**: NO | Message: `docs: add project agent rules and changelog` | Files: [`AGENTS.md`, `changelog.md`]

- [ ] 4. Create read-only dev route `/dev/checklist`

  **What to do**: Add `src/routes/dev/checklist.tsx` as the only new route. Follow TanStack file-route convention used by `src/routes/index.tsx` and `src/routes/login.tsx`. The route must read checklist data from root `featureList.json` only through conditional dev-only loading. Do **not** use a top-level static JSON import that can bundle requirement details into production assets. Use an implementation shape equivalent to: first check `import.meta.env.DEV`; outside dev render only a generic not-found/unavailable state; inside dev dynamically import/load the checklist data or use a dev-only helper that production builds can tree-shake. Do not parse Markdown at runtime. Render a read-only page with these visible sections:
  - Page heading: `Launch checklist`.
  - Requirement coverage: totals by status and all requirement IDs.
  - Launch gates / phase status: launch definition and release checklist progress.
  - Gap categories: grouped counts for all allowed gap categories.
  - Evidence / test status: evidence count and missing evidence list.
  - Changelog / feature list hygiene: confirms root `featureList.json`, `AGENTS.md`, and `changelog.md` expectations.
  - Macro review panel: phase readiness, top launch risks, launch-gate gaps.
  - Micro review panel: per-requirement rows/cards showing status, acceptance criteria count, evidence count, and gaps.

  Implement dev-only behavior so production builds do not expose internal checklist content. Prefer a route-level guard using the app's available environment signal (for example `import.meta.env.DEV`) that renders a 404-equivalent or minimal `Not found` state outside dev. The production state must not include requirement details, gap details, or internal file names.

  **Must NOT do**: Do not make the route editable. Do not add authentication/admin scope. Do not add another route. Do not include internal checklist data in production-rendered HTML.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: one route using existing UI conventions.
  - Skills: [`vercel-react-best-practices`] - Use only if loaded by executor for React rendering hygiene.
  - Omitted: [`frontend-design`] - This is an internal functional review route, not a visual redesign.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 5, 6 | Blocked By: 1, 2

  **References**:
  - Pattern: `src/routes/index.tsx` - `createFileRoute`, page composition, Tailwind cards.
  - Pattern: `src/routes/login.tsx` - minimal route component shape.
  - Pattern: `src/routes/__root.tsx` - root layout and app shell context.
  - UI Pattern: `src/components/ui/button.tsx` - shadcn-style `data-slot`, `cn`, and variant conventions.
  - Data: `featureList.json` - route source of truth.
  - Report: `docs/gap-analysis.md` - gap categories and explanatory copy.

  **Acceptance Criteria**:
  - [ ] `src/routes/dev/checklist.tsx` exists.
  - [ ] `grep -q "Launch checklist" src/routes/dev/checklist.tsx` exits 0.
  - [ ] `grep -q "Requirement coverage" src/routes/dev/checklist.tsx` exits 0.
  - [ ] `grep -q "Launch gates" src/routes/dev/checklist.tsx` exits 0.
  - [ ] `grep -q "Gap categories" src/routes/dev/checklist.tsx` exits 0.
  - [ ] `grep -q "Evidence" src/routes/dev/checklist.tsx` exits 0.
  - [ ] `grep -q "Changelog" src/routes/dev/checklist.tsx` exits 0.
  - [ ] `grep -Eq "import\.meta\.env\.DEV|NODE_ENV|Not found|notFound" src/routes/dev/checklist.tsx` exits 0.
  - [ ] `! grep -Eq "^import .*featureList|from ['\"]../../../featureList\.json['\"]|from ['\"]../../featureList\.json['\"]" src/routes/dev/checklist.tsx` exits 0.
  - [ ] `npm run build` exits 0.
  - [ ] `find dist .output -type f 2>/dev/null | xargs grep -h "RQ-001"` exits non-zero after production build, proving representative internal requirement data is not present in built assets.

  **QA Scenarios**:
  ```
  Scenario: Dev checklist renders required review sections
    Tool: agent-browser
    Steps: Start dev server with `npm run dev`; visit `/dev/checklist`; capture page text/screenshot.
    Expected: Page shows Launch checklist, Requirement coverage, Launch gates, Gap categories, Evidence, Changelog, Macro review, and Micro review.
    Evidence: .sisyphus/evidence/task-4-dev-checklist-render.png

  Scenario: Production mode does not expose internal checklist details
    Tool: Bash + agent-browser
    Steps: Run `npm run build`, serve production preview with `npm run serve`, visit `/dev/checklist`, capture page text/screenshot.
    Expected: Page is not available or shows only a generic not-found/unavailable state; it does not show requirement IDs or gap details.
    Evidence: .sisyphus/evidence/task-4-dev-checklist-production-guard.png
  ```

  **Commit**: NO | Message: `feat(dev): add read-only launch checklist route` | Files: [`src/routes/dev/checklist.tsx`]

- [ ] 5. Add focused route/data verification without new dependencies

  **What to do**: Add the smallest focused Vitest coverage needed to make route/data behavior deterministic. If existing Vitest setup can test pure helper functions more reliably than the full route, extract tiny non-UI helpers next to the route only if necessary (for example status counts and gap counts). Keep code surgical. Tests must verify:
  - Allowed statuses reject unknown values.
  - Seeded `featureList.json` has all 49 RQ entries.
  - `verified` is not used for seeded items without evidence.
  - Gap categories shown by route match the allowed taxonomy.
  If full React route tests are straightforward with existing Testing Library + jsdom, include one render test for required section headings. If route test setup becomes complex, prefer pure helper tests and rely on agent-browser for route rendering.

  **Must NOT do**: Do not add dependencies. Do not add Playwright. Do not introduce a broad test architecture. Do not add lint/typecheck scripts.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: focused tests/helper extraction only.
  - Skills: [] - No special skill required.
  - Omitted: [`test-driven-development`] - This is tests-after for a small internal route, per user decision.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 6 | Blocked By: 1, 4

  **References**:
  - Script: `package.json` - `test` is `vitest run`; `build` is `vite build`.
  - Dependencies: `package.json` - Vitest, jsdom, Testing Library are already present.
  - Route: `src/routes/dev/checklist.tsx`.
  - Data: `featureList.json`.

  **Acceptance Criteria**:
  - [ ] `npm run test` exits 0.
  - [ ] `npm run build` exits 0.
  - [ ] No dependency files are changed only to add browser/e2e tooling.
  - [ ] If a test file is added, it is focused on checklist data/route behavior and does not require network services.

  **QA Scenarios**:
  ```
  Scenario: Existing test command validates checklist invariants
    Tool: Bash
    Steps: Run `npm run test`.
    Expected: Command exits 0.
    Evidence: .sisyphus/evidence/task-5-npm-test.txt

  Scenario: Production build remains valid
    Tool: Bash
    Steps: Run `npm run build`.
    Expected: Command exits 0.
    Evidence: .sisyphus/evidence/task-5-npm-build.txt
  ```

  **Commit**: NO | Message: `test(dev): verify launch checklist data invariants` | Files: [`src/routes/dev/checklist.tsx`, `featureList.json`, optional focused test/helper files]

- [ ] 6. Perform final implementation hygiene and agent-browser review

  **What to do**: Run the route through the macro/micro review flow as an agent. Verify artifacts align with the user's maintenance rules:
  - `featureList.json` contains seeded items and conservative statuses.
  - `docs/gap-analysis.md` explains gaps without claiming completion.
  - `AGENTS.md` contains exact Core Rules and changelog rule.
  - `changelog.md` has a dated actioned-item entry only.
  - `/dev/checklist` visually supports macro review and micro review.
  - Executor's final chat includes a commit message only, not an actual commit.

  **Must NOT do**: Do not mark work complete before final verification agents approve and user gives explicit okay. Do not create a git commit.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: cross-file QA and browser inspection.
  - Skills: [`playwright`] - Built-in browser automation only; do not add repo dependency.
  - Omitted: [`git-master`] - No git operation should be performed.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: Final Verification | Blocked By: 1, 2, 3, 4, 5

  **References**:
  - `featureList.json` - live progress source.
  - `docs/gap-analysis.md` - durable report.
  - `AGENTS.md` - workflow rules.
  - `changelog.md` - actioned implementation log.
  - `src/routes/dev/checklist.tsx` - dev route.

  **Acceptance Criteria**:
  - [ ] All Task 1-5 acceptance criteria are satisfied.
  - [ ] Agent-browser dev screenshot/text evidence exists.
  - [ ] Agent-browser production-guard screenshot/text evidence exists.
  - [ ] Final response draft includes commit message: `feat(dev): add launch checklist review workflow`.
  - [ ] All verification evidence is generated by agents; user approval is a final handoff gate only, not a verification acceptance criterion.
  - [ ] `git diff --name-only` includes only expected implementation files for this request.

  **QA Scenarios**:
  ```
  Scenario: Macro review is possible from route
    Tool: agent-browser
    Steps: Visit `/dev/checklist` in dev mode; inspect top-level sections.
    Expected: The route exposes phase readiness, launch gates, coverage totals, and top gaps without needing to open docs manually.
    Evidence: .sisyphus/evidence/task-6-macro-review.png

  Scenario: Micro review is possible from route
    Tool: agent-browser
    Steps: Search or scan for representative items `RQ-001`, `RQ-130`, `RQ-331`, and `RQ-520`.
    Expected: Each item shows status, acceptance criteria count/details, evidence status, and gap category information.
    Evidence: .sisyphus/evidence/task-6-micro-review.png
  ```

  **Commit**: NO | Message: `feat(dev): add launch checklist review workflow` | Files: [`featureList.json`, `docs/gap-analysis.md`, `AGENTS.md`, `changelog.md`, `src/routes/dev/checklist.tsx`, optional focused test/helper files]

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE using agent-executed evidence only.
> Mark F1-F4 checked when each review agent approves with evidence.
> Present consolidated results to user after F1-F4 pass and request explicit "okay" as a post-verification handoff gate before declaring the overall work complete.
> User approval is not a substitute for, or part of, any verification acceptance criterion.
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ browser QA for `/dev/checklist`)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- Do not create an actual git commit.
- At completion, provide only this commit message in chat unless implementation scope changes: `feat(dev): add launch checklist review workflow`
- Ensure `changelog.md` records actioned implementation items only, dated `2026-06-15` if that date section does not already exist.

## Success Criteria
- User can run `/start-work` against this plan without making implementation decisions.
- The resulting route provides live macro/micro development review context from `featureList.json`.
- Gap analysis is durable in `docs/gap-analysis.md` and visible in the route.
- Workflow rules are codified in `AGENTS.md`.
- Maintenance hygiene is enforced through `featureList.json` + `changelog.md` rules.
