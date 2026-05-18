# Fundraisers app

## Overview
<!-- One paragraph: what this app does, who uses it, where it sits in ForestCloud. -->

## Tech stack
<!-- Framework, language, key libraries, package manager, node version. -->

## Commands
<!-- dev, build, test, lint, typecheck. Exact commands to run. -->

## Project structure
<!-- Top-level directories and what lives where. Routing model. -->

## Domain glossary
<!-- Planet, ForestCloud, Academies, Fundraiser, Stage Mode, etc. Short definitions. -->

## API calls to ForestCloud
Any request to `app*.plant-for-the-planet.org` (the ForestCloud platform API) must go through `platformFetch` in `src/lib/api/platform-fetch.ts`. Do not use raw `fetch()` for these endpoints.

Why: `platformFetch` owns HTTP-level concerns in one place — base URL, `X-SESSION-ID`, `Authorization`, `Content-Type`, impersonation headers, idempotency keys, timeouts, and `PlatformAPIError` classification (`http` / `timeout` / `network`). Raw `fetch()` sites drift over time and miss headers when they are added centrally.

Domain concerns (response shaping, field-level error mapping, retries) belong in the service that calls `platformFetch`, not in the transport itself. If a service needs HTTP-level behavior `platformFetch` does not yet expose, extend `platformFetch` rather than bypassing it.

## Conventions
<!-- Code style notes, naming, file layout patterns, comment policy. -->

## Auth
<!-- Auth0 setup, token flow, how to test authenticated paths locally. -->

## Testing
<!-- Test runner, where tests live, what to run before pushing. -->

## Gotchas
<!-- Non-obvious traps: SSR/CSR boundaries, stale .next types, env quirks. -->

## Deployment
<!-- Where it deploys, how releases work, env vars, feature flags. -->
