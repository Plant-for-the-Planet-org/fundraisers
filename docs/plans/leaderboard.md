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

- `leaderboard.tsx` — horizontal scrolling display component with auto-scroll logic
- `leaderboard-container.tsx` — handles loading/error/enabled states, tab state, data processing
- `formatTimeAgo()` — does not exist in this project; port from `gofundnature/src/lib/utils.ts` into `src/lib/utils/time.ts`

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

### Step 3 - Leaderboard preview inside settings

**What:** Port `leaderboard.tsx` from the prototype into `src/components/fundraisers/leaderboard/leaderboard.tsx` (adapting imports to the fundraisers project's `formatCurrency` and shadcn paths). Render it inside `LeaderboardSettings` with mock donations — live-updating as settings change. Currency comes from `useFormContext`. Keep horizontal auto-scroll behavior from the prototype.

**Files:**

- `src/components/fundraisers/leaderboard/leaderboard.tsx` (new, ported from prototype)
- `src/components/fundraisers/leaderboard/leaderboard-settings.tsx` (add preview below the enable toggle)

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

**What:** Create `src/lib/api/leaderboard-service.ts`. Port `getLeaderboard` and `getLeaderboardWithRetry` from the prototype, adapted to use the fundraisers project's `platformAPIClient` pattern. Endpoint: `GET /fundraisers/{hid}/leaderboard` (public, no auth). Add a `LeaderboardResponse` type to `src/lib/types/leaderboard.ts` (matching the API shape: `{ recent, top, donorCount, donationCount, settings }`).

**Files:**

- `src/lib/api/leaderboard-service.ts` (new)
- `src/lib/types/leaderboard.ts` (new)

**Visual test:** No visual change yet — verify in isolation via a quick console log or Network tab call.

---

### Step 6 - Leaderboard display component + fundraiser detail page

**What:** Port `leaderboard-container.tsx` from the prototype as `src/components/fundraisers/leaderboard/leaderboard-container.tsx`. It handles: loading state, error state, `enabled` flag (renders null if disabled), tab state, data processing with `formatTimeAgo`.

Port `formatTimeAgo()` from `gofundnature/src/lib/utils.ts` into `src/lib/utils/time.ts` and import it from there.

Fetch leaderboard data in the fundraiser detail page (`src/app/(fundraiser)/fundraisers/[slug]/page.tsx`). The URL param is `slug`, but the leaderboard API requires `hid` — read `fundraiser.hid` from the already-fetched fundraiser object returned by `getCachedFundraiser(slug)`. Pass the leaderboard data to `LeaderboardContainer`. Add `LeaderboardContainer` to `src/components/fundraisers/fundraiser-view.tsx`.

**Files:**

- `src/lib/utils/time.ts` (new — port `formatTimeAgo` from prototype)
- `src/components/fundraisers/leaderboard/leaderboard-container.tsx` (new, ported from prototype)
- `src/app/(fundraiser)/fundraisers/[slug]/page.tsx`
- `src/components/fundraisers/fundraiser-view.tsx`

**Visual test:** Open a fundraiser detail page. Leaderboard renders with real donor data. Tabs switch Newest/Top. Auto-scroll runs. If a fundraiser has `enabled: false`, nothing renders. If `show_amount: false`, amounts are hidden.

---

## Implementation Notes

- **Circular dependency (Step 1):** `fundraiser-data-builder.ts` imports `FundraiserFormValues` from `fundraiser-form-schema.ts`. The schema file cannot import `DEFAULT_MODULES` back from the data builder. Resolved by defining `DEFAULT_LEADERBOARD: LeaderboardModuleSettings` directly in `fundraiser-form-schema.ts`.
- **`FundraiserView` prop gap (Step 6):** The plan says to add `LeaderboardContainer` to `fundraiser-view.tsx` but doesn't mention widening the props. `FundraiserView` needs a new `leaderboardData?: LeaderboardResponse | null` prop, passed down from `page.tsx`.
- **Step 5 — no leaderboard service in prototype:** The prototype has no dedicated leaderboard API service file. The service in this project will be written fresh (not ported), following the `platformAPIClient` pattern from `fundraiser-service.ts`.

## Summary

| Step | Builds                      | Testable on                    | Status |
| ---- | --------------------------- | ------------------------------ | ------ |
| 1    | Form schema + defaults      | DevTools form state            | [x]    |
| 2    | Settings toggles UI         | Create/edit form sidebar       | [x]    |
| 3    | Live settings preview       | Sidebar preview with mock data | [ ]    |
| 4    | API request includes config | Network tab on create/edit     | [ ]    |
| 5    | Leaderboard data service    | Console / Network tab          | [ ]    |
| 6    | Leaderboard on detail page  | Fundraiser detail page         | [ ]    |
