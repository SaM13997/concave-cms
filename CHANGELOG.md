# Changelog

All notable changes to Concave CMS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-22

### Added

- Self-hosted packaging: Docker Compose, Dockerfile, and `make install` / `install-smoke.sh`
- In-product onboarding wizard: Blog schema → first post → publish
- Documentation: `docs/self-hosted.md`, `docs/troubleshooting.md`, `docs/upgrade.md`, `docs/rollback.md`, `docs/release.md`
- E2E onboarding spec with &lt;2 minute time budget (`e2e/onboarding.spec.ts`)
- First registered user automatically receives admin role on fresh deployments
- CI install-smoke job for clean-environment verification

### Changed

- `.env.example` aligned with Docker Compose and self-hosted deployment variables
- `package.json` version set to 1.0.0; added `start` script for production server

[1.0.0]: https://github.com/SaM13997/concave-cms/releases/tag/v1.0.0
