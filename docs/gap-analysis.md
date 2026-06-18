# Dev Checklist Route + Launch Gap Analysis

## Summary

The requirements and launch plan provide broad product and release coverage, but they did not previously provide a machine-readable traceability, status, evidence, and gap matrix. This report records the initial gap analysis and is mirrored by the dev-only checklist route through `featureList.json`.

Requirements are documented from `RQ-001` through `RQ-520`, but implementation evidence is not yet linked for the seeded checklist items. The initial default gap posture is therefore conservative: `missing_evidence` and `implementation_gap` remain present until concrete code, tests, or release artifacts are attached.

## Coverage Matrix

| Area | Requirement Range | Source | Initial Coverage State | Primary Gap |
|---|---|---|---|---|
| Convex-native foundation | `RQ-001`-`RQ-013` | `docs/requirements.md` | Requirements documented | `missing_evidence` |
| Visual Schema Engine | `RQ-100`-`RQ-131` | `docs/requirements.md` | Requirements documented | `implementation_gap` |
| Content lifecycle | `RQ-200`-`RQ-222` | `docs/requirements.md` | Requirements documented | `test_gap` |
| Admin experience | `RQ-300`-`RQ-331` | `docs/requirements.md` | Requirements documented | `implementation_gap` |
| Governance and security | `RQ-400`-`RQ-413` | `docs/requirements.md` | Requirements documented | `missing_evidence` |
| Operational metrics | `RQ-500`-`RQ-520` | `docs/requirements.md` | Requirements documented | `launch_gate_gap` |

## Requirement Gaps

- `missing_traceability`: There was no machine-readable traceability/status/evidence matrix before this work.
- `RQ-001`: Zero-sync is stated in requirements but needs an explicit no-manual-sync acceptance check.
- `RQ-003`: Database-interface framing is broad and needs route/workflow acceptance criteria.
- `RQ-010`: TypeScript schema support needs explicit implementation evidence beyond ADR planning.
- `RQ-013`: Convex typing compatibility needs concrete contract tests.
- `RQ-130`/`RQ-131`: Lock-into-code needs exact artifact/apply ownership criteria.
- `RQ-211`: Preview of live frontend needs a defined frontend preview fixture or integration target.
- `RQ-331`: Successful deployment toast needs clarification of what deployment event means in this self-hosted CMS.
- `RQ-520`: The two-minute onboarding target needs a reproducible timed scenario and evidence capture.

## Launch Plan Gaps

- Launch release gates exist, but there is no evidence file/status linkage yet.
- Release checklist items call for unit, integration, e2e, performance, accessibility, security, install, backup, upgrade, and rollback evidence, but those artifacts are not yet mapped to requirement IDs.
- Several launch gates depend on future integration or environment-specific validation, including Convex test harnesses, staging-like latency measurement, clean-environment install checks, and backup/restore drills.

## Risk Register

| Risk | Impact | Gap Category | Recommended Mitigation |
|---|---|---|---|
| Requirements can drift from implementation | High | `missing_traceability` | Keep `featureList.json` updated after each work session. |
| Launch gates may be treated as prose instead of checks | High | `launch_gate_gap` | Attach evidence files and status changes to each gate. |
| Broad requirements can be marked done prematurely | Medium | `missing_acceptance_criteria` | Add concrete acceptance checks before moving items beyond `planned`. |
| Tests may lag behind critical CMS behavior | High | `test_gap` | Link unit, integration, e2e, perf, security, and a11y evidence to the relevant requirements. |
| Documentation may omit self-hosted operational proof | Medium | `documentation_gap` | Require install, backup, upgrade, and rollback evidence before launch readiness. |

## Recommended Next Actions

- Use `featureList.json` as the live checklist source for macro and micro review.
- Add acceptance criteria to broad requirements before implementation work begins.
- Link every status change to concrete evidence under `.sisyphus/evidence/` or another durable source.
- Keep launch gates separate from feature completion so release readiness remains visible.
- Do not move seeded items to `verified` until evidence is present and reviewed.
