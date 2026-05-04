# Manage Fundraisers (Dashboard) Page Plan

## Summary

Reshape `/(standard)/dashboard/page.tsx` into a single, focused **Manage fundraisers** screen. It has three layers stacked vertically:

1. **Header** — page title + supporting copy.
2. **Summary** — three stat tiles (Fundraisers / Total Raised / Donations).
3. **Manage list** — toolbar (search + status filter + sort) above a list of the user's fundraisers, each with a kebab action menu (Edit, Copy link, Pause/Resume).

The page keeps `AuthGuard` and `useAuthStore`; data fetching still flows through `lib/api/fundraisers-service.ts`. Rendering is broken into small, single‑responsibility components colocated under `src/components/dashboard/`.

---

## Goals

- Match the new visual design (header copy, three summary tiles, search + filter + sort toolbar, list rows with status badges and a kebab menu).
- Keep the page itself thin — it composes feature components and owns only top‑level data fetching and one shared filter/sort state.
- Make every list row actionable (Edit / Copy link / Pause / Resume) without leaving the page.
- Be resilient to partial data (multi‑currency totals, missing host display name, missing image, very long titles).
- Stay localized end to end (`Dashboard.*` keys in `locales/en/dashboard.json` and `locales/de/dashboard.json`).
- Replace legacy components cleanly — no parallel "old vs new" cards left behind.

Out of scope (call out, do not build): pagination/infinite scroll, bulk actions, share‑sheet beyond Copy link, server‑side filtering, analytics events.

---

## Delivery Plan (PRs)

The work ships in four PRs so each lands a reviewable, user‑visible slice. Each PR's scope is fixed — anything not listed under "In scope" belongs to a later PR, even if mentioned elsewhere in this doc.

### PR 1 — Header + summary tiles ✅ shipped

**Goal:** show the page chrome and the three top‑line metrics. No list yet.

**In scope**

- `BreadcrumbTrail` (Home → Dashboard).
- `DashboardHeader` (title + subtitle).
- `DashboardSummary` + `SummaryStatCard` + `SummaryStatCardSkeleton`.
- `DashboardStatsError` (retained from legacy, generic retry block spanning the grid).
- Slim `getDashboardSummary` returning only `{ totalCount, activeCount, donationsCount, totalRaisedByCurrency }` — `activeCount` derived from `canDonate` for now (no dependency on the unshipped API `status` field).
- Locale keys: `breadcrumb.*`, `manageFundraisers.*`, `summary.*`, `statsError.*` only.
- Page composition: `AuthGuard` → breadcrumb → header → summary.
- Removed legacy components: `card-base`, `my-fundraisers-card`, `total-raised-card`, `donations-card`, `dashboard-stat-card-skeleton`.

**Out of scope (deferred):** list, toolbar, action menu, `Fundraiser.status` field on the type, `pauseFundraiser` / `resumeFundraiser`, PATCH support on `external-client`, all derivation/filter/sort utilities, list‑related locale keys.

**Acceptance**

- `/dashboard` renders header + 3 tiles; numbers match `getFundraisers` payload.
- DE locale renders all four sections.
- `npm run type-check` clean; ESLint clean on changed files.

---

### PR 2 — Fundraiser list (read‑only)

**Goal:** render the user's fundraisers below the summary as a static list — no toolbar, no actions yet. Sorted newest‑first by `startDate`.

**In scope**

- New components in `src/components/dashboard/`:
  - `fundraiser-list.tsx` — handles the loading / empty / populated states.
  - `fundraiser-list-item.tsx` — image, title, host, `amount of goal`, donations, days‑left.
  - `fundraiser-list-item-skeleton.tsx` — shown 3–5× while loading.
  - `fundraiser-status-badge.tsx` — variants `active` / `paused` / `draft` / `ended` / `ending-soon`.
  - `fundraiser-list-empty.tsx` — zero‑fundraisers CTA → `/fundraisers/create`.
- New utility `src/lib/utils/fundraiser-list.ts` with **only** what the list needs at this stage:
  - `DisplayStatus` type, `ENDING_SOON_THRESHOLD_DAYS`, `getDaysLeft`, `deriveDisplayStatus`.
  - **Not** the filter/sort/counts functions — those land in PR 3.
- Add `status?: FundraiserStatus` to the `Fundraiser` interface (optional, with `canDonate` fallback inside `deriveDisplayStatus`) so derivation works before and after the backend ships the field.
- Page composition: render the list directly under `DashboardSummary`. Default order: `startDate` desc.
- Locale keys added: `statusBadge.*`, `listItem.*`, `empty.*`.

**Out of scope (deferred to PR 3 / 4):** search box, status‑filter pills, sort menu, result‑count line, `noResults` empty state, all per‑row actions (kebab menu).

**Dependencies / risks**

- Backend `status` field. **Not strictly blocking** — the `canDonate` fallback covers the active vs paused split for badges. Drafts and cancelled rows will render as `paused` / `ended` once the backend ships `status`; until then they collapse into `active` / `paused`. Note this in PR description.

**Acceptance**

- All of the user's fundraisers render in a single list, newest first.
- Status badges render correct colors for the four real statuses available pre‑backend.
- Long titles truncate; missing image shows the placeholder; missing host shows the fallback string.
- Skeleton renders during `isLoading`; empty state renders when the user has zero fundraisers.

---

### PR 3 — Search + filter + sort toolbar

**Goal:** add the toolbar above the list. Users can search by name/host, filter by status, and pick a sort order. The list re‑renders accordingly.

**In scope**

- New components:
  - `fundraiser-list-section.tsx` — wraps toolbar + result count + list, owns filter state.
  - `fundraiser-list-toolbar.tsx`.
  - `fundraiser-search-input.tsx` (250 ms debounce, syncs from parent for "Clear filters").
  - `fundraiser-status-filter.tsx` (segmented pills with counts from the **unfiltered** list).
  - `fundraiser-sort-menu.tsx` (dropdown: newest / oldest / most‑raised / ending‑soonest / name‑asc).
  - `fundraiser-list-no-results.tsx` (filtered‑empty state with "Clear filters" button).
- Extend `src/lib/utils/fundraiser-list.ts` with: `FundraiserListSort`, `FundraiserListStatusFilter`, `FundraiserListFilters`, `FundraiserStatusCounts`, `DEFAULT_FUNDRAISER_LIST_FILTERS`, `filterFundraisers`, `sortFundraisers`, `getStatusCounts`.
- New `useFundraiserListFilters` hook in `src/components/dashboard/use-fundraiser-list-filters.ts`.
- Wire `FundraiserListSection` into the page in place of the bare list from PR 2.
- Locale keys added: `toolbar.*`, `statusFilter.*`, `sort.*`, `noResults.*`.

**Out of scope (deferred to PR 4):** any per‑row actions; URL‑sync for filter state (still a doc open question).

**Dependencies / risks**

- **Hard dependency on backend `status` field** — the Paused filter must distinguish `paused` + `draft` from `active`, which `canDonate` cannot. Do not start this PR until the backend ships `status` on `GET /fundraisers`. If it's not ready, the Paused/Ended pills will mis‑bucket rows.

**Acceptance**

- Typing in search filters the list with no perceptible lag; debounce ≈ 250 ms.
- Each pill (All / Active / Paused / Ended) shows its count from the **unfiltered** list and stays stable as the user toggles between pills.
- All five sort options behave per the rules in `sortFundraisers`.
- "No fundraisers match these filters." renders with a working "Clear filters" button.
- DE locale renders pluralized strings correctly.

---

### PR 4 — Per‑row actions (Edit / Copy link / Pause / Resume)

**Goal:** add the kebab menu on each row with the four actions. Pause/Resume hits the backend and the list reflects the new status without a full reload.

**In scope**

- New component `fundraiser-action-menu.tsx`:
  - Items gated per API `status`:
    - `active` → Edit, Copy link, Pause.
    - `paused` → Edit, Copy link, Resume.
    - `draft` → Edit, Copy link.
    - `completed` / `cancelled` → Copy link only (read‑only).
  - Clipboard with `execCommand('copy')` fallback.
  - `sonner` toasts for success / error.
- API layer additions:
  - `pauseFundraiser(id, token)` / `resumeFundraiser(id, token)` in `lib/api/fundraisers-service.ts`.
  - `patch` / `patchAuthenticated` in `lib/api/external-client.ts`.
- Page composition: thread `onMutate = refetch` from the page through `FundraiserListSection` → `FundraiserList` → `FundraiserListItem` → `FundraiserActionMenu`.
- Locale keys added: `actions.*`.

**Out of scope:** optimistic updates (record as a future polish item), share‑sheet beyond Copy link.

**Dependencies / risks**

- **Backend pause/resume endpoint** — confirm `PATCH /fundraisers/{id}` accepts `{ status: 'active' | 'paused' }`. If the contract differs, only `lib/api/fundraisers-service.ts` needs to change.
- **Toast system** — `sonner` is already used elsewhere in the app, so no new infra needed.

**Acceptance**

- Pause on an Active row → row badge flips to Paused, Active count drops by 1, Paused count rises by 1.
- Resume on a Paused row → reverse.
- Copy link → clipboard contains `${origin}/fundraisers/${slug}`; toast shows.
- Network failure on Pause → row stays Active, error toast shows, no local state corruption.
- Action menu trigger is hidden / disabled when there are zero applicable actions for that row.

---

## Page Layout (top → bottom)

```
┌────────────────────────────────────────────────────────────┐
│ Manage fundraisers                                         │  ← DashboardHeader
│ View, edit, and track every fundraiser you've created…     │
├────────────────────────────────────────────────────────────┤
│ ┌─Fundraisers─┐ ┌─Total Raised─┐ ┌─Donations─┐             │  ← DashboardSummary
│ │  8          │ │  €16,837.61  │ │  626      │   (3 tiles) │
│ │  6 active   │ │  across all… │ │  from supp│             │
│ └─────────────┘ └──────────────┘ └───────────┘             │
├────────────────────────────────────────────────────────────┤
│ [🔍 Search…]   [All 8 | Active 6 | Paused 1 | Ended 1]     │  ← FundraiserListToolbar
│                                       Sort: Newest first ▼ │
│ Showing 8 of 8                                              │  ← result count
├────────────────────────────────────────────────────────────┤
│ [img] Plant 500 trees…  • Active                       ⋮   │  ← FundraiserListItem
│       by {host name}                                        │
│       €2,000 of €5,000 · 200 donations · 30 days left       │
│ ──────────────────────────────────────────────────────────  │
│ [img] Test fundraiser  • Ended                         ⋮    │
│       by {host name}                                        │
│       €2.37 of €50.00 · 5 donations · Ended                 │
│ … (more rows)                                               │
└────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

All new files live under [src/components/dashboard/](src/components/dashboard/) (kebab‑case files, PascalCase named exports — see [docs/naming.md](docs/naming.md)).

```
src/components/dashboard/
├── dashboard-header.tsx                # Title + subtitle (i18n)
│
├── dashboard-summary.tsx               # Wrapper: 3 stat tiles, handles loading/error
├── summary-stat-card.tsx               # Generic tile (label, value, helper)
├── summary-stat-card-skeleton.tsx
│
├── fundraiser-list-section.tsx         # Owns filter/sort/search state + result count
├── fundraiser-list-toolbar.tsx         # Composes search + status filter + sort
├── fundraiser-search-input.tsx         # Debounced search box
├── fundraiser-status-filter.tsx        # Segmented control: All / Active / Paused / Ended
├── fundraiser-sort-menu.tsx            # Dropdown: Newest / Oldest / Most raised / …
│
├── fundraiser-list.tsx                 # Renders rows or empty/no-results state
├── fundraiser-list-item.tsx            # One row (image + meta + status + ⋮)
├── fundraiser-list-item-skeleton.tsx
├── fundraiser-status-badge.tsx         # Active / Paused / Ended / Ending soon
├── fundraiser-action-menu.tsx          # ⋮ menu (Edit / Copy link / Pause | Resume)
├── fundraiser-list-empty.tsx           # User has zero fundraisers
├── fundraiser-list-no-results.tsx      # Filters/search produced zero rows
│
├── dashboard-stats-error.tsx           # (kept) generic retryable error block
└── index.ts                            # Re-exports
```

Removed (replaced by the above): `card-base.tsx`, `my-fundraisers-card.tsx`, `total-raised-card.tsx`, `donations-card.tsx`, `dashboard-stat-card-skeleton.tsx`. Delete cleanly — do not leave shims or deprecated wrappers.

### Where each piece lives

| Concern                                                  | Owner                                                                                                    |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Auth gating, top‑level fetch, error boundary             | [src/app/(standard)/dashboard/page.tsx](<src/app/(standard)/dashboard/page.tsx>)                         |
| Page title + subtitle                                    | `DashboardHeader`                                                                                        |
| Stat tile values + skeleton/error                        | `DashboardSummary` → `SummaryStatCard`                                                                   |
| Filter/sort/search **state**                             | `FundraiserListSection` (single source of truth)                                                         |
| Toolbar UI                                               | `FundraiserListToolbar` (controlled by section)                                                          |
| Pure filter/sort logic                                   | `lib/utils/fundraiser-list.ts`                                                                           |
| Derived display status (active/paused/ended/ending‑soon) | `lib/utils/fundraiser-list.ts`                                                                           |
| Pause/Resume mutation                                    | `lib/api/fundraisers-service.ts`                                                                         |
| Row UI                                                   | `FundraiserListItem`                                                                                     |
| Per‑row actions                                          | `FundraiserActionMenu` (uses [src/components/ui/dropdown-menu.tsx](src/components/ui/dropdown-menu.tsx)) |

---

## Component Specs

### `DashboardHeader`

- Props: none.
- Renders `<h1>` with `t('manageFundraisers.title')` and a `<p>` with `t('manageFundraisers.subtitle')`.
- The breadcrumb is rendered by the page (above the header), not by this component.

### `DashboardSummary`

- Props: `{ summary: DashboardSummaryStats; isLoading: boolean; hasError: boolean; onRetry: () => void; }`
- Layout: `grid gap-4 md:grid-cols-3` (drop the `lg:grid-cols-3` step — only 3 tiles).
- States:
  - `hasError` → renders `DashboardStatsError` spanning all columns.
  - `isLoading` → 3× `SummaryStatCardSkeleton`.
  - `success` → 3× `SummaryStatCard`.
- Tiles (label / value / helper):
  1. `t('summary.fundraisers.label')` / `summary.totalCount` / `t('summary.fundraisers.activeHelper', { count: summary.activeCount })`
  2. `t('summary.totalRaised.label')` / formatted total / `t('summary.totalRaised.helper')` (or per‑currency note when multiple).
  3. `t('summary.donations.label')` / `summary.donationsCount` / `t('summary.donations.helper')`.

### `SummaryStatCard`

- Props: `{ label: string; value: ReactNode; helper?: ReactNode; }`
- Layout: small uppercase label, large numeric value, muted helper line. Built on existing `Card` primitives in [src/components/ui/card.tsx](src/components/ui/card.tsx). No hover lift, no link — these are read‑only metrics.

### `FundraiserListSection`

- Props: `{ fundraisers: Fundraiser[]; onMutate: () => void; }`
- Owns local state via `useFundraiserListFilters` (see Hooks).
- Computes `visibleFundraisers = sortFundraisers(filterFundraisers(fundraisers, { search, status }), sort)`.
- Renders: `FundraiserListToolbar` → result count line (`Showing {visible} of {total}`) → `FundraiserList`.
- Passes `onMutate` down so action menu can refresh after Pause/Resume.

### `FundraiserListToolbar`

- Props: `{ filters: FundraiserListFilters; counts: FundraiserStatusCounts; onChange: (next: FundraiserListFilters) => void; }`
- Pure presentational; composes `FundraiserSearchInput`, `FundraiserStatusFilter`, `FundraiserSortMenu`.
- Mobile: stacks vertically (`flex-col md:flex-row`); status filter scrolls horizontally if it overflows.

### `FundraiserSearchInput`

- Props: `{ value: string; onChange: (next: string) => void; placeholder?: string; }`
- Internally debounces input (250 ms) before calling `onChange`. Search input is **controlled by its own local string** so typing feels instant, then it fires upstream.
- Searches against fundraiser **title** and **host display name** (case‑insensitive via `.trim().toLowerCase().includes(query)`).

### `FundraiserStatusFilter`

- Props: `{ value: FundraiserListStatusFilter; counts: FundraiserStatusCounts; onChange: (next: FundraiserListStatusFilter) => void; }`
- Segmented pills: `All` | `Active` | `Paused` | `Ended`. Each shows its count badge.
- Counts are computed from the **unfiltered** list (so toggling between filters never changes the badge numbers).

### `FundraiserSortMenu`

- Props: `{ value: FundraiserListSort; onChange: (next: FundraiserListSort) => void; }`
- Dropdown built on [src/components/ui/dropdown-menu.tsx](src/components/ui/dropdown-menu.tsx).
- Options: `newest` (default), `oldest`, `most-raised`, `ending-soonest`, `name-asc`. Trigger label: `t('sort.label', { value: t('sort.options.<id>') })`.

### `FundraiserList`

- Props: `{ fundraisers: Fundraiser[]; isFiltered: boolean; onMutate: () => void; }`
- If `fundraisers.length === 0`: render `FundraiserListNoResults` when `isFiltered`, otherwise `FundraiserListEmpty`.
- Otherwise maps to `FundraiserListItem`.

### `FundraiserListItem`

- Props: `{ fundraiser: Fundraiser; onMutate: () => void; }`
- Layout (left → right):
  - 80×80 image (or placeholder if `fundraiser.image` is null) — uses `next/image` with `fill` and `sizes`.
  - Block: title + `FundraiserStatusBadge`; "by {hostName}" line; metric row (`amountRaised of goal · N donations · timeLeft`).
  - Right: `FundraiserActionMenu`.
- Title is a `<Link>` to the public fundraiser page (or to edit if you prefer; **call out** as an open question).

### `FundraiserStatusBadge`

- Props: `{ status: DisplayStatus; }`
- Variants: `active` (green), `paused` (muted), `draft` (muted, distinct label), `ended` (gray), `ending-soon` (amber). Pure presentational; no logic. The display status is derived upstream (see `deriveDisplayStatus`).
- Drafts share the **Paused** filter bucket (per API rule below) but render with a distinct "Draft" label so the user can tell them apart at a glance.

### `FundraiserActionMenu`

- Props: `{ fundraiser: Fundraiser; onMutate: () => void; }`
- Items shown depend on the API `status`:

| API `status`             | Edit | Copy link | Pause | Resume |
| ------------------------ | :--: | :-------: | :---: | :----: |
| `active`                 |  ✓   |     ✓     |   ✓   |        |
| `paused`                 |  ✓   |     ✓     |       |   ✓    |
| `draft`                  |  ✓   |    ✓\*    |       |        |
| `completed`, `cancelled` |      |     ✓     |       |        |

- **Edit** → navigates to `/dashboard/fundraisers/edit/[slug]` (existing route). **Hidden for `completed` and `cancelled`** — ended fundraisers are read‑only.
- **Copy link** → writes the public URL (`/{locale}/f/{slug}` or current convention) to clipboard via `navigator.clipboard.writeText`. Surfaces success/error via `sonner` toast. _Drafts: see Open Question on whether a public URL exists for unpublished fundraisers._
- **Pause** (when API `status === 'active'`) / **Resume** (when API `status === 'paused'`). Both call `pauseFundraiser` / `resumeFundraiser`, then `onMutate()` to refetch. Disabled while in‑flight; show spinner inside the menu item.
- **Drafts** do not show Pause/Resume — they have a different lifecycle (publish, not resume).
- If the menu would have **zero items** for a given row, render the kebab trigger as disabled (or omit it entirely) — never an empty popover.

### `FundraiserListEmpty`

- Zero fundraisers ever. Friendly copy + CTA `Create your first fundraiser` linking to `/fundraisers/create`.

### `FundraiserListNoResults`

- Filters/search produced no rows. Copy: "No fundraisers match these filters." + secondary button `Clear filters` (calls `onChange(DEFAULT_FILTERS)` upstream).

### Skeletons

- `SummaryStatCardSkeleton` — three rendered while summary loads.
- `FundraiserListItemSkeleton` — render 3–5 while the list loads. Use existing [src/components/ui/skeleton.tsx](src/components/ui/skeleton.tsx).

---

## Data Layer

### Extend `lib/api/fundraisers-service.ts`

Replace `DashboardFundraiserStats` with a richer summary. **Status buckets are driven entirely by the API `status` field returned from `GET /fundraisers`** (no `endDate` derivation):

| API `status`             | Filter bucket | Counted in    |
| ------------------------ | ------------- | ------------- |
| `active`                 | **Active**    | `activeCount` |
| `draft`, `paused`        | **Paused**    | `pausedCount` |
| `completed`, `cancelled` | **Ended**     | `endedCount`  |

```ts
export interface DashboardSummaryStats {
  totalCount: number;          // every fundraiser owned by user (all statuses)
  activeCount: number;         // status === 'active'
  donationsCount: number;      // sum of donationCount across user's fundraisers
  totalRaisedByCurrency: DashboardRaisedSummary[];
}

export function getDashboardSummary(fundraisers: Fundraiser[]): DashboardSummaryStats { … }
```

> Note: `donationsCount` is summed client‑side from `Fundraiser.donationCount`. If the API later exposes a single endpoint returning the full summary, swap implementation; the page just consumes the shape.

> The status‑filter pill counts (Paused/Ended) are computed by `getStatusCounts(fundraisers)` in the list utility — they do not live on `DashboardSummaryStats`, since the tiles only surface `totalCount` / `activeCount` / `donationsCount`.

Add mutations:

```ts
export async function pauseFundraiser(
  id: string,
  token: string
): Promise<Fundraiser>;
export async function resumeFundraiser(
  id: string,
  token: string
): Promise<Fundraiser>;
```

Both should `PATCH /fundraisers/{id}` with `{ status: 'paused' | 'active' }` (confirm endpoint shape — open question). Re‑use existing `platformAPIClient`.

Drop `getDashboardFundraiserStats` (and its callers in tests, if any).

### New: `lib/utils/fundraiser-list.ts` (pure functions, fully unit‑testable)

```ts
export type DisplayStatus =
  | 'active'
  | 'paused'
  | 'draft'
  | 'ended'
  | 'ending-soon';
export type FundraiserListSort =
  | 'newest'
  | 'oldest'
  | 'most-raised'
  | 'ending-soonest'
  | 'name-asc';
export type FundraiserListStatusFilter = 'all' | 'active' | 'paused' | 'ended';

export interface FundraiserListFilters {
  search: string;
  status: FundraiserListStatusFilter;
  sort: FundraiserListSort;
}

export interface FundraiserStatusCounts {
  all: number;
  active: number;
  paused: number;
  ended: number;
}

export const ENDING_SOON_THRESHOLD_DAYS = 7;

export function deriveDisplayStatus(f: Fundraiser, now?: Date): DisplayStatus;
export function getDaysLeft(endDate: string, now?: Date): number; // negative if past
export function filterFundraisers(
  list: Fundraiser[],
  f: FundraiserListFilters
): Fundraiser[];
export function sortFundraisers(
  list: Fundraiser[],
  sort: FundraiserListSort
): Fundraiser[];
export function getStatusCounts(list: Fundraiser[]): FundraiserStatusCounts;
```

**Filter buckets — driven by API `status` only:**

| API `status`             | Filter bucket | `DisplayStatus` (badge)                             |
| ------------------------ | ------------- | --------------------------------------------------- |
| `active`                 | **Active**    | `active`, or `ending-soon` if `0 < getDaysLeft ≤ 7` |
| `paused`                 | **Paused**    | `paused`                                            |
| `draft`                  | **Paused**    | `draft` (distinct label)                            |
| `completed`, `cancelled` | **Ended**     | `ended`                                             |

Rules:

- `deriveDisplayStatus`: switch on API `status`. `'completed' | 'cancelled'` → `ended`. `'paused'` → `paused`. `'draft'` → `draft`. `'active'` → `ending-soon` if `0 < getDaysLeft ≤ ENDING_SOON_THRESHOLD_DAYS`, else `active`. `endDate` is **not** consulted for non‑active statuses — the API status wins.
- `filterFundraisers`:
  - `all` → everything (no exclusions; drafts included).
  - `active` → API `status === 'active'` (covers both `active` and `ending-soon` badges).
  - `paused` → API `status` in `{'paused','draft'}`.
  - `ended` → API `status` in `{'completed','cancelled'}`.
  - Search matches title and host display name (lowercased, trimmed).
- `sortFundraisers`: stable sort. `newest`/`oldest` use `startDate`; `ending-soonest` puts ended/paused/draft last and orders active rows by smallest positive `daysLeft`; `most-raised` uses `totalRaised` desc with currency tiebreak via `currency.localeCompare`; `name-asc` uses `title.localeCompare(other, locale, { sensitivity: 'base' })` — locale must be passed in.
- `getStatusCounts`: returns `{ all, active, paused, ended }` using the same buckets above. `paused` includes drafts.

### Hook: `useFundraiserListFilters`

Located in [src/components/dashboard/use-fundraiser-list-filters.ts](src/components/dashboard/use-fundraiser-list-filters.ts) (or `src/lib/hooks/`).

```ts
const DEFAULT_FILTERS: FundraiserListFilters = {
  search: '',
  status: 'all',
  sort: 'newest',
};
export function useFundraiserListFilters(): {
  filters: FundraiserListFilters;
  setFilters: (next: Partial<FundraiserListFilters>) => void;
  reset: () => void;
};
```

**URL sync (recommended, flag as decision):** persist filters in the query string via Next.js `useSearchParams` so a refresh keeps the user's view. Skip if it adds noise to analytics; document the choice either way.

---

## Page Composition

The page stays thin: `AuthGuard` → single `getFundraisers(accessToken)` fetch → memoized `getDashboardSummary` → composes feature components. Per‑PR composition (what's wired up at each step) lives in the **Delivery Plan** section above.

After PR 4, mutation refresh strategy: a successful Pause/Resume calls `onMutate()` which re‑runs `fetchFundraisers`. Optimistic update is a polish item, not v1.

---

## i18n

Extend `locales/en/dashboard.json` and `locales/de/dashboard.json` under the existing `Dashboard` namespace. Update [src/i18n/types.ts](src/i18n/types.ts) so `useTranslations('Dashboard')` stays type‑safe.

Proposed key shape (English; German mirrors structure):

```json
{
  "Dashboard": {
    "breadcrumb": { "home": "Home", "dashboard": "Dashboard" },
    "manageFundraisers": {
      "title": "Manage fundraisers",
      "subtitle": "View, edit, and track every fundraiser you've created. Pause collection, or share the ones that need a push."
    },
    "summary": {
      "fundraisers": {
        "label": "Fundraisers",
        "activeHelper": "{count, plural, =0 {No active} one {# active} other {# active}}"
      },
      "totalRaised": {
        "label": "Total Raised",
        "helper": "across all time",
        "moreCurrencies": "+{count, plural, one {# more currency} other {# more currencies}}",
        "empty": "No funds raised yet"
      },
      "donations": {
        "label": "Donations",
        "helper": "from supporters"
      }
    },
    "toolbar": {
      "searchPlaceholder": "Search by name or host…",
      "resultCount": "Showing {visible} of {total}"
    },
    "statusFilter": {
      "all": "All",
      "active": "Active",
      "paused": "Paused",
      "ended": "Ended"
    },
    "sort": {
      "label": "Sort: {value}",
      "options": {
        "newest": "Newest first",
        "oldest": "Oldest first",
        "most-raised": "Most raised",
        "ending-soonest": "Ending soonest",
        "name-asc": "Name A–Z"
      }
    },
    "statusBadge": {
      "active": "Active",
      "paused": "Paused",
      "draft": "Draft",
      "ended": "Ended",
      "ending-soon": "Ending soon"
    },
    "listItem": {
      "byHost": "by {host}",
      "amountOfGoal": "{raised} of {goal}",
      "donations": "{count, plural, one {# donation} other {# donations}}",
      "daysLeft": "{count, plural, one {# day left} other {# days left}}",
      "ended": "Ended"
    },
    "actions": {
      "menuLabel": "Open actions",
      "edit": "Edit",
      "copyLink": "Copy link",
      "pause": "Pause",
      "resume": "Resume",
      "copyLinkSuccess": "Link copied",
      "copyLinkError": "Could not copy link",
      "pauseSuccess": "Fundraiser paused",
      "resumeSuccess": "Fundraiser resumed",
      "mutationError": "Something went wrong. Try again."
    },
    "empty": {
      "title": "You haven't created a fundraiser yet",
      "description": "Start a campaign to begin collecting donations.",
      "cta": "Create your first fundraiser"
    },
    "noResults": {
      "title": "No fundraisers match these filters.",
      "cta": "Clear filters"
    },
    "statsError": {
      "title": "Couldn't load dashboard stats",
      "description": "Something went wrong while loading your fundraiser data.",
      "retry": "Try again"
    }
  }
}
```

---

## Edge Cases & Behavior

| Scenario                                                       | Behavior                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User has zero fundraisers                                      | Hide toolbar, show `FundraiserListEmpty` with CTA. Summary tiles still render with zeros.                                                                                                                                                                        |
| User has fundraisers, but filter/search returns none           | Show `FundraiserListNoResults` with "Clear filters" button. Toolbar stays visible.                                                                                                                                                                               |
| Multiple currencies in total raised                            | Stat tile shows the dominant currency total + helper "+N more currencies"; tooltip or clicking expands the per‑currency list. (Decision: cap at 1 line in tile to preserve layout.)                                                                              |
| Fundraiser with `endDate` passed but API `status === 'active'` | Stays in **Active** filter — API `status` is the source of truth. Badge shows `ending-soon` only while `daysLeft > 0`; once past, badge falls back to `active` (no special "expired but active" state). Backend is responsible for transitioning to `completed`. |
| `endDate` ≤ 7 days away and API `status === 'active'`          | `ending-soon` badge (amber). Counted under **Active** filter (`ending-soon` is a visual subset of active, not a separate bucket).                                                                                                                                |
| `status === 'completed'` or `'cancelled'`                      | **Ended** filter. Read‑only — action menu shows **Copy link only** (no Edit, no Pause/Resume).                                                                                                                                                                   |
| `status === 'paused'`                                          | **Paused** filter. Action menu shows Resume.                                                                                                                                                                                                                     |
| `status === 'draft'`                                           | **Paused** filter, badge label "Draft". Action menu shows Edit + Copy link, **no** Pause/Resume (drafts are published, not resumed). Counted under `pausedCount`.                                                                                                |
| Long titles / host names                                       | Truncate with ellipsis (`line-clamp-1` for title, `truncate` for host). Full text in `title=""` attr for tooltip.                                                                                                                                                |
| Missing `fundraiser.image`                                     | Render solid placeholder with first letter of title; same dimensions.                                                                                                                                                                                            |
| Missing host display name                                      | Fall back to `host.user?.name`, then `t('listItem.unknownHost')`.                                                                                                                                                                                                |
| `navigator.clipboard` unavailable (HTTP, old browser)          | Fall back to a hidden `<input>` + `document.execCommand('copy')`; if both fail show error toast.                                                                                                                                                                 |
| Pause/Resume API in flight                                     | Disable that menu item, show inline spinner; ignore repeated clicks.                                                                                                                                                                                             |
| Pause/Resume API fails                                         | Show error toast, do NOT mutate local state, keep previous status.                                                                                                                                                                                               |
| Search typed quickly                                           | Debounce 250 ms before filtering; filtering itself is sync and cheap.                                                                                                                                                                                            |
| List > ~50 items                                               | Acceptable for v1 (no virtualization). Flag as a future concern if perf testing shows scroll stutter.                                                                                                                                                            |
| User on small screen                                           | Toolbar stacks; status filter scrolls horizontally; action menu remains a `Dropdown` (not a sheet) for v1.                                                                                                                                                       |

---

## Accessibility

- `DashboardHeader`'s `<h1>` is the page's only h1.
- Search input has visible placeholder + `aria-label` from `t('toolbar.searchPlaceholder')`.
- Status filter uses `role="radiogroup"` with each pill as `role="radio" aria-checked`. Sort menu uses the existing `DropdownMenu` primitive (already accessible).
- Each `FundraiserListItem` is a `<li>` inside `<ul>`; the row title is the only link in the row's main flow. Action menu trigger has `aria-label={t('actions.menuLabel')}`.
- Status badges are decorative — the same status text is in the row's accessible name (e.g., `aria-label="Plant 500 trees, Active, €2,000 of €5,000"`). Don't rely on color alone.
- Toast messages also write to a polite `aria-live` region.

---

## Test Plan

Manual:

- `npm run type-check`
- Sign in → `/dashboard` renders header, three tiles, list. Numbers match `getFundraisers` payload.
- Search "plan" → list filters; clear → restores. Verify debounce feels snappy, not sluggish.
- Toggle status filter; toggle again to "All". Verify counts in pills don't change as you toggle.
- Cycle every sort option; verify ordering matches spec (especially `ending-soonest` placing past‑end at the bottom).
- Open action menu on Active row → Pause → row badge flips to Paused, "Active" filter loses one, "Paused" gains one. Resume reverses it.
- Copy link on a row → paste elsewhere matches the public URL.
- Force network failure on Pause → row stays Active, error toast shows.
- Empty state: log in as a user with zero fundraisers (or temporarily stub) → verify `FundraiserListEmpty` and CTA.
- DE locale: verify all copy translates and plurals (`{count, plural, …}`) render correctly.
- Mobile width (≤ 640 px): toolbar stacks, list rows remain readable, action menu opens within viewport.

Unit (recommended for `lib/utils/fundraiser-list.ts`):

- `deriveDisplayStatus` truth table covering all status × dateLeft combinations.
- `filterFundraisers` for each status filter + search match cases.
- `sortFundraisers` for each sort option, including ties.
- `getStatusCounts` against a fixture with mixed statuses.

---

## Open Questions / Decisions Needed

1. **Pause/Resume endpoint** — confirm `PATCH /fundraisers/{id}` accepts `{ status }`. If not, backend work needed first.
2. **Copy link on drafts** — drafts may not have a publicly resolvable URL. If not, hide Copy link for drafts (leaving Edit only).
3. **URL‑sync filters?** Persist `?status=active&sort=most-raised&q=plan` in the query string?
4. **Pagination** — list is unpaginated for v1. Confirm this is acceptable for users with > 50 fundraisers.
5. **Multi‑currency tile** — single dominant total + "+N more" vs. always show all currencies stacked (current legacy behavior). Picking dominant keeps the tile height stable.

**Resolved:**

- Ended fundraisers (`completed` / `cancelled`) are read‑only — no Edit, only Copy link.
- Filter buckets are driven by API `status` only (not `endDate`).
- Drafts share the **Paused** filter bucket but render with a distinct "Draft" badge.
- Toast feedback uses `sonner` (already a dependency, used elsewhere in the app).

---

## Migration Checklist (per PR)

### PR 1 — Header + summary tiles ✅

- [x] Delete legacy components: `card-base.tsx`, `my-fundraisers-card.tsx`, `total-raised-card.tsx`, `donations-card.tsx`, `dashboard-stat-card-skeleton.tsx`.
- [x] Add `dashboard-header.tsx`, `dashboard-summary.tsx`, `summary-stat-card.tsx`, `summary-stat-card-skeleton.tsx`; update `src/components/dashboard/index.ts`.
- [x] Replace `getDashboardFundraiserStats` with slim `getDashboardSummary` (`{ totalCount, activeCount, donationsCount, totalRaisedByCurrency }`).
- [x] Rewrite `src/app/(standard)/dashboard/page.tsx`: `AuthGuard` → breadcrumb → header → summary.
- [x] Update locale files (`breadcrumb.*`, `manageFundraisers.*`, `summary.*`, `statsError.*` only).
- [x] Update `src/components/auth/user-menu.tsx` to use `breadcrumb.dashboard` (legacy `dashboard` key dropped).

### PR 2 — Fundraiser list (read‑only)

- [ ] Add `status?: FundraiserStatus` to the `Fundraiser` interface (optional, `canDonate` fallback).
- [ ] Add `src/lib/utils/fundraiser-list.ts` with **only** `DisplayStatus`, `ENDING_SOON_THRESHOLD_DAYS`, `getDaysLeft`, `deriveDisplayStatus`.
- [ ] Add components: `fundraiser-status-badge.tsx`, `fundraiser-list-item.tsx`, `fundraiser-list-item-skeleton.tsx`, `fundraiser-list.tsx`, `fundraiser-list-empty.tsx`; export from `index.ts`.
- [ ] Page: render the list directly under `DashboardSummary`, sorted newest‑first by `startDate`.
- [ ] Locale keys: `statusBadge.*`, `listItem.*`, `empty.*`.
- [ ] Unit tests for `deriveDisplayStatus`.

### PR 3 — Toolbar (search + filter + sort)

- [ ] Extend `src/lib/utils/fundraiser-list.ts` with filter/sort/counts types + functions.
- [ ] Add `useFundraiserListFilters` hook in `src/components/dashboard/`.
- [ ] Add components: `fundraiser-search-input.tsx`, `fundraiser-status-filter.tsx`, `fundraiser-sort-menu.tsx`, `fundraiser-list-toolbar.tsx`, `fundraiser-list-no-results.tsx`, `fundraiser-list-section.tsx`; export from `index.ts`.
- [ ] Replace the bare list in the page with `FundraiserListSection`.
- [ ] Locale keys: `toolbar.*`, `statusFilter.*`, `sort.*`, `noResults.*`.
- [ ] Unit tests for `filterFundraisers`, `sortFundraisers`, `getStatusCounts`.
- [ ] Confirm backend has shipped `status` on `GET /fundraisers` before merging.

### PR 4 — Per‑row actions

- [ ] Add `patch` / `patchAuthenticated` to `lib/api/external-client.ts`.
- [ ] Add `pauseFundraiser` / `resumeFundraiser` to `lib/api/fundraisers-service.ts`.
- [ ] Add `fundraiser-action-menu.tsx`; export from `index.ts`.
- [ ] Thread `onMutate = refetch` from the page → section → list → item → menu.
- [ ] Locale keys: `actions.*`.
- [ ] Verify Pause/Resume endpoint contract with backend before merging.

### Cross‑PR housekeeping

- [ ] Update [docs/structure.md](docs/structure.md) entries for the new dashboard files once PR 4 lands (or piecemeal per PR if the inventory grows quickly).
