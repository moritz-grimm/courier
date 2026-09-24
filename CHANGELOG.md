# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-09-25

First release.

### Added

- `POST /ntfy/:source/:topic?token=` relays webhooks to a self-hosted ntfy
  server with authentication (basic auth or access token)
- Formatting for all 20 documented Coolify event types
- Free-form event output (backup errors, task output, cleanup logs) appended
  to the message, truncated to the last 500 characters
- `GET /health` liveness endpoint
- Shared-secret authentication via `RELAY_TOKEN`
- Rate limiting of 100 requests per 15 minutes per IP, with
  `RATELIMIT_WHITELIST` for exempt addresses

[Unreleased]: https://github.com/moritz-grimm/courier/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/moritz-grimm/courier/releases/tag/v1.0.0
