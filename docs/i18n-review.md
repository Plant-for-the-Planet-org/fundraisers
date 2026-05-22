# i18n / Localization Review — Fundraisers App

> **Review date:** 2026-05-21
> **Last updated:** 2026-05-22 — app-level (§10) closed out in one commit: root-layout metadata reads from `Common.metadata.*`, the Next.js scaffold logo is now decorative (`alt=''`), and the sentry-test page is gated behind `NODE_ENV !== 'production'` (split into a server-component gate + client child). Shared chrome (§9), stage (§7), dashboard (§6), explore page (§5), donate overlay (§4), fundraiser detail page (§3), and impersonation strings previously resolved.
> **Scope:** Full codebase audit of internationalization (i18n) coverage, locale-aware formatting, and accessibility text localization.
> **Stack:** `next-intl` + cookie-based locale (`ui-locale`), locales `en` and `de` (default `de`), `localePrefix: 'never'`.

---

## Recently Resolved

- ✅ **Impersonation Modal** — all labels, placeholders, buttons, and 8 validation messages migrated to `Auth.impersonation.*`.
- ✅ **User Menu** — `userMenuLabel`, `'User'` fallback, and impersonate/switch labels translated; avatar `alt` reduced to decorative empty string.
- ✅ **Impersonation Banner** — banner message and stop button localized (`Auth.impersonation.bannerMessage`, `Auth.impersonation.stop`).
- ✅ **Impersonation validation errors** — all `setError` paths now route through translated keys under `Auth.impersonation.errors`.
- ✅ **User fallback** — `displayName || 'User'` now uses `Auth.impersonation.userDefault`.
- ✅ **Fundraiser detail page (§3)** — not-found copy translated; contribution-settings preview alert replaced with translated sonner toast (ICU select for dedicated/frequency); create/update toasts drop raw `err.message` in favor of translated `errorDescription`; edit hook surfaces translated `loadError`; `toLocaleString()` calls in donors-preview and fundraiser-view now pass `useLocale()`.
- ✅ **Donate overlay (§4)** — overlay aria labels translated (`Donate.overlay.aria.*`); SEPA form (5 errors + placeholder) and card form (6 errors) now read from `Donate.{sepa,card}.errors.*`; address-form drops raw `err.message` in favor of translated `saveAddressError`; donation-summary swaps `' and '` join for `Intl.ListFormat`; payment-method icons marked decorative (`aria-hidden='true'`) so the already-translated visible button text isn't double-announced.
- ✅ **Explore page (§5)** — location-category-map placeholder copy reads from `Explore.locationMap.*` (converted to async server component); category-page-skeleton's `aria-label='Loading'` now reads from `Explore.categoryPage.loadingAria` via the sync `useTranslations` hook (safe for use as a Suspense fallback).
- ✅ **Dashboard (§6)** — dashboard-summary's active-fundraisers helper now uses a single ICU rich-text plural (`Dashboard.summary.fundraisers.activeStatus`) instead of a JS `> 0` branch + count/suffix concat; fundraiser-search-input's `aria-label` reads from a distinct `Dashboard.toolbar.searchAria` key.
- ✅ **Stage (§7)** — `stage-top-bar.tsx` brand + partner `<img alt>` attributes now read from `Stage.topBar.{brandAlt, partnerAlt}` (EN adds "logo" for screen-reader context; DE uses `"…-Logo"` / `"Partnerlogo"`).
- ✅ **Shared chrome (§9)** — dialog primitive's Close text (sr-only + visible button), info-tooltip's English `'More information'` fallback, header/footer nav `aria-label`s, header logo brand label, and footer partner `<img alt>` strings all moved to `Common.{actions,aria,brand,partners}.*`. Also dropped the unused diagnostic `message` field from `ImageUploadError` (UI already routed via `error.code`).
- ✅ **App-level (§10)** — root-layout `generateMetadata` now uses `getTranslations('Common.metadata')`; home-page Next.js scaffold logo set to `alt=''` (decorative); sentry-test page gated behind `NODE_ENV !== 'production'` via a server-component shell that calls `notFound()`, with the interactive UI extracted to `sentry-test-client.tsx`.

---

## Table of Contents

1. [Summary](#1-summary)
2. [Execution Plan — One Commit Per Page](#2-execution-plan--one-commit-per-page)
3. [Page: Fundraiser Detail (`/raise/[slug]`)](#3-page-fundraiser-detail-raiseslug)
4. [Page: Donate Overlay](#4-page-donate-overlay)
5. [Page: Explore](#5-page-explore)
6. [Page: Dashboard](#6-page-dashboard)
7. [Page: Stage](#7-page-stage)
8. [Page: Auth & User Menu (mostly resolved)](#8-page-auth--user-menu-mostly-resolved)
9. [Shared Chrome (Header, Footer, Dialog, Tooltip)](#9-shared-chrome-header-footer-dialog-tooltip)
10. [App-Level (Root layout, Home, Sentry test)](#10-app-level-root-layout-home-sentry-test)
11. [Cross-Cutting Utilities (separate commits)](#11-cross-cutting-utilities-separate-commits)
12. [SSR / Client Locale Mismatch Risks](#12-ssr--client-locale-mismatch-risks)
13. [Orphan Keys & CI Guardrails](#13-orphan-keys--ci-guardrails)
14. [Appendix: Locale Setup Reference](#14-appendix-locale-setup-reference)

---

## 1. Summary

| Metric | Value |
|---|---|
| **Total issues found** | ~55 across 30+ files |
| **Locales** | `en`, `de` (default: `de`) |
| **i18n library** | `next-intl` |
| **Locale detection** | Cookie (`ui-locale`); no URL prefix |
| **EN/DE key parity** | ✅ All 9 namespaces have matching key counts |

### EN/DE Key Count Parity

```
auth.json         en: 17    de: 17    ✅
bundles.json      en: 72    de: 72    ✅
common.json       en: 18    de: 18    ✅
cookie.json       en: 23    de: 23    ✅
dashboard.json    en: 61    de: 61    ✅
donate.json       en: 165   de: 165   ✅
explore.json      en: 29    de: 29    ✅
fundraisers.json  en: 209   de: 209   ✅
leaderboard.json  en: 29    de: 29    ✅
stage.json        en: 18    de: 18    ✅
```

---

## 2. Execution Plan — One Commit Per Page

Each row below is intended to land as a single commit. Pages are independent; utilities at the bottom can ripple through pages and should land first if you want page-level changes to absorb their benefits cleanly.

| # | Commit | Scope | Section |
|---|---|---|---|
| 1 | ✅ `fix(i18n): localize fundraiser detail page` | not-found, contribution-settings preview alert, create/update toast descriptions, edit hook error, donor-preview `toLocaleString` | [§3](#3-page-fundraiser-detail-raiseslug) |
| 2 | ✅ `fix(i18n): localize donate overlay` | overlay aria labels, stripe SEPA/card form errors+placeholder, address-form error, donation-summary host joiner, payment-method icon aria | [§4](#4-page-donate-overlay) |
| 3 | ✅ `fix(i18n): localize explore page` | location-category-map placeholder, category-page-skeleton aria | [§5](#5-page-explore) |
| 4 | ✅ `fix(i18n): tidy dashboard pluralization & search aria` | dashboard-summary plural form, fundraiser-search-input distinct aria | [§6](#6-page-dashboard) |
| 5 | ✅ `fix(i18n): localize stage page` | stage-top-bar brand/partner alt text | [§7](#7-page-stage) |
| 6 | ✅ `fix(i18n): localize shared chrome` | dialog Close, info-tooltip fallback, header/footer aria labels, footer logo alt | [§9](#9-shared-chrome-header-footer-dialog-tooltip) |
| 7 | ✅ `fix(i18n): localize app-level pages & metadata` | root layout metadata, home scaffold alt, sentry-test gating | [§10](#10-app-level-root-layout-home-sentry-test) |
| U1 | `refactor(i18n): require locale in formatCurrency*` | utility change + migrate all call sites (or via `useFormatCurrency` hook) | [§11.1](#111-formatcurrency--make-locale-mandatory--useformatcurrency-hook) |
| U2 | `refactor(i18n): rewrite formatTimeAgo with Intl.RelativeTimeFormat` | utility change + migrate 3 call sites | [§11.2](#112-formattimeago--intlrelativetimeformat--useformattimeago-hook) |
| U3 | `refactor(i18n): add joinNames helper using Intl.ListFormat` | extract helper + replace `' and '` join | [§11.3](#113-joinnames-helper-via-intllistformat) |
| U4 | `refactor(i18n): error-code → translation pattern for services` | generalize `donation-failure-banner` pattern across services | [§11.4](#114-error-code--translation-pattern-for-services) |
| Z1 | `chore(i18n): load cookie.json or document separate dictionary` | request.ts + types.ts | [§13.1](#131-cookiejson-is-not-loaded-by-next-intl) |
| Z2 | `ci(i18n): add EN/DE key-parity guardrail` | script + CI step | [§13.2](#132-no-automated-key-audit) |

**Recommended order:** utilities (U1–U4) first if you want page commits to be free of mixed concerns; otherwise pages 1–7 first, utilities after.

---

## 3. Page: Fundraiser Detail (`/raise/[slug]`) ✅ Resolved (2026-05-21)

Components under `src/components/fundraisers/*` plus the route's own files. Sections 3.1–3.5 landed in a single commit; section 3.7 (currency call sites) remains scope for utility commit U1.

### 3.1 Not-Found Page — entire component hardcoded ✅ Resolved (2026-05-21)

Converted to async server component using `getTranslations` from `next-intl/server`; copy now reads from `Fundraisers.notFound.{title, description, browseCta, homeCta}`. Literal `'404'` kept as-is (numeric code).

**File:** [src/app/(fundraiser)/raise/[slug]/not-found.tsx:8-19](../src/app/(fundraiser)/raise/[slug]/not-found.tsx#L8-L19)

**Hardcoded:** `'404'`, `'Fundraiser Not Found'`, `"The fundraiser you're looking for doesn't exist or may have been removed."`, `'Browse Fundraisers'`, `'Go Home'`

**Why:** The sibling [`error.tsx`](../src/app/(fundraiser)/raise/[slug]/error.tsx) already uses `Fundraisers.error.*` — the not-found page is inconsistent.

**Fix:** Add `Fundraisers.notFound.{title, description, browseCta, homeCta}`.

### 3.2 Contribution Settings — Native `alert()` ✅ Resolved (2026-05-21)

Replaced native `alert()` with `toast.message()` (sonner). Strings live under `Fundraisers.form.contributionSettings.preview.{title, description, frequencyLabel}`; `description` uses ICU `select` on `isDedicated`, and `frequencyLabel` uses ICU `select` on the `'once' | 'monthly' | 'yearly'` runtime values. Also threaded `useLocale()` into the `formatCurrency` call at this site (small slice of utility commit U1 — opportunistic fix while editing the line).

### 3.3 Create / Update Fundraiser Buttons — Raw error in toast description ✅ Resolved (2026-05-21)

Both buttons now show translated `Fundraisers.create.formSubmission.errorDescription` / `Fundraisers.edit.formSubmission.errorDescription` in the toast body. Raw `err` goes to `console.error` for diagnostics only. The deeper error-code → translation mapping is deferred to utility commit U4 ([§11.4](#114-error-code--translation-pattern-for-services)).

### 3.4 Edit Hook — Raw API error surface ✅ Resolved (2026-05-21)

User-facing `errorMessage` now always uses `t('loadError')`. Raw error is logged via `console.error` for diagnostics.

### 3.5 `toLocaleString()` Without Locale (also SSR risk — see §12.2) ✅ Resolved (2026-05-21)

Both call sites now pass `useLocale()` to `toLocaleString(locale)`. Server component `fundraiser-view.tsx` and client component `donors-preview.tsx` use the sync `useLocale` hook from `next-intl`, matching the pattern in [explore/fundraiser-card.tsx](../src/components/explore/fundraiser-card.tsx). Resolves the SSR/client hydration-mismatch risk for these spots.

### 3.6 Missing Keys ✅ Added (2026-05-21)

| Key | File | Purpose |
|---|---|---|
| ~~`Fundraisers.notFound.*`~~ | `fundraisers.json` | ✅ Added — `title`, `description`, `browseCta`, `homeCta` |
| ~~`Fundraisers.form.contributionSettings.preview.*`~~ | `fundraisers.json` | ✅ Added — `title`, `description`, `frequencyLabel` |
| ~~`Fundraisers.create.formSubmission.errorDescription`~~ | `fundraisers.json` | ✅ Added (new key, not in original plan) |
| ~~`Fundraisers.edit.formSubmission.errorDescription`~~ | `fundraisers.json` | ✅ Added (new key, not in original plan) |

### 3.7 Notes — Currency call sites on this page

These call sites omit `locale` and will be cleaned up by utility commit U1 ([§11.1](#111-formatcurrency--make-locale-mandatory--useformatcurrency-hook)). Listed here so reviewers know which files are touched by both this page commit and the utility commit:

- [donation-form.tsx:108](../src/components/fundraisers/donation-form.tsx)
- [donation-amounts.tsx:72](../src/components/fundraisers/donation-amounts.tsx)
- ~~[contribution-settings.tsx:20](../src/components/fundraisers/contribution-settings.tsx)~~ ✅ Already passing `locale` (fixed in §3.2 commit)
- [leaderboard/donation-table.tsx:79](../src/components/fundraisers/leaderboard/donation-table.tsx#L79)
- [leaderboard/donation-item.tsx:65](../src/components/fundraisers/leaderboard/donation-item.tsx#L65)
- [goal-progress-display.tsx:25,41](../src/components/fundraisers/goal-progress-display.tsx)

---

## 4. Page: Donate Overlay ✅ Resolved (2026-05-22)

Components under `src/components/donate/*`. Sections 4.1–4.7 landed in a single commit; section 4.8 (currency call sites) remains scope for utility commit U1.

### 4.1 Overlay Layout — Aria labels ✅ Resolved (2026-05-22)

`donate-overlay-layout.tsx` now reads both aria labels from `Donate.overlay.aria.{label, close}` via `useTranslations('Donate')`.

### 4.2 Stripe SEPA Form — Validation errors & placeholder ✅ Resolved (2026-05-22)

All 6 hardcoded strings in `stripe-sepa-form.tsx` (5 error fallbacks + the `'Jane Doe'` placeholder) now read from `Donate.sepa.errors.*` and `Donate.sepa.accountHolderNamePlaceholder`. German placeholder uses `'Erika Mustermann'`.

### 4.3 Stripe Card Form — Error fallbacks ✅ Resolved (2026-05-22)

Card form errors now read from `Donate.card.errors.{validationFailed, stripeNotInitialized, cardElementNotFound, paymentMethodFailed, cardActionFailed, paymentIntentNotReturned}`. The wider error set (beyond the 2 in the original review) was added while at the file.

### 4.4 Address Form — Raw error in UI ✅ Resolved (2026-05-22)

User-facing `saveAddressError` now always uses the translated `Donate.userAddress.saveAddressError` string (key already existed). Raw error is logged via `console.error` for diagnostics — same pattern as [§3.3](#33-create--update-fundraiser-buttons--raw-error-in-toast-description).

### 4.5 Donation Summary — Hardcoded `' and '` joiner ✅ Resolved (2026-05-22)

Replaced `' and '` join with inline `Intl.ListFormat(locale, { style: 'long', type: 'conjunction' })` (matching the existing pattern in [`fundraiser-list-item.tsx:38`](../src/components/dashboard/fundraiser-list-item.tsx#L38)). Threaded `useLocale()` into the component. When utility commit U3 ([§11.3](#113-joinnames-helper-via-intllistformat)) extracts the shared `joinNames` helper, both call sites become a one-line swap.

### 4.6 Donation Method Icons — Aria labels ✅ Resolved (2026-05-22)

These icons are only rendered inside `<PaymentMethodOption>` next to a visible text label (`<span>{methodLabel}</span>`), so any `aria-label` on the icon would double-announce ("Apple Pay, Apple Pay"). Fix: marked all six icons (`ApplePayIcon`, `BankIcon`, `CreditCard`, `GooglePayIcon`, `PaypalIcon`, `SepaIcon`) as decorative (`aria-hidden='true'`) and dropped their `role='img'` + `aria-label`. The visible button text — already translated via `Fundraisers.donate.paymentMethods.methods.*` — is what screen readers announce. Also resolves the inconsistency in `BankIcon` where `aria-hidden='true'` and `aria-label='Bank Transfer'` both existed (aria-hidden won; the label was dead code).

### 4.7 Missing Keys ✅ Added (2026-05-22)

| Key | File | Status |
|---|---|---|
| ~~`Donate.overlay.aria.{label, close}`~~ | `donate.json` | ✅ Added in §4.1 |
| ~~`Donate.sepa.{accountHolderNamePlaceholder, errors.*}`~~ | `donate.json` | ✅ Added in §4.2 |
| ~~`Donate.card.errors.{paymentMethodFailed, cardActionFailed}`~~ | `donate.json` | ✅ Added in §4.3 |

### 4.8 Notes — Currency call sites on this page

Cleaned up by utility commit U1:

- [donate-options.tsx:74](../src/components/donate/donate-options.tsx#L74)
- [donation-summary.tsx:139,154,163](../src/components/donate/donation-summary.tsx#L139)
- [payment-methods.tsx:332,355,406](../src/components/donate/payment-methods.tsx#L332) ⚠️ explicitly passes `undefined`
- [donation-thank-you.tsx:30,38](../src/components/donate/donation-thank-you.tsx)

---

## 5. Page: Explore ✅ Resolved (2026-05-22)

Components under `src/components/explore/*`. Sections 5.1–5.3 landed in a single commit; section 5.4 (currency call site) remains scope for utility commit U1.

### 5.1 Location Category Map — Placeholder copy ✅ Resolved (2026-05-22)

Converted to async server component using `getTranslations`; both lines now read from `Explore.locationMap.{title, comingSoon}`. Component is currently commented out in `category-page-loader.tsx` but the placeholder copy was still translated per "every user-facing string must be localized."

### 5.2 Category Page Skeleton — Loading aria ✅ Resolved (2026-05-22)

`aria-label` now reads from `Explore.categoryPage.loadingAria` via the sync `useTranslations` hook (next-intl v4 runs it in server components). Kept the component sync because it's used as a `<Suspense fallback>`, where async server components are unsafe. Picked a namespace-scoped key over `Common.aria.loading` (which doesn't exist yet) to keep this commit's scope tight.

### 5.3 Missing Keys ✅ Added (2026-05-22)

| Key | File | Status |
|---|---|---|
| ~~`Explore.locationMap.{title, comingSoon}`~~ | `explore.json` | ✅ Added |
| ~~`Explore.categoryPage.loadingAria`~~ | `explore.json` | ✅ Added |

### 5.4 Notes — Currency call site on this page

Cleaned up by utility commit U1:

- [fundraiser-card.tsx:72](../src/components/explore/fundraiser-card.tsx#L72)

---

## 6. Page: Dashboard ✅ Resolved (2026-05-22)

Components under `src/components/dashboard/*`. Sections 6.1–6.2 landed in a single commit; section 6.3 (currency call sites) remains scope for utility commit U1.

### 6.1 Dashboard Summary — Plural-sensitive formatting via pre-stringified count ✅ Resolved (2026-05-22)

Replaced the JS-side `> 0` branch + string-concat (`<span>{n.toLocaleString()}</span> <suffix>`) with a single ICU rich-text plural: `Dashboard.summary.fundraisers.activeStatus` uses `{count, plural, =0 {…} other {<bold>{count, number}</bold> …}}`. `dashboard-summary.tsx` now calls `t.rich('fundraisers.activeStatus', { count, bold: chunks => <span class='…'>{chunks}</span> })` — same pattern as the existing `resultCount`. Dropped now-unused `activeSuffix` and `noActive` keys (net key count unchanged: +1 activeStatus, +1 searchAria, −2 obsolete).

### 6.2 Fundraiser Search Input — One key for two attributes ✅ Resolved (2026-05-22)

Added `Dashboard.toolbar.searchAria` (EN: "Search fundraisers by name or host", DE: "Spendenaufrufe nach Name oder Ersteller suchen") and wired it into the input's `aria-label`. Placeholder still uses the shorter `searchPlaceholder`.

### 6.3 Notes — Currency call sites on this page

Cleaned up by utility commit U1:

- [fundraiser-list-item.tsx:43-50](../src/components/dashboard/fundraiser-list-item.tsx#L43-L50)

Already-correct call sites (kept for reference):

- ✅ [dashboard-summary.tsx:50](../src/components/dashboard/dashboard-summary.tsx#L50)

---

## 7. Page: Stage ✅ Resolved (2026-05-22)

Components under `src/components/stage/*`. Section 7.1 landed in a single commit; section 7.3 (`formatTimeAgo` on the stage ticker) remains scope for utility commit U2.

### 7.1 Stage Top Bar — Image alt text ✅ Resolved (2026-05-22)

Both `<img alt>` attributes now read from `Stage.topBar.{brandAlt, partnerAlt}`. EN uses `"Plant-for-the-Planet logo"` / `"Partner logo"` (added `logo` to give screen readers context, not just the brand string); DE uses `"Plant-for-the-Planet-Logo"` / `"Partnerlogo"`.

### 7.2 Missing Keys ✅ Added (2026-05-22)

| Key | File | Status |
|---|---|---|
| ~~`Stage.topBar.{brandAlt, partnerAlt}`~~ | `stage.json` | ✅ Added |

### 7.3 Notes — `formatTimeAgo` on the public stage ticker

The Stage Ticker uses the English-only `formatTimeAgo` and is **public-facing** — German users see `5m ago`, `2h ago`, `3d ago`.

- [stage-ticker.tsx:180](../src/components/stage/stage-ticker.tsx#L180)

Cleaned up by utility commit U2 ([§11.2](#112-formattimeago--intlrelativetimeformat--useformattimeago-hook)).

Already-correct currency call site (kept for reference):

- ✅ [stage-counter.tsx:58](../src/components/stage/stage-counter.tsx#L58)

---

## 8. Page: Auth & User Menu (mostly resolved)

Components under `src/components/auth/*`.

### 8.1 Impersonation Modal ✅ Resolved (2026-05-21)

Migrated end-to-end to `Auth.impersonation.*` (modal copy + 8 validation messages). See commit `7496821`.

**File:** [src/components/auth/impersonation-modal.tsx:44-141](../src/components/auth/impersonation-modal.tsx#L44-L141)

### 8.2 User Menu ✅ Resolved (2026-05-21)

**File:** [src/components/auth/user-menu.tsx](../src/components/auth/user-menu.tsx)

- `alt='Profile'` → reduced to `alt=''` (decorative; `FallbackAvatar` provides identity).
- `displayName || 'User'` → `tAuth('impersonation.userDefault')`.
- `'Switch impersonation' / 'Impersonate user'` → `tAuth('impersonation.switch')` / `tAuth('impersonation.title')`.
- Button `aria-label` → `tAuth('userMenuLabel')`.

Keys live under `Auth.impersonation.*` and `Auth.userMenuLabel`, not a new `Auth.userMenu` namespace.

### 8.3 Impersonation Banner ✅ Resolved (2026-05-21)

Banner message and stop button localized: `Auth.impersonation.bannerMessage`, `Auth.impersonation.stop`.

### 8.4 Impersonation Validation Errors ✅ Resolved (2026-05-21)

All `setError` paths route through `tAuth('impersonation.errors.*')`.

---

## 9. Shared Chrome (Header, Footer, Dialog, Tooltip) ✅ Resolved (2026-05-22)

Primitives & layout components used across many pages. One commit covers all of these.

### 9.1 Shared Dialog Primitive — Close text ✅ Resolved (2026-05-22)

Both the `sr-only` "Close" in `DialogContent` and the visible "Close" button in `DialogFooter` now read from `Common.actions.close` via `useTranslations`. Reaches every dialog in the app in one change.

### 9.2 Info Tooltip — English fallback ✅ Resolved (2026-05-22)

Default fallback for `triggerLabel` now reads from `Common.aria.moreInformation`. Callers can still pass an explicit `triggerLabel` to override.

### 9.3 Footer & Header — Navigation aria labels ✅ Resolved (2026-05-22)

- `footer/links-bar.tsx`: `aria-label` reads from `Common.aria.legalLinks`.
- `header/navigation.tsx`: `aria-label` reads from `Common.aria.primaryNavigation`.
- `header/logo.tsx`: `aria-label` reads from `Common.brand.name`.

### 9.4 Footer Logos — Image alt text ✅ Resolved (2026-05-22)

Both `<img alt>` attributes now read from `Common.partners.{plantForThePlanetAlt, unepAlt}`. EN/DE values include the word "logo" / "Logo" for screen-reader context. EN was upgraded from `'UN Environment Program'` to `'UN Environment Programme logo'` (correct UNEP spelling).

### 9.5 Image Selection Utility — English diagnostic messages ✅ Resolved (2026-05-22)

Dropped the unused `message` field from `ImageUploadError`. The UI was already reading `error.code` and looking up the translation via `Fundraisers.*.errors.{emptyFile, fileTooLarge, invalidFileType}` in `image-selection-overlay.tsx` — the literal English `message` was dead code.

### 9.6 Missing Keys ✅ Added (2026-05-22)

| Key | File | Status |
|---|---|---|
| ~~`Common.actions.close`~~ | `common.json` | ✅ Added |
| ~~`Common.aria.{primaryNavigation, legalLinks, moreInformation}`~~ | `common.json` | ✅ Added |
| ~~`Common.partners.{plantForThePlanetAlt, unepAlt}`~~ | `common.json` | ✅ Added |
| ~~`Common.brand.name`~~ | `common.json` | ✅ Added |
| `Common.aria.loading` | `common.json` | Deferred — no current consumer (§5.2 used a scoped key) |

---

## 10. App-Level (Root layout, Home, Sentry test) ✅ Resolved (2026-05-22)

App-shell concerns — one commit.

### 10.1 Root Layout Metadata ✅ Resolved (2026-05-22)

`generateMetadata` now uses `getTranslations('Common.metadata')`; title and description read from `Common.metadata.{title, description}` (EN: `"Fundraisers"` / `"Fundraising platform"`, DE: `"Spendenaufrufe"` / `"Spendenplattform"`).

### 10.2 Home Page Scaffold ✅ Resolved (2026-05-22)

Set `alt=''` on the Next.js scaffold logo to mark it decorative — no English alt string ships. The wider question of removing or replacing the scaffold page is a product decision left for a follow-up; this commit only addresses the i18n leak.

### 10.3 Sentry Test Page — Entire page hardcoded ✅ Resolved (2026-05-22)

Gated behind `NODE_ENV !== 'production'` rather than localizing. The page is a dev/QA tool — production users shouldn't reach it at all. Split into `page.tsx` (server component that calls `notFound()` in production) and `sentry-test-client.tsx` (the interactive client component) to keep the env check on the server side and avoid violating React's rules-of-hooks. The dev/QA strings stay English by design — they're for engineers.

### 10.4 Missing Keys ✅ Added (2026-05-22)

| Key | File | Status |
|---|---|---|
| ~~`Common.metadata.{title, description}`~~ | `common.json` | ✅ Added |

---

## 11. Cross-Cutting Utilities (separate commits)

Each subsection is its own commit. Landing these first lets per-page commits (§3–§10) be smaller and more focused.

### 11.1 `formatCurrency` — Make `locale` mandatory + `useFormatCurrency` hook

**File:** [src/lib/utils/currency.ts:47,96](../src/lib/utils/currency.ts#L47)

```ts
export function formatCurrency(amountInCents, currency, locale: string = 'en-US')
export function formatCurrencyFromDecimal(amount, currency, locale: string = 'en-US', currencyDisplay)
```

**Why:** Many callers omit the locale argument, producing US grouping/decimal separators inside a German UI (e.g. `€12,345.67` instead of `12.345,67 €`). **This is the single biggest source of subtle bugs for German users.**

**Affected call sites omitting locale:**

| File | Line | Page |
|---|---|---|
| [donate/donate-options.tsx](../src/components/donate/donate-options.tsx#L74) | 74 | Donate |
| [fundraisers/donation-form.tsx](../src/components/fundraisers/donation-form.tsx) | 108 | Fundraiser |
| [fundraisers/donation-amounts.tsx](../src/components/fundraisers/donation-amounts.tsx) | 72 | Fundraiser |
| [fundraisers/contribution-settings.tsx](../src/components/fundraisers/contribution-settings.tsx) | 20 | Fundraiser |
| [fundraisers/leaderboard/donation-table.tsx](../src/components/fundraisers/leaderboard/donation-table.tsx#L79) | 79 | Fundraiser |
| [fundraisers/leaderboard/donation-item.tsx](../src/components/fundraisers/leaderboard/donation-item.tsx#L65) | 65 | Fundraiser |
| [fundraisers/goal-progress-display.tsx](../src/components/fundraisers/goal-progress-display.tsx) | 25, 41 | Fundraiser |
| [donate/donation-summary.tsx](../src/components/donate/donation-summary.tsx#L139) | 139, 154, 163 | Donate |
| [donate/payment-methods.tsx](../src/components/donate/payment-methods.tsx#L332) | 332, 355, 406 ⚠️ explicitly passes `undefined` | Donate |
| [donate/donation-thank-you.tsx](../src/components/donate/donation-thank-you.tsx) | 30, 38 | Donate |
| [explore/fundraiser-card.tsx](../src/components/explore/fundraiser-card.tsx#L72) | 72 | Explore |
| [dashboard/fundraiser-list-item.tsx](../src/components/dashboard/fundraiser-list-item.tsx#L43-L50) | 43-50 | Dashboard |

**Fix:**

1. Make `locale` **required** (no default).
2. Add a `useFormatCurrency()` hook that binds locale once:

   ```ts
   export function useFormatCurrency() {
     const locale = useLocale();
     return useCallback(
       (cents: number, currency: string) => formatCurrency(cents, currency, locale),
       [locale]
     );
   }
   ```

3. Migrate all call sites to the hook.

Already-correct call sites (kept for reference):

- ✅ [stage-counter.tsx:58](../src/components/stage/stage-counter.tsx#L58)
- ✅ [dashboard-summary.tsx:50](../src/components/dashboard/dashboard-summary.tsx#L50)

### 11.2 `formatTimeAgo` — `Intl.RelativeTimeFormat` + `useFormatTimeAgo` hook

**File:** [src/lib/utils/time.ts](../src/lib/utils/time.ts)

```ts
export function formatTimeAgo(timestamp: string | Date): string {
  if (diffInSeconds < 60) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  // ...
}
```

**Used in:**

- [donation-table.tsx:71](../src/components/fundraisers/leaderboard/donation-table.tsx#L71)
- [donation-item.tsx:67](../src/components/fundraisers/leaderboard/donation-item.tsx#L67)
- [stage-ticker.tsx:180](../src/components/stage/stage-ticker.tsx#L180) — public-facing!

**Why:** German users see `5m ago`, `2h ago`, `3d ago` on the public fundraiser/stage pages.

**Fix:**

```ts
export function formatTimeAgo(ts: string | Date, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  // pick best unit based on diff
  return rtf.format(-diff, unit);
}
```

Or expose as `useFormatTimeAgo()` hook.

### 11.3 `joinNames` helper via `Intl.ListFormat`

Standardize on `Intl.ListFormat(locale, { type: 'conjunction' })` via a `joinNames(names, locale)` helper. Fixes [donation-summary.tsx:69](../src/components/donate/donation-summary.tsx#L69) and any other ad-hoc joins. The pattern already exists in [`fundraiser-list-item.tsx:38`](../src/components/dashboard/fundraiser-list-item.tsx#L38) — extract and share.

### 11.4 Error-code → translation pattern for services

API client services currently propagate English strings via `PlatformAPIError`:

- [donation-service.ts:13,82](../src/lib/api/donation-service.ts)
- [payment-service.ts](../src/lib/api/payment-service.ts)
- [paypal-order-service.ts:8](../src/lib/api/paypal-order-service.ts)
- [unsplash-service.ts:16](../src/lib/api/unsplash-service.ts)

**Pattern:** Services should throw typed **error codes**; UI calls `t(code)`. The pattern in [`donation-failure-banner.tsx`](../src/components/donate/donation-failure-banner.tsx) (`SubmissionErrorKey` + `Donate.submissionErrors`) is the correct shape — generalize across features.

Apply to: fundraiser create/update, address save, impersonation (done), SEPA/card validation.

### 11.5 (Optional) Consolidate formatting helpers

`getLocalizedAbbreviatedCount` already lives in `src/lib/utils/formatting.ts`. Move `formatCurrency*`, `formatTimeAgo`, and the new `joinNames` into the same module — all accepting `locale`. Provide `useFormatters()` returning `{ currency, timeAgo, list, number }` to standardize component-level usage.

### 11.6 (Optional) Aria labels for shared primitives

Add a `Common.aria` namespace. Refactor `Dialog`, `InfoTooltip`, and the donation `*Icon.tsx` files to accept a `label` prop defaulting to translations at the consumer. (Some of this is also covered by §9 and §4.6.)

---

## 12. SSR / Client Locale Mismatch Risks

### 12.1 Cookie-based locale + no URL prefix

- [`request.ts`](../src/i18n/request.ts) reads `ui-locale` cookie.
- Routing is `localePrefix: 'never'` — the URL is identical across locales.
- **Risk:** Caches and CDNs **must vary on the `ui-locale` cookie** or users will see a snapshot in the wrong language.
- **Action:** Verify Vercel/Next caching does not strip cookies on cached routes.

### 12.2 `toLocaleString()` without args ✅ Resolved (2026-05-21)

Both call sites in [donors-preview.tsx](../src/components/fundraisers/donors-preview.tsx) and [fundraiser-view.tsx](../src/components/fundraisers/fundraiser-view.tsx) now pass `useLocale()` to `toLocaleString(locale)`. Fixed as part of [§3.5](#35-tolocalestring-without-locale-also-ssr-risk--see-122).

### 12.3 `formatTimeAgo`

- Time-sensitive AND locale-agnostic.
- Server timestamp diff differs from client; combined with English-only output, this is a double SSR risk.
- **Fix:** Resolved by utility commit U2 ([§11.2](#112-formattimeago--intlrelativetimeformat--useformattimeago-hook)).

---

## 13. Orphan Keys & CI Guardrails

### 13.1 `cookie.json` is not loaded by next-intl

- [`src/i18n/request.ts`](../src/i18n/request.ts) does **not** import `cookie.json`.
- [`src/i18n/types.ts`](../src/i18n/types.ts) does not include it in the `Messages` type.
- It is consumed via direct static import in [`cookie-consent-config.ts`](../src/lib/constants/cookie-consent-config.ts).

**Implication:** `t('consentModal.title')` via `useTranslations` will **not** work for any `cookie.json` key.

**Fix:** Either (a) load it in `request.ts` and add to `types.ts`, or (b) document explicitly that it's a separate dictionary for `vanilla-cookieconsent`.

### 13.2 No automated key audit

No tooling currently detects orphan keys, and no build-time check guarantees EN/DE key parity (currently true but unguarded).

**Recommendation:** Add a CI step using `i18next-scanner`, `lint-i18n-json`, or a small Node script that:

1. Flattens both `en/` and `de/` JSON trees and asserts key-set equality.
2. Diffs flattened JSON keys against `t('...')` usages in source.

---

## 14. Appendix: Locale Setup Reference

**Loader:** [src/i18n/request.ts](../src/i18n/request.ts)

```ts
const cookieLocale = cookieStore.get('ui-locale')?.value;
const locale = hasLocale(routing.locales, cookieLocale) ? cookieLocale : routing.defaultLocale;

return {
  locale,
  messages: {
    ...common, ...explore, ...fundraisers, ...bundles, ...auth,
    ...dashboard, ...donate, ...stage, ...leaderboard,
    // ⚠️ cookie.json is NOT loaded here
  },
};
```

**Routing:** [src/i18n/routing.ts](../src/i18n/routing.ts)

```ts
export const routing = defineRouting({
  locales: ['en', 'de'],
  defaultLocale: 'de',
  localePrefix: 'never',
  localeDetection: false,
});
```

**Type safety:** [src/i18n/types.ts](../src/i18n/types.ts) — declares `AppConfig.Messages` from union of all loaded namespaces. ⚠️ `cookie.json` is missing here too.
