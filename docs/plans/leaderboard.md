# Leaderboard Implementation Plan

## Context

- Prototype reference: `gofundnature` — components and patterns will be ported and adapted.
- Leaderboard type already exists in `src/lib/types/fundraiser.ts` and defaults are set in `src/lib/utils/fundraiser-data-builder.ts`. No UI exists yet.
- API endpoint: `GET /fundraisers/{hid}/leaderboard` (public, no auth required)
- API response shape: `{ recent, top, donorCount, donationCount, settings }`

## What Already Exists

- Leaderboard settings as an inline type inside `FundraiserSettings['modules']['leaderboard']` in `src/lib/types/fundraiser.ts` — no named export yet; Step 1 extracts it as `LeaderboardModuleSettings`
- `DEFAULT_MODULES.leaderboard` defaults in `src/lib/utils/fundraiser-data-builder.ts`
- `DEFAULT_MODULES` is already merged into `buildCreateFundraiserRequest()`, but hardcoded — form values do not override it yet
- `formatCurrency` in `src/lib/utils/currency.ts`
- shadcn `Switch`, `Tabs`, `Avatar` in `src/components/ui/`

## What Must Be Ported from Prototype

- `leaderboard.tsx` → `leaderboard-view.tsx` (`LeaderboardView`) — horizontal scrolling display component with auto-scroll logic; renamed to avoid collision with the `leaderboard/` folder name — **done (Step 3)**
- `leaderboard-container.tsx` — handles loading/error/enabled states, tab state, data processing
- `formatTimeAgo()` — pulled forward into `src/lib/utils/time.ts` during Step 3; **done**

## Steps

### Step 1 - Types, form schema + default values

**What:**

First, define a shared `LeaderboardModuleSettings` type in `src/lib/types/fundraiser.ts` covering all 8 fields: `enabled`, `view_all`, `anonymize`, `default_tab`, `show_amount`, `show_top_list`, `show_recent_list`, `show_avatar`. Use it in:

- `FundraiserSettings['modules']['leaderboard']` (already exists — replace the inline type)
- `CreateFundraiserRequest.settings.modules.leaderboard`
- `UpdateFundraiserRequest.settings` — change from `Pick<FundraiserSettings, 'theme'>` to an explicit partial shape with `theme?` and `modules?: { leaderboard? }`. Expand modules here as new module settings are added.

Note: the prototype's `CreateFundraiserRequest` omits `show_avatar` — that is an oversight; the API accepts it.

Then, add `settings.modules.leaderboard` to the Zod schema in `src/components/fundraisers/fundraiser-form-schema.ts`:

- For create: add leaderboard defaults to `buildDefaultCreateValues()` in the same file (this is what `create-fundraiser-form-context.tsx` reads — the context file itself does not need to change).
- For edit: add leaderboard mapping to `fundraiserToFormValues()` in the same file using `{ ...DEFAULT_LEADERBOARD, ...fundraiser.settings?.modules?.leaderboard }` — defaults are overridden by whatever the API returned (this is what `edit-fundraiser-form-context.tsx` reads — the context file itself does not need to change).

**Files:**

- `src/lib/types/fundraiser.ts` (define `LeaderboardModuleSettings`; update `CreateFundraiserRequest`, `UpdateFundraiserRequest`)
- `src/components/fundraisers/fundraiser-form-schema.ts`

**Visual test:** Open `CreateFundraiserFormProvider` in DevTools React panel. Confirm `settings.modules.leaderboard` exists in form state with correct defaults. Open edit form and check `EditFundraiserFormProvider` — confirm it pre-populates from saved fundraiser data.

---

### Step 2 - LeaderboardSettings UI component (toggles, no preview)

**What:** Create a `leaderboard/` folder under `src/components/fundraisers/` with three files:

- `leaderboard-settings.tsx` — the section row: `SectionHeader` (with `className='flex-row items-center justify-between'` following the `project-selection.tsx` pattern) containing the enable/disable `Switch` and the settings dropdown trigger. Owned RHF controller via `useController`. Also renders `DisabledView` when disabled.
- `leaderboard-settings-dropdown.tsx` — the gear/X icon button with a `DropdownMenu` overlay containing 6 option `Switch` items: show_recent_list, show_top_list, show_amount, view_all, anonymize, show_avatar. Receives `settings` and `onChange` as props. Uses `DropdownMenu` (not a Card overlay) for consistent border styling, outside-click close, and Escape key support.
- `disabled-view.tsx` — dashed placeholder shown when leaderboard is disabled.

Add new translation files (`locales/en/leaderboard.json`, `locales/de/leaderboard.json`) under the `Leaderboard.form` namespace. Register in `src/i18n/request.ts` and `src/i18n/types.ts`.

Add `LeaderboardSettings` to `MainPanel` in `src/components/fundraisers/fundraiser-form-body.tsx`, below `<Title />`.

**Files:**

- `src/components/fundraisers/leaderboard/leaderboard-settings.tsx` (new)
- `src/components/fundraisers/leaderboard/leaderboard-settings-dropdown.tsx` (new)
- `src/components/fundraisers/leaderboard/disabled-view.tsx` (new)
- `locales/en/leaderboard.json` (new)
- `locales/de/leaderboard.json` (new)
- `src/i18n/request.ts`
- `src/i18n/types.ts`
- `src/components/fundraisers/fundraiser-form-body.tsx`

**Visual test:** Create/edit form shows a "Leaderboard" row in the main panel below the title. Toggle on/off. Open gear icon — all 6 options appear with working toggles. React DevTools confirms form state updates on each toggle.

---

### Step 3 - Leaderboard preview inside settings ✓

**What:** Ported `leaderboard.tsx` from the prototype into `leaderboard-view.tsx` as `LeaderboardView`. Refactored into sub-components. Added mock data and translations. Wired live preview into `LeaderboardSettings`.

**Actual implementation:**

- `LeaderboardView` accepts `recentDonations`, `topDonations`, and `settings` as props (shaped to match the real API so Step 6 fits without rework). Tab state and `effectiveTab` fallback logic are internalized.
- Extracted `DonationItem` (avatar, name, amount, time) and `ScrollingDonationList` (owns scroll ref and auto-scroll interval). `isActive` prop controls scroll lifecycle — avoids `setState` in `useEffect`.
- Avatar fallback color is stable: hashed from `donation.id` charCodes, not array index.
- `formatTimeAgo` and `parseUTCDate` pulled forward into `src/lib/utils/time.ts` (originally planned for Step 6).
- Domain type `LeaderboardDonation` in `src/lib/types/leaderboard.ts` (originally planned for Step 5); `created` field is a UTC ISO 8601 string without timezone suffix.
- Mock data co-located in `src/components/fundraisers/leaderboard/mock-data.ts`; generates fresh timestamps on each call.
- Translations added under `Leaderboard.view` namespace in `locales/en/leaderboard.json` and `locales/de/leaderboard.json`.

**Files:**

- `src/components/fundraisers/leaderboard/leaderboard-view.tsx` (new)
- `src/components/fundraisers/leaderboard/donation-item.tsx` (new)
- `src/components/fundraisers/leaderboard/scrolling-donation-list.tsx` (new)
- `src/components/fundraisers/leaderboard/mock-data.ts` (new)
- `src/components/fundraisers/leaderboard/leaderboard-settings.tsx` (updated — passes `settings` object, uses mock data for preview)
- `src/lib/types/leaderboard.ts` (new — pulled forward from Step 5)
- `src/lib/utils/time.ts` (new — pulled forward from Step 6)
- `locales/en/leaderboard.json`, `locales/de/leaderboard.json` (updated — added `Leaderboard.view` namespace)

**Visual test:** With leaderboard enabled, a horizontal scrolling preview appears in the sidebar. Toggle "Show Amounts" — amounts appear/disappear. Toggle tabs — Newest/Top tabs appear/disappear. Toggle "Anonymize" — names become "Anonymous". Toggle avatars on/off.

---

### Step 4 - Pass leaderboard config in create and update API requests

**What:** Two definite code changes in `src/lib/utils/fundraiser-data-builder.ts`:

1. `buildCreateFundraiserRequest()` — replace the hardcoded `modules: DEFAULT_MODULES` with a merge that uses `values.settings.modules.leaderboard` from form values.
2. `buildUpdateFundraiserRequest()` — add an `isLeaderboardDirty()` helper (following the same pattern as the existing `isThemeDirty()`), and add a leaderboard branch that sets `request.settings.modules.leaderboard` when dirty.

The type changes needed here were done in Step 1.

**Files:**

- `src/lib/utils/fundraiser-data-builder.ts`

**Visual test:** Create a fundraiser with leaderboard disabled. Network tab shows `modules.leaderboard.enabled: false` in the request body. Edit that fundraiser, change a leaderboard option, save — confirm the update payload includes the new leaderboard settings.

---

### Step 5 - Leaderboard API service

**What:** Created `src/lib/api/leaderboard-service.ts` with `getLeaderboard(idOrSlug)` and `getLeaderboardWithRetry(idOrSlug, maxRetries=2)` using `platformAPIClient` (public, no auth). Retry uses exponential backoff (1s, 2s). Added `LeaderboardApiResponse` to `src/lib/types/leaderboard.ts`.

**Files:**

- `src/lib/api/leaderboard-service.ts` (new)
- `src/lib/types/leaderboard.ts` (added `LeaderboardApiResponse`)

**Note:** No independently testable state — verified via Step 6.

---

### Step 6 - Leaderboard display on fundraiser detail page

**What:** Create `src/components/fundraisers/leaderboard/leaderboard-loader.tsx` as an async server component. It calls `getLeaderboardWithRetry` directly, returns null on error, and renders `LeaderboardView` with real data on success. Also exports `LeaderboardSkeleton` used as the `<Suspense>` fallback.

Settings come from the fundraiser object (not the leaderboard API response) — solves the `show_avatar` gap where the leaderboard API omits that field. `FundraiserView` gates on `canShowLeaderboard` (`enabled` and at least one of `show_recent_list` / `show_top_list` is true) before mounting, and passes `fundraiser.slug` and the full settings object down. The `<Suspense>` boundary streams the skeleton while the server fetch resolves — no client-side state or effects needed.

`formatTimeAgo()` is already in `src/lib/utils/time.ts` (done in Step 3).

**Files:**

- `src/components/fundraisers/leaderboard/leaderboard-loader.tsx` (new)
- `src/components/fundraisers/fundraiser-view.tsx` (add `<Suspense>` + `LeaderboardLoader`)

**Visual test:** Open a fundraiser detail page. Skeleton streams in, then real donor data appears. Tabs switch Newest/Top. Auto-scroll runs. If `enabled: false`, nothing renders. If both `show_recent_list` and `show_top_list` are false, nothing renders. If `show_amount: false`, amounts are hidden.

---

### Fix - Validate that at least one tab is enabled

**What:** Warn the user when the leaderboard is enabled but both `show_recent_list` and `show_top_list` are disabled — a config that renders nothing on the detail page. Submission is still allowed; the detail page already handles this case via `canShowLeaderboard`.

- `leaderboard/no-tabs-warning.tsx` — new component styled like `DisabledView` but amber, shown in the settings section whenever the invalid state is active.
- `leaderboard-settings.tsx` — render `NoTabsWarning` when `settings.enabled && !(settings.show_recent_list || settings.show_top_list)`.
- Translation keys added under `Leaderboard.form.noTabsWarning` in both locale files.

**Files:**

- `src/components/fundraisers/fundraiser-form-schema.ts`
- `src/components/fundraisers/leaderboard/no-tabs-warning.tsx` (new)
- `src/components/fundraisers/leaderboard/leaderboard-settings.tsx`
- `locales/en/leaderboard.json`, `locales/de/leaderboard.json`

**Visual test:** Enable the leaderboard, then disable both "Show Recent List" and "Show Top List". An amber warning appears. Try to submit — form is blocked. Re-enable either tab — warning disappears and submission succeeds.

---

## Implementation Notes

- **Circular dependency (Step 1):** `fundraiser-data-builder.ts` imports `FundraiserFormValues` from `fundraiser-form-schema.ts`. The schema file cannot import `DEFAULT_MODULES` back from the data builder. Resolved by defining `DEFAULT_LEADERBOARD: LeaderboardModuleSettings` directly in `fundraiser-form-schema.ts`.
- **`LeaderboardLoader` is a server component (Step 6):** Async server component with `<Suspense>` streaming — no client-side state or effects. Settings come from the fundraiser object to cover the `show_avatar` gap in the leaderboard API response. `page.tsx` needs no changes.
- **Step 5 — no leaderboard service in prototype:** The prototype has no dedicated leaderboard API service file. The service in this project will be written fresh (not ported), following the `platformAPIClient` pattern from `fundraiser-service.ts`.

## Summary

| Step | Builds                      | Testable on                    | Status |
| ---- | --------------------------- | ------------------------------ | ------ |
| 1    | Form schema + defaults      | DevTools form state            | [x]    |
| 2    | Settings toggles UI         | Create/edit form sidebar       | [x]    |
| 3    | Live settings preview       | Sidebar preview with mock data | [x]    |
| 4    | API request includes config | Network tab on create/edit     | [x]    |
| 5    | Leaderboard data service    | Network tab (via Step 6)       | [ ]    |
| 6    | Leaderboard on detail page  | Fundraiser detail page         | [ ]    |
| Fix  | No-tabs warning (informational) | Create/edit form           | [x]    |
