# Fundraisers app

## Overview

<!-- One paragraph: what this app does, who uses it, where it sits in ForestCloud. -->

## Tech stack

<!-- Framework, language, key libraries, package manager, node version. -->
@AGENTS.md
## Commands

Requires a `.env.local` file in the project root before running locally.

Node 24 is required (Next.js needs ≥20.9). The dev server may already be running on port 3000 — check first. If not, `nvm use 24` then `npm run dev`. The `.claude/launch.json` `fundraisers-dev` preset handles this automatically via `bash -lc`.

| Command | When to use |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build — run before pushing to catch type/build errors |
| `npm run lint` | ESLint checks |
| `npm run type-check` | TypeScript checks without emitting files |
| `npm run format` | Auto-format code style issues |
| `npm run imports:sort` | Sort import order |

## Project structure

<!-- Top-level directories and what lives where. Routing model. -->

## Core vs. modules

The codebase has two parts:

- **Core** — the fundraiser product itself: the page route, the donation form, auth, theme, shared types, API service layer. Lives in `src/lib/`, `src/components/`, `src/app/`, `src/stores/`, `src/i18n/`, `src/styles/`. These are the standard Next.js conventions; we have not renamed them to `src/core/`. Think of them as core even though the folders don't say so.
- **Modules** — pluggable per-fundraiser features (Stage Mode, Leaderboard, etc.) under `src/modules/<id>/`. Each module is self-contained: UI, hooks, settings type, defaults, `module.ts` metadata, its own `README.md`.

The dependency rule: **modules consume core; core does not consume modules.** The one allowed bridge is the modules type registry at [`src/modules/index.ts`](src/modules/index.ts) — `src/lib/types/fundraiser.ts` imports `FundraiserModules` from there to compose the central settings shape.

**Before editing anything in `src/modules/*`:**
1. Read [`src/modules/README.md`](src/modules/README.md) for conventions (folder layout, persistence rules, registry, public surface).
2. Read the target module's own `README.md` for what it does and how it works.

**External code imports from `@/modules/<id>` only** (the barrel `index.ts`) — never reach into a module's subfolders. This keeps modules swappable.

When adding a new module or migrating an existing feature, follow the checklist in `src/modules/README.md` and write a module-level `README.md` covering: what it does, when it's enabled, what data it reads, what settings it owns, dependencies on other modules.

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

Do not start a dev server or verify changes in the browser. A dev session is usually already running; rely on `npm run type-check` and `npm run lint` for correctness, then let the reviewer check the UI and report back.

## Gotchas

<!-- Non-obvious traps: SSR/CSR boundaries, stale .next types, env quirks. -->

## Deployment

<!-- Where it deploys, how releases work, env vars, feature flags. -->
