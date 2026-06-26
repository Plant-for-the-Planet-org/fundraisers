# Fundraisers app

## Overview

<!-- One paragraph: what this app does, who uses it, where it sits in ForestCloud. -->

## Tech stack

<!-- Framework, language, key libraries, package manager, node version. -->

@AGENTS.md

## Commands

Requires a `.env.local` file in the project root before running locally.

Node 24 is required (Next.js needs ≥20.9). The dev server may already be running on port 3000 — check first. If not, `nvm use 24` then `npm run dev`. The `.claude/launch.json` `fundraisers-dev` preset handles this automatically via `bash -lc`.

| Command                | When to use                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run dev`          | Start the local dev server                                       |
| `npm run build`        | Production build — run before pushing to catch type/build errors |
| `npm run lint`         | ESLint checks                                                    |
| `npm run type-check`   | TypeScript checks without emitting files                         |
| `npm run format`       | Auto-format code style issues                                    |
| `npm run imports:sort` | Sort import order                                                |

## Project structure

<!-- Top-level directories and what lives where. Routing model. -->

## Domain glossary

<!-- Planet, ForestCloud, Academies, Fundraiser, Stage Mode, etc. Short definitions. -->

## API calls to ForestCloud

Any request to `app*.plant-for-the-planet.org` (the ForestCloud platform API) must go through `platformFetch` in `src/lib/api/platform-fetch.ts`. Do not use raw `fetch()` for these endpoints.

Why: `platformFetch` owns HTTP-level concerns in one place — base URL, `X-SESSION-ID`, `Authorization`, `Content-Type`, impersonation headers, idempotency keys, timeouts, and `PlatformAPIError` classification (`http` / `timeout` / `network`). Raw `fetch()` sites drift over time and miss headers when they are added centrally.

Domain concerns (response shaping, field-level error mapping, retries) belong in the service that calls `platformFetch`, not in the transport itself. If a service needs HTTP-level behavior `platformFetch` does not yet expose, extend `platformFetch` rather than bypassing it.

## Cookies & consent (no cookie banner)

This app shows **no cookie consent banner on purpose**. Under EU law (GDPR + ePrivacy, German TDDDG) a banner is only required when something **non-essential** is stored or read on the user's device **before** consent. We load nothing like that:

- Only strictly-necessary cookies on load (auth/session, `ui-locale`).
- The one third-party embed (YouTube) is gated behind inline contextual consent in `src/components/ui/video-embed.tsx`.
- Client Sentry is error-only — no cookie, no performance tracing, no log forwarding (`src/instrumentation-client.ts`).
- Stripe/PayPal load only when the user opens the donation flow, never on a normal visit.

The reasoning is documented for users at the `/cookies` page (`src/app/(standard)/cookies/page.tsx`, namespace `Cookies` in `locales/{en,de}/cookies.json`).

**Default position — discourage anything that would bring the banner back.** A cookie banner is a symptom of a design that watches users by default, and that is not how we believe the web should be built: privacy by default, track less, ask in context. So if a requested feature or library would require a banner (it stores or reads non-essential data before consent and cannot be made cookieless or contextual), do not just implement it. Tell the user it conflicts with this stance, explain why, and propose the cookieless or consent-gated alternative first. Only add a banner if the user makes an informed decision to accept that tradeoff.

**Review rule — whenever you add or change anything that could touch the user's device or make third-party requests** (an analytics or tracking tool, any third-party SDK, an embed, a third-party font/CDN, a payment or error-monitoring provider, or new cookie / `localStorage` / `sessionStorage` use), you MUST:

1. Check whether it changes the no-banner position. If the new tool stores or reads anything non-essential **before** consent, either gate it behind consent (cookieless/contextual) or the banner has to come back.
2. Update the `/cookies` page so its inventory stays accurate.
3. Call this out explicitly in the PR description so a human reviews the privacy impact before merge.

## Conventions

<!-- Code style notes, naming, file layout patterns, comment policy. -->

### next-intl: use `t.rich` for inline elements

When a translation string contains an inline element (link, bold, etc.), use `t.rich` — never split it into `{t('key')} <a>...</a>`.

```tsx
// Bad
{
  t('attribution.photoBy');
}
{
  (' ');
}
<a href={url}>{photo.user.name}</a>;

// Good — embed the tag in the translation string and use t.rich
{
  t.rich('attribution.photoBy', {
    name: photo.user.name,
    photographerLink: chunks => <a href={url}>{chunks}</a>,
  });
}
```

Translation key: `"photoBy": "Photo by <photographerLink>{name}</photographerLink>"`

## Auth

<!-- Auth0 setup, token flow, how to test authenticated paths locally. -->

## Testing

<!-- Test runner, where tests live, what to run before pushing. -->

Do not start a dev server or verify changes in the browser. A dev session is usually already running; rely on `npm run type-check` and `npm run lint` for correctness, then let the reviewer check the UI and report back.

## Gotchas

<!-- Non-obvious traps: SSR/CSR boundaries, stale .next types, env quirks. -->

## Deployment

<!-- Where it deploys, how releases work, env vars, feature flags. -->
