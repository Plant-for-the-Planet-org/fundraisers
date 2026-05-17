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
Any request to `app*.plant-for-the-planet.org` (the ForestCloud platform API) must go through `platformAPIClient` in `src/lib/api/external-client.ts`. Do not use raw `fetch()` for these endpoints.

Why: the client sets shared headers (`X-SESSION-ID`, `Content-Type`, `Authorization`) and handles error classification in one place. Raw `fetch()` sites drift over time and miss new headers when they are added centrally.

If a service needs behavior the client does not expose yet (e.g. custom error types, idempotency keys), extend the client rather than bypassing it.

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
