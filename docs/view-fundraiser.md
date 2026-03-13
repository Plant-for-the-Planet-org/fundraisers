# Fundraiser View Page

Documents the implementation, data flow, and architecture of the fundraiser detail page at `/fundraisers/[slug]`.

---

## Current Status

**Phase 1 is complete.** Delivered:

- **Server-side fundraiser fetch** — `getCachedFundraiser` fetches the fundraiser from the public API and applies `React.cache()` to deduplicate across layout and page within the same render
- **Flash-free per-fundraiser theming** — the layout resolves the fundraiser's theme server-side and passes it to `ThemeShell` as `initialTheme`; the correct theme is baked into the SSR HTML before any JS runs
- **Auth retry for non-public fundraisers** — owners of draft/cancelled fundraisers get a client-side retry using their access token; the server falls back gracefully to `DEFAULT_THEME` while the client resolves
- **Route-level UX** — `loading.tsx` (skeleton) and `not-found.tsx` (custom 404) at the route level
- **SEO metadata** — `generateMetadata` emits title, description, and Open Graph tags from the fundraiser data

**Not yet implemented** — the actual fundraiser content (stats, donation form, leaderboard, project list). The page currently renders only `fundraiser.title` as a placeholder.

---

## File Structure

```
src/
  lib/
    api/
      fundraiser-service.ts         ← getFundraiser, getFundraiserAuthenticated, getCachedFundraiser
  app/
    (fundraiser)/
      fundraisers/
        [slug]/
          layout.tsx                ← server component; theme resolution + ThemeShell
          page.tsx                  ← server component; content + generateMetadata
          loading.tsx               ← skeleton UI
          not-found.tsx             ← custom 404 page
  components/
    fundraisers/
      fundraiser-auth-retry.tsx     ← 'use client'; authenticated retry for non-public fundraisers
```

---

## Why a separate `(fundraiser)` route group

The `(standard)` layout renders `ThemeShell` — but per-fundraiser theming requires passing a server-fetched `Theme` into `ThemeShell`. Next.js doesn't support passing data up from a child page to a parent layout.

The `(fundraiser)` route group has its own layout that renders its own `ThemeShell` with `initialTheme`. The `(standard)/fundraisers/[slug]` placeholder was deleted; two route groups cannot own the same URL path.

---

## Data flow — step by step

### Public fundraiser (`/fundraisers/my-active-campaign`)

```
1. Browser requests /fundraisers/my-active-campaign
2. proxy.ts stamps x-pathname header
3. Root layout sets <html class="light/dark"> from x-pathname
4. FundraiserLayout (server component):
     - getCachedFundraiser('my-active-campaign') → Fundraiser
     - buildTheme(fundraiser.settings?.theme) → Theme
     - renders <ThemeShell initialTheme={theme}>
5. ThemeShell (SSR pass):
     - activeTheme = selectedTheme ?? initialTheme ?? getThemeForPath(pathname)
     - selectedTheme = null (Zustand store starts empty)
     - activeTheme = initialTheme = fundraiser's theme
     - renders themed div + fixed background with correct gradient, fonts, accent
6. FundraiserPage (server component):
     - getCachedFundraiser(...) → same Fundraiser, no extra request (React.cache)
     - renders <section><h2>{title}</h2></section>
7. React hydrates — ThemeShell has same activeTheme as server; no re-render
```

No flash. Theme is correct on the first byte.

### Non-public fundraiser — owner logged in (`/fundraisers/my-draft`)

```
1. FundraiserLayout:
     - getCachedFundraiser('my-draft') → PlatformAPIError(404)
     - caught: theme = DEFAULT_THEME (spring)
     - renders ThemeShell with spring theme
2. FundraiserPage:
     - getCachedFundraiser('my-draft') → same PlatformAPIError(404)
     - caught: returns <FundraiserAuthRetry slug="my-draft" />
3. FundraiserAuthRetry (client, after hydration):
     - isAuthInitializing = true → waits
     - isAuthInitializing = false, accessToken present
     - getFundraiserAuthenticated('my-draft', token) → Fundraiser
     - setSelectedTheme(buildTheme(fundraiser.settings?.theme)) → updates theme
     - renders fundraiser content
```

The theme transitions from spring → the fundraiser's actual theme after the client fetch resolves. This is a known limitation of the current client-only auth architecture — owners of non-public fundraisers see a brief theme flash. The content (the fundraiser itself) also loads client-side, with no SSR.

### Non-public fundraiser — logged out

```
1-2. Same as above — layout falls back to spring, page returns <FundraiserAuthRetry>
3. FundraiserAuthRetry:
     - isAuthInitializing becomes false, accessToken = null
     - setFailed(true)
     - notFound() fires → next nearest not-found.tsx renders
```

The `loading.tsx` skeleton is shown while the server renders (steps 1–2) and while the client waits for `isAuthInitializing`. The not-found page appears only after auth initialization completes.

---

## Modules

### `src/lib/api/fundraiser-service.ts`

Three exports:

- **`getFundraiser(slug)`** — public `GET /fundraisers/:slug`. No auth token. Used by `getCachedFundraiser`.
- **`getFundraiserAuthenticated(slug, token)`** — same endpoint with `Authorization: Bearer` header. Used by `FundraiserAuthRetry` for owners of non-public fundraisers.
- **`getCachedFundraiser(slug)`** — `React.cache()` wrapper around `getFundraiser`. Ensures the layout and page share one API call per server render. The cache is per-request (React's cache is scoped to the render tree), so there's no cross-request stale data.

---

### `src/app/(fundraiser)/fundraisers/[slug]/layout.tsx`

Server component. Responsible for:

1. Fetching the fundraiser publicly via `getCachedFundraiser`
2. Converting `fundraiser.settings?.theme` → `Theme` via `buildTheme`
3. Passing the result to `ThemeShell` as `initialTheme`
4. Rendering the page shell: `ThemeShell > Header > MainContent > Footer > Toaster`

**404 handling:** If the public fetch returns a 404, the layout catches it, falls back to `DEFAULT_THEME`, and continues rendering. It does **not** call `notFound()` — that would prevent the page from rendering `FundraiserAuthRetry`, breaking the auth retry flow for owners. All other errors are re-thrown.

---

### `src/app/(fundraiser)/fundraisers/[slug]/page.tsx`

Server component. Responsible for:

1. **`generateMetadata`** — fetches the fundraiser (cached, free if layout already fetched it) and returns `title`, `description`, and `openGraph`. Falls back to `{ title: 'Fundraiser' }` on error.
2. **`FundraiserPage`** — fetches via `getCachedFundraiser`. On success, renders the page content. On 404, renders `<FundraiserAuthRetry slug={slug} />`. Other errors are re-thrown.

The JSX (`<section>...</section>`) is **outside** the try/catch to satisfy the ESLint rule `no-restricted-syntax: Avoid constructing JSX within try/catch`. React doesn't execute component code synchronously inside JSX construction, so errors from child components cannot be caught by try/catch — they require an error boundary instead.

---

### `src/components/fundraisers/fundraiser-auth-retry.tsx`

`'use client'` component. Rendered only when the public fetch returned 404. Handles the case where the fundraiser exists but is not publicly accessible (draft, paused, cancelled).

**State:**

- `fundraiser: Fundraiser | null` — set after a successful authenticated fetch
- `failed: boolean` — set when auth is absent or the authenticated fetch also fails

**Effect** (runs when `isAuthInitializing` or `accessToken` changes):

1. If `isAuthInitializing` is true, wait — don't fetch yet
2. If no `accessToken`, set `failed = true` (user is not logged in)
3. Otherwise, call `getFundraiserAuthenticated(slug, token)`
   - On success: set `fundraiser`, call `setSelectedTheme(buildTheme(...))` to update the theme in the Zustand store so `ThemeShell` re-renders with the correct theme
   - On error: set `failed = true`

**Render:**

- `failed = true` → `notFound()` (triggers the nearest `not-found.tsx`)
- `fundraiser = null` (loading) → `null` (the `loading.tsx` skeleton is shown by Next.js during this time)
- `fundraiser` resolved → renders content

**Theme update:** Since `ThemeShell` reads `selectedTheme` from the Zustand store (`activeTheme = selectedTheme ?? initialTheme ?? getThemeForPath(pathname)`), calling `setSelectedTheme` from the client component causes `ThemeShell` to re-render with the fundraiser's actual theme, overriding the `DEFAULT_THEME` fallback set by the layout.

---

### `src/app/(fundraiser)/fundraisers/[slug]/loading.tsx`

Shown by Next.js (via Suspense) while the layout/page server-renders. Two-column skeleton matching the expected fundraiser page layout:

- **Left column** — image placeholder, progress bar, donor avatars, hosted-by list
- **Right column** — title, leaderboard tabs, donation form, about section

This skeleton is also visible to logged-out users navigating to a non-public URL while auth is initializing (since `FundraiserAuthRetry` returns `null` during that window).

---

### `src/app/(fundraiser)/fundraisers/[slug]/not-found.tsx`

Rendered when `notFound()` is called — either from `FundraiserAuthRetry` (auth failed or authenticated fetch failed) or any future path that explicitly calls it. Displays a 404 message with two CTAs:

- **Browse Fundraisers** → `/explore`
- **Go Home** → `/`

---

## `React.cache()` and deduplication

`getCachedFundraiser` is wrapped with `React.cache()`. Within a single server render, every call with the same `slug` returns the same promise — the fetch is made only once. This means:

- `generateMetadata` calling `getCachedFundraiser(slug)`
- `FundraiserLayout` calling `getCachedFundraiser(slug)`
- `FundraiserPage` calling `getCachedFundraiser(slug)`

…all share one API call. The cache is scoped to the current React render tree (per-request), so there is no cross-request data sharing or staleness risk.

---

## Phase 2 — full fundraiser page content (deferred)

The page currently renders only `fundraiser.title`. The next step is implementing the full view:

- **Fundraiser stats** — goal, total raised, progress bar, days left
- **Donation form** — preset amounts, custom input, recurrency, dedication
- **Leaderboard** — recent/top donor tabs (from `GET /fundraisers/:slug/leaderboard`)
- **All-time impact** — stats block (from `GET /fundraisers/:slug/alltime-stats`)
- **Project list** — project allocations with images and descriptions
- **Hosted by** — fundraiser host display

The `FundraiserAuthRetry` content block should be updated in lockstep with the main render path so both public and non-public views are consistent.

The leaderboard and alltime-stats fetches should follow the same `React.cache()` pattern and live alongside `getCachedFundraiser` in `fundraiser-service.ts`.
