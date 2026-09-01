# Cookie consent stance (no banner)

This app shows **no cookie consent banner on purpose**. Under EU law (GDPR + ePrivacy, German TDDDG) a banner is only required when something **non-essential** is stored or read on the user's device **before** consent. We load nothing like that:

- Only strictly-necessary cookies on load (auth/session, `ui-locale`).
- The one third-party embed (YouTube) is gated behind inline contextual consent in `src/components/ui/video-embed.tsx`.
- Analytics is self-hosted Umami and needs no consent gate: the tracker writes nothing to the device and reads no cookie, and the server hashes IP + user agent into a session id without ever storing the raw IP (`src/components/analytics/umami-analytics.tsx`). This depends on the instance running `SALT_ROTATION=day`.
- Heatmaps run through Umami's recorder, which also writes nothing to the device. Heatmap payloads are click coordinates and scroll depth only, and the server strips query and hash from the URL. Session replay shares that script but is a separate toggle on the instance and must stay **off**: it records behaviour in a way that needs its own legal basis, and turning it on is a DPO decision, not a code change.
- Client Sentry is error-only — no cookie, no performance tracing, no log forwarding (`src/instrumentation-client.ts`).
- Stripe/PayPal load only when the user opens the donation flow, never on a normal visit.

The reasoning is documented for users at the `/cookies` page (`src/app/(standard)/cookies/page.tsx`, namespace `Cookies` in `locales/{en,de}/cookies.json`).

## Default position

Discourage anything that would bring the banner back. A cookie banner is a symptom of a design that watches users by default, and that is not how we believe the web should be built: privacy by default, track less, ask in context. So if a requested feature or library would require a banner (it stores or reads non-essential data before consent and cannot be made cookieless or contextual), do not just implement it. Tell the user it conflicts with this stance, explain why, and propose the cookieless or consent-gated alternative first. Only add a banner if the user makes an informed decision to accept that tradeoff.

## Review rule

Whenever you add or change anything that could touch the user's device or make third-party requests (an analytics or tracking tool, any third-party SDK, an embed, a third-party font/CDN, a payment or error-monitoring provider, or new cookie / `localStorage` / `sessionStorage` use), you MUST:

1. Check whether it changes the no-banner position. If the new tool stores or reads anything non-essential **before** consent, either gate it behind consent (cookieless/contextual) or the banner has to come back.
2. Update the `/cookies` page so its inventory stays accurate.
3. Call this out explicitly in the PR description so a human reviews the privacy impact before merge.
