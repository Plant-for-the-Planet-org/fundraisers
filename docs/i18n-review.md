# i18n / Localization Review — Fundraisers App

> **Review date:** 2026-05-21
> **Last updated:** 2026-05-21 — restructured to group issues by page for one-commit-per-page execution. Impersonation modal, banner, and user-menu strings already localized (commit `7496821`).
> **Scope:** Full codebase audit of internationalization (i18n) coverage, locale-aware formatting, and accessibility text localization.
> **Stack:** `next-intl` + cookie-based locale (`ui-locale`), locales `en` and `de` (default `de`), `localePrefix: 'never'`.

---

## Recently Resolved

- ✅ **Impersonation Modal** — all labels, placeholders, buttons, and 8 validation messages migrated to `Auth.impersonation.*`.
- ✅ **User Menu** — `userMenuLabel`, `'User'` fallback, and impersonate/switch labels translated; avatar `alt` reduced to decorative empty string.
- ✅ **Impersonation Banner** — banner message and stop button localized (`Auth.impersonation.bannerMessage`, `Auth.impersonation.stop`).
- ✅ **Impersonation validation errors** — all `setError` paths now route through translated keys under `Auth.impersonation.errors`.
- ✅ **User fallback** — `displayName || 'User'` now uses `Auth.impersonation.userDefault`.

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
common.json       en: 9     de: 9     ✅
cookie.json       en: 23    de: 23    ✅
dashboard.json    en: 61    de: 61    ✅
donate.json       en: 152   de: 152   ✅
explore.json      en: 26    de: 26    ✅
fundraisers.json  en: 209   de: 209   ✅
leaderboard.json  en: 29    de: 29    ✅
stage.json        en: 16    de: 16    ✅
```

---

## 2. Execution Plan — One Commit Per Page

Each row below is intended to land as a single commit. Pages are independent; utilities at the bottom can ripple through pages and should land first if you want page-level changes to absorb their benefits cleanly.

| # | Commit | Scope | Section |
|---|---|---|---|
| 1 | `fix(i18n): localize fundraiser detail page` | not-found, contribution-settings preview alert, create/update toast descriptions, edit hook error, donor-preview `toLocaleString` | [§3](#3-page-fundraiser-detail-raiseslug) |
| 2 | `fix(i18n): localize donate overlay` | overlay aria labels, stripe SEPA/card form errors+placeholder, address-form error, donation-summary host joiner, payment-method icon aria | [§4](#4-page-donate-overlay) |
| 3 | `fix(i18n): localize explore page` | location-category-map placeholder, category-page-skeleton aria | [§5](#5-page-explore) |
| 4 | `fix(i18n): tidy dashboard pluralization & search aria` | dashboard-summary plural form, fundraiser-search-input distinct aria | [§6](#6-page-dashboard) |
| 5 | `fix(i18n): localize stage page` | stage-top-bar brand/partner alt text | [§7](#7-page-stage) |
| 6 | `fix(i18n): localize shared chrome` | dialog Close, info-tooltip fallback, header/footer aria labels, footer logo alt | [§9](#9-shared-chrome-header-footer-dialog-tooltip) |
| 7 | `fix(i18n): localize app-level pages & metadata` | root layout metadata, home scaffold alt, sentry-test gating | [§10](#10-app-level-root-layout-home-sentry-test) |
| U1 | `refactor(i18n): require locale in formatCurrency*` | utility change + migrate all call sites (or via `useFormatCurrency` hook) | [§11.1](#111-formatcurrency--make-locale-mandatory--useformatcurrency-hook) |
| U2 | `refactor(i18n): rewrite formatTimeAgo with Intl.RelativeTimeFormat` | utility change + migrate 3 call sites | [§11.2](#112-formattimeago--intlrelativetimeformat--useformattimeago-hook) |
| U3 | `refactor(i18n): add joinNames helper using Intl.ListFormat` | extract helper + replace `' and '` join | [§11.3](#113-joinnames-helper-via-intllistformat) |
| U4 | `refactor(i18n): error-code → translation pattern for services` | generalize `donation-failure-banner` pattern across services | [§11.4](#114-error-code--translation-pattern-for-services) |
| Z1 | `chore(i18n): load cookie.json or document separate dictionary` | request.ts + types.ts | [§13.1](#131-cookiejson-is-not-loaded-by-next-intl) |
| Z2 | `ci(i18n): add EN/DE key-parity guardrail` | script + CI step | [§13.2](#132-no-automated-key-audit) |

**Recommended order:** utilities (U1–U4) first if you want page commits to be free of mixed concerns; otherwise pages 1–7 first, utilities after.

---

## 3. Page: Fundraiser Detail (`/raise/[slug]`)

Components under `src/components/fundraisers/*` plus the route's own files.

### 3.1 Not-Found Page — entire component hardcoded

**File:** [src/app/(fundraiser)/raise/[slug]/not-found.tsx:8-19](../src/app/(fundraiser)/raise/[slug]/not-found.tsx#L8-L19)

**Hardcoded:** `'404'`, `'Fundraiser Not Found'`, `"The fundraiser you're looking for doesn't exist or may have been removed."`, `'Browse Fundraisers'`, `'Go Home'`

**Why:** The sibling [`error.tsx`](../src/app/(fundraiser)/raise/[slug]/error.tsx) already uses `Fundraisers.error.*` — the not-found page is inconsistent.

**Fix:** Add `Fundraisers.notFound.{title, description, browseCta, homeCta}`.

### 3.2 Contribution Settings — Native `alert()`

**File:** [src/components/fundraisers/contribution-settings.tsx:18-22](../src/components/fundraisers/contribution-settings.tsx#L18-L22)

```ts
alert(
  `Preview Mode\nWould donate ${formatCurrency(amount, currency)} ${frequency}${isDedicated ? ' (dedicated)' : ''}`
);
```

**Why:** Native `alert()` is poor UX and the strings are English-only.

**Fix:** Replace with a translated toast/dialog using `Fundraisers.form.contributionSettings.preview.{previewMode, previewDonation, dedicated}`.

### 3.3 Create / Update Fundraiser Buttons — Raw error in toast description

**Files:**

- [src/components/fundraisers/create-fundraiser-button.tsx:56](../src/components/fundraisers/create-fundraiser-button.tsx#L56)
- [src/components/fundraisers/update-fundraiser-button.tsx:80](../src/components/fundraisers/update-fundraiser-button.tsx#L80)

```ts
const message = err instanceof Error ? err.message : 'Failed to create fundraiser';
toast.error(t('errorMessage'), { description: message });
```

**Why:** Toast title is translated, but description leaks raw English from `err.message` or the English fallback.

**Fix:** Drop raw `err.message` from the description, or map known error codes to translated messages (see [§11.4](#114-error-code--translation-pattern-for-services)).

### 3.4 Edit Hook — Raw API error surface

**File:** [src/components/fundraisers/use-fundraiser-for-edit.ts:92](../src/components/fundraisers/use-fundraiser-for-edit.ts#L92)

```ts
const message = error instanceof Error ? error.message : t('loadError');
```

**Why:** Truthy branch shows raw English API messages.

**Fix:** Prefer `t('loadError')`; log `error.message` to console only.

### 3.5 `toLocaleString()` Without Locale (also SSR risk — see §12.2)

**Files:**

- [src/components/fundraisers/donors-preview.tsx:23](../src/components/fundraisers/donors-preview.tsx#L23)
- [src/components/fundraisers/fundraiser-view.tsx:79](../src/components/fundraisers/fundraiser-view.tsx#L79)

```ts
recent.length.toLocaleString()    // ❌ Uses runtime default
```

**Fix:** `recent.length.toLocaleString(locale)` from `useLocale()`.

### 3.6 Missing Keys

| Key | File | Purpose |
|---|---|---|
| `Fundraisers.notFound.*` | `fundraisers.json` | Not-found page |
| `Fundraisers.form.contributionSettings.preview.*` | `fundraisers.json` | Preview alert |

### 3.7 Notes — Currency call sites on this page

These call sites omit `locale` and will be cleaned up by utility commit U1 ([§11.1](#111-formatcurrency--make-locale-mandatory--useformatcurrency-hook)). Listed here so reviewers know which files are touched by both this page commit and the utility commit:

- [donation-form.tsx:108](../src/components/fundraisers/donation-form.tsx)
- [donation-amounts.tsx:72](../src/components/fundraisers/donation-amounts.tsx)
- [contribution-settings.tsx:20](../src/components/fundraisers/contribution-settings.tsx)
- [leaderboard/donation-table.tsx:79](../src/components/fundraisers/leaderboard/donation-table.tsx#L79)
- [leaderboard/donation-item.tsx:65](../src/components/fundraisers/leaderboard/donation-item.tsx#L65)
- [goal-progress-display.tsx:25,41](../src/components/fundraisers/goal-progress-display.tsx)

---

## 4. Page: Donate Overlay

Components under `src/components/donate/*`.

### 4.1 Overlay Layout — Aria labels

**File:** [src/components/donate/donate-overlay-layout.tsx:19,25](../src/components/donate/donate-overlay-layout.tsx#L19-L25)

```tsx
aria-label='donation details'
aria-label='Close donation overlay'
```

**Fix:** `tDonate('overlay.aria.label')`, `tDonate('overlay.aria.close')`.

### 4.2 Stripe SEPA Form — Validation errors & placeholder

**File:** [src/components/donate/stripe-sepa-form.tsx](../src/components/donate/stripe-sepa-form.tsx)

| Line | Hardcoded |
|---|---|
| 72 | `return { error: 'Validation failed' }` |
| 74 | `return { error: 'Stripe not initialized' }` |
| 76 | `return { error: 'IBAN element not found' }` |
| 96 | `error.message ?? 'Payment method creation failed'` |
| 101 | `return { error: 'Stripe not initialized' }` |
| 133 | `placeholder='Jane Doe'` |

**Fix:** `Donate.sepa.errors.*` and `Donate.sepa.accountHolderNamePlaceholder`.

### 4.3 Stripe Card Form — Error fallbacks

**File:** [src/components/donate/stripe-card-form.tsx:164,172](../src/components/donate/stripe-card-form.tsx#L164-L172)

```ts
return { error: error.message ?? 'Payment method creation failed' };
if (error) return { error: error.message ?? 'Card action failed' };
```

**Fix:** `Donate.card.errors.{paymentMethodFailed, cardActionFailed}`.

### 4.4 Address Form — Raw error in UI

**File:** [src/components/donate/address-form.tsx:75-77](../src/components/donate/address-form.tsx#L75-L77)

Surfaces raw `err.message` — same pattern as [§3.3](#33-create--update-fundraiser-buttons--raw-error-in-toast-description).

### 4.5 Donation Summary — Hardcoded `' and '` joiner

**File:** [src/components/donate/donation-summary.tsx:69](../src/components/donate/donation-summary.tsx#L69)

```ts
const joinedNames = publicHosts.map(h => h.displayName).filter(Boolean).join(' and ');
```

**Why:** `' and '` is English-only; German expects `' und '`. Locale-aware joining already exists in [`fundraiser-list-item.tsx:38`](../src/components/dashboard/fundraiser-list-item.tsx#L38) using `Intl.ListFormat`.

**Fix:** Use the shared `joinNames(names, locale)` helper from utility commit U3 ([§11.3](#113-joinnames-helper-via-intllistformat)). If U3 lands first, this is a one-line swap.

### 4.6 Donation Method Icons — Aria labels

**Files:**

- [ApplePayIcon.tsx:15](../src/components/icons/donation/ApplePayIcon.tsx#L15) → `'Apple Pay'`
- [BankIcon.tsx:15](../src/components/icons/donation/BankIcon.tsx#L15) → `'Bank Transfer'` ⚠️
- [CreditCard.tsx:11](../src/components/icons/donation/CreditCard.tsx#L11) → `'Credit Card'` ⚠️
- [GooglePayIcon.tsx:15](../src/components/icons/donation/GooglePayIcon.tsx#L15) → `'Google Pay'`
- [PaypalIcon.tsx:11](../src/components/icons/donation/PaypalIcon.tsx#L11) → `'PayPal'`
- [SepaIcon.tsx:11](../src/components/icons/donation/SepaIcon.tsx#L11) → `'SEPA Direct Debit'` ⚠️

**Why:** Brand names (PayPal, Apple Pay, Google Pay) can stay; "Bank Transfer", "Credit Card", "SEPA Direct Debit" must be translated.

**Fix:** Accept `aria-label` as a prop — parent [`payment-methods.tsx`](../src/components/donate/payment-methods.tsx) already translates method names; pass them down.

### 4.7 Missing Keys

| Key | File |
|---|---|
| `Donate.overlay.aria.{label, close}` | `donate.json` |
| `Donate.sepa.{accountHolderNamePlaceholder, errors.*}` | `donate.json` |
| `Donate.card.errors.{paymentMethodFailed, cardActionFailed}` | `donate.json` |

### 4.8 Notes — Currency call sites on this page

Cleaned up by utility commit U1:

- [donate-options.tsx:74](../src/components/donate/donate-options.tsx#L74)
- [donation-summary.tsx:139,154,163](../src/components/donate/donation-summary.tsx#L139)
- [payment-methods.tsx:332,355,406](../src/components/donate/payment-methods.tsx#L332) ⚠️ explicitly passes `undefined`
- [donation-thank-you.tsx:30,38](../src/components/donate/donation-thank-you.tsx)

---

## 5. Page: Explore

Components under `src/components/explore/*`.

### 5.1 Location Category Map — Placeholder copy

**File:** [src/components/explore/location-category-map.tsx:7-8](../src/components/explore/location-category-map.tsx#L7-L8)

```tsx
<p className='text-lg font-medium mb-2'>Map View</p>
<p className='text-sm'>Interactive map coming soon</p>
```

**Fix:** `Explore.locationMap.{title, comingSoon}` — even temporary copy must be translated.

### 5.2 Category Page Skeleton — Loading aria

**File:** [src/components/explore/category-page-skeleton.tsx:6](../src/components/explore/category-page-skeleton.tsx#L6)

```tsx
<div className='category-page-skeleton' role='status' aria-label='Loading'>
```

**Why:** Sibling skeletons use `t('loading')` (Dashboard.list.item.loading, Dashboard.summary.loading) — this one is inconsistent.

**Fix:** `Explore.categoryPage.loadingAria` or reuse `Common.aria.loading`.

### 5.3 Missing Keys

| Key | File |
|---|---|
| `Explore.locationMap.{title, comingSoon}` | `explore.json` |
| `Explore.categoryPage.loadingAria` | `explore.json` |

### 5.4 Notes — Currency call site on this page

Cleaned up by utility commit U1:

- [fundraiser-card.tsx:72](../src/components/explore/fundraiser-card.tsx#L72)

---

## 6. Page: Dashboard

Components under `src/components/dashboard/*`.

### 6.1 Dashboard Summary — Plural-sensitive formatting via pre-stringified count

`Dashboard.list.item.donations` correctly uses an ICU `count` param, but plural-sensitive count formatting in `dashboard-summary.tsx` interpolates a pre-`toLocaleString`-formatted string.

**Fix:** Audit all `formattedCount` usages and prefer ICU `{count, plural, ...}` so DE plural forms can diverge from EN when needed.

### 6.2 Fundraiser Search Input — One key for two attributes

**File:** [src/components/dashboard/fundraiser-search-input.tsx:52-53](../src/components/dashboard/fundraiser-search-input.tsx#L52-L53)

Reuses `searchPlaceholder` for both `placeholder` and `aria-label`. Functional, but consider a distinct `searchAria` key in case UX wants a more descriptive aria string.

### 6.3 Notes — Currency call sites on this page

Cleaned up by utility commit U1:

- [fundraiser-list-item.tsx:43-50](../src/components/dashboard/fundraiser-list-item.tsx#L43-L50)

Already-correct call sites (kept for reference):

- ✅ [dashboard-summary.tsx:50](../src/components/dashboard/dashboard-summary.tsx#L50)

---

## 7. Page: Stage

Components under `src/components/stage/*`.

### 7.1 Stage Top Bar — Image alt text

**File:** [src/components/stage/stage-top-bar.tsx:21,32](../src/components/stage/stage-top-bar.tsx#L21-L32)

```tsx
alt='Plant-for-the-Planet'
alt='Partner'
```

**Fix:** `Stage.topBar.{brandAlt, partnerAlt}`.

### 7.2 Missing Keys

| Key | File |
|---|---|
| `Stage.topBar.{brandAlt, partnerAlt}` | `stage.json` |

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

## 9. Shared Chrome (Header, Footer, Dialog, Tooltip)

Primitives & layout components used across many pages. One commit covers all of these.

### 9.1 Shared Dialog Primitive — Close text

**File:** [src/components/ui/dialog.tsx:75,113](../src/components/ui/dialog.tsx#L75-L113)

```tsx
<span className='sr-only'>Close</span>
<Button variant='outline'>Close</Button>
```

**Why:** Shared shadcn-style primitive used by many consumers; the screen-reader Close text reaches every dialog in the app.

**Fix:** Accept a `closeLabel` prop, or read from `Common.actions.close`.

### 9.2 Info Tooltip — English fallback

**File:** [src/components/ui/info-tooltip.tsx:48](../src/components/ui/info-tooltip.tsx#L48)

```tsx
<span className='sr-only'>{triggerLabel ?? 'More information'}</span>
```

**Why:** Ships English to users when callers omit the prop.

**Fix:** Either require `triggerLabel`, or default from `Common.aria.moreInformation`.

### 9.3 Footer & Header — Navigation aria labels

| File | Line | Hardcoded |
|---|---|---|
| [footer/links-bar.tsx](../src/components/footer/links-bar.tsx#L12) | 12 | `aria-label='Legal links'` |
| [header/navigation.tsx](../src/components/header/navigation.tsx#L11) | 11 | `aria-label='Primary navigation'` |
| [header/logo.tsx](../src/components/header/logo.tsx#L10) | 10 | `aria-label='Plant-for-the-Planet'` (brand — debatable) |

**Fix:** Centralize under `Common.aria.{legalLinks, primaryNavigation}`; `Common.brand.name` for the brand string (used in 3+ places).

### 9.4 Footer Logos — Image alt text

**File:** [src/components/footer/logos.tsx:13,25](../src/components/footer/logos.tsx#L13-L25)

```tsx
alt='Plant-for-the-Planet'
alt='UN Environment Program'
```

**Fix:** `Common.partners.{plantForThePlanetAlt, unepAlt}`.

### 9.5 Image Selection Utility — English diagnostic messages

**File:** [src/lib/utils/image-selection.ts:24-48](../src/lib/utils/image-selection.ts#L24-L48)

Strings: `'Selected file is empty.'`, `'Image must be ${MB}MB or smaller.'`, `'Please upload a JPG, PNG, WEBP, or GIF image.'`

The `error.code` is used in the UI ([image-selection-overlay:88-101](../src/components/fundraisers/image-selection-overlay.tsx#L88-L101)), but the literal `message` field is still set on the result object.

**Fix:** Either drop the `message` field or rename to `devMessage` to clarify it's diagnostic-only.

### 9.6 Missing Keys

| Key | File |
|---|---|
| `Common.actions.close` | `common.json` |
| `Common.aria.{loading, primaryNavigation, legalLinks, moreInformation}` | `common.json` |
| `Common.partners.{plantForThePlanetAlt, unepAlt}` | `common.json` |
| `Common.brand.name` | `common.json` |

---

## 10. App-Level (Root layout, Home, Sentry test)

App-shell concerns — one commit.

### 10.1 Root Layout Metadata

**File:** [src/app/layout.tsx:67-68](../src/app/layout.tsx#L67-L68)

```ts
return {
  metadataBase: await getMetadataBase(),
  title: 'Fundraisers',
  description: 'Fundraising platform',
};
```

**Why:** Renders in browser tab and search engines; affects SEO and user trust.

**Fix:** Use `getTranslations({ namespace: 'Common.metadata' })`.

### 10.2 Home Page Scaffold

**File:** [src/app/page.tsx:15](../src/app/page.tsx#L15)

```tsx
alt='Next.js logo'
```

**Fix:** Likely leftover scaffolding — remove or replace.

### 10.3 Sentry Test Page — Entire page hardcoded

**File:** [src/app/(standard)/sentry-test/page.tsx](../src/app/(standard)/sentry-test/page.tsx)

**Hardcoded:** page title, all error labels/descriptions, `'Trigger'` button.

**Why:** This dev/QA route is reachable in production builds.

**Fix:** Either gate with `process.env.NODE_ENV !== 'production'` or localize.

### 10.4 Missing Keys

| Key | File |
|---|---|
| `Common.metadata.{title, description}` | `common.json` |

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

### 12.2 `toLocaleString()` without args

- [donors-preview.tsx:23](../src/components/fundraisers/donors-preview.tsx#L23), [fundraiser-view.tsx:79](../src/components/fundraisers/fundraiser-view.tsx#L79).
- Returns runtime-default locale → grouping differs server vs. client → React hydration warnings.
- **Fix:** Always pass `useLocale()` or use ICU `{count, number}` via `next-intl`. (Fixed as part of [§3.5](#35-tolocalestring-without-locale-also-ssr-risk--see-122).)

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
