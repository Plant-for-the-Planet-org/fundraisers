# i18n / Localization Review — Fundraisers App

> **Review date:** 2026-05-21
> **Scope:** Full codebase audit of internationalization (i18n) coverage, locale-aware formatting, and accessibility text localization.
> **Stack:** `next-intl` + cookie-based locale (`ui-locale`), locales `en` and `de` (default `de`), `localePrefix: 'never'`.

---

## Table of Contents

1. [Summary](#1-summary)
2. [Hardcoded UI Strings](#2-hardcoded-ui-strings)
3. [Hardcoded Locale Usage & Formatting](#3-hardcoded-locale-usage--formatting)
4. [Missing Translation Keys](#4-missing-translation-keys)
5. [Validation & Error Messages Bypassing Translations](#5-validation--error-messages-bypassing-translations)
6. [Fallback Text Not Localized](#6-fallback-text-not-localized)
7. [Unused / Orphan Translation Concerns](#7-unused--orphan-translation-concerns)
8. [SSR / Client Locale Mismatch Risks](#8-ssr--client-locale-mismatch-risks)
9. [Repeated Patterns & Refactor Opportunities](#9-repeated-patterns--refactor-opportunities)
10. [Inconsistencies](#10-inconsistencies)
11. [Quick-Win Priority List](#11-quick-win-priority-list)

---

## 1. Summary

| Metric | Value |
|---|---|
| **Total issues found** | ~55 across 30+ files |
| **Locales** | `en`, `de` (default: `de`) |
| **i18n library** | `next-intl` |
| **Locale detection** | Cookie (`ui-locale`); no URL prefix |
| **EN/DE key parity** | ✅ All 9 namespaces have matching key counts |

### Issue Categories

| # | Category | Severity |
|---|---|---|
| 1 | Hardcoded user-visible strings in JSX | 🔴 High |
| 2 | Hardcoded `'en-US'` defaults in currency utilities | 🔴 High |
| 3 | Hardcoded English `formatTimeAgo` (no locale support) | 🔴 High |
| 4 | Hardcoded English in `alt` / `aria-label` attributes | 🟡 Medium |
| 5 | Hardcoded `' and '` host joiner; inconsistent `Intl.ListFormat` | 🟡 Medium |
| 6 | `setError(...)` with raw English literals | 🟡 Medium |
| 7 | Locale arg omitted at many `formatCurrency*` call sites | 🔴 High |
| 8 | Fallback `'More information'` literal in `InfoTooltip` | 🟢 Low |
| 9 | Hardcoded `'Loading'` aria-label on `CategoryPageSkeleton` | 🟢 Low |
| 10 | Root layout metadata title/description hardcoded | 🟡 Medium |
| 11 | UI fallback `'User'` literal in `UserMenu` | 🟢 Low |

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

## 2. Hardcoded UI Strings

### 2.1 Impersonation Modal — Entire component untranslated

**File:** [src/components/auth/impersonation-modal.tsx:44-141](../src/components/auth/impersonation-modal.tsx#L44-L141)

**Hardcoded strings:**

- `'Impersonate user'` (title)
- `'User email'`, `'Support pin'` (labels)
- `'user@example.com'`, `'Support pin'` (placeholders)
- `'Cancel'`, `'Validating...'`, `'Impersonate'` (buttons)
- Validation errors:
  - `'Enter a valid email'`
  - `'Pin must be 4 digits'`
  - `'You are not signed in'`
  - `'Profile email did not match. Check the email and pin and try again.'`
  - `'Invalid email or support pin'`
  - `'No user found with that email'`
  - `'Validation failed'`, `'Validation failed. Try again.'`

**Why it's an issue:** The entire modal — including all validation messages — bypasses `useTranslations`. German support staff cannot use it natively.

**Suggested fix:** Add to `auth.json`:

```jsonc
"Auth": {
  "impersonation": {
    "title": "...",
    "description": "...",
    "emailLabel": "...",
    "emailPlaceholder": "...",
    "pinLabel": "...",
    "pinPlaceholder": "...",
    "cancel": "...",
    "submit": "...",
    "submitting": "...",
    "errors": {
      "invalidEmail": "...",
      "invalidPin": "...",
      "notSignedIn": "...",
      "profileMismatch": "...",
      "invalidCredentials": "...",
      "notFound": "...",
      "generic": "..."
    }
  }
}
```

**Namespace:** `Auth.impersonation`

---

### 2.2 Fundraiser Not-Found Page

**File:** [src/app/(fundraiser)/raise/[slug]/not-found.tsx:8-19](../src/app/(fundraiser)/raise/[slug]/not-found.tsx#L8-L19)

**Hardcoded strings:** `'404'`, `'Fundraiser Not Found'`, `"The fundraiser you're looking for doesn't exist or may have been removed."`, `'Browse Fundraisers'`, `'Go Home'`

**Why it's an issue:** The sibling [`error.tsx`](../src/app/(fundraiser)/raise/[slug]/error.tsx) already uses `Fundraisers.error.*` — the not-found page is inconsistent.

**Suggested fix:** Add `Fundraisers.notFound.{title, description, browseCta, homeCta}`.

**Namespace:** `Fundraisers.notFound`

---

### 2.3 Donate Overlay Layout — Aria labels

**File:** [src/components/donate/donate-overlay-layout.tsx:19,25](../src/components/donate/donate-overlay-layout.tsx#L19-L25)

```tsx
aria-label='donation details'
aria-label='Close donation overlay'
```

**Suggested fix:** `tDonate('overlay.aria.label')`, `tDonate('overlay.aria.close')`

**Namespace:** `Donate.overlay.aria`

---

### 2.4 Shared Dialog Primitive

**File:** [src/components/ui/dialog.tsx:75,113](../src/components/ui/dialog.tsx#L75-L113)

```tsx
<span className='sr-only'>Close</span>
<Button variant='outline'>Close</Button>
```

**Why it's an issue:** This is a shared shadcn-style primitive used by many consumers; the screen-reader Close text reaches every dialog in the app.

**Suggested fix:** Accept a `closeLabel` prop, or read from `Common.actions.close`.

**Namespace:** `Common.actions`

---

### 2.5 Footer & Header — Navigation aria labels

| File | Line | Hardcoded |
|---|---|---|
| [footer/links-bar.tsx](../src/components/footer/links-bar.tsx#L12) | 12 | `aria-label='Legal links'` |
| [header/navigation.tsx](../src/components/header/navigation.tsx#L11) | 11 | `aria-label='Primary navigation'` |
| [header/logo.tsx](../src/components/header/logo.tsx#L10) | 10 | `aria-label='Plant-for-the-Planet'` (brand — debatable) |

**Suggested fix:** Centralize under `Common.aria.{legalLinks, primaryNavigation}`; `Common.brand.name` for the brand string (used in 3+ places).

**Namespace:** `Common.aria`, `Common.brand`

---

### 2.6 Footer Logos — Image alt text

**File:** [src/components/footer/logos.tsx:13,25](../src/components/footer/logos.tsx#L13-L25)

```tsx
alt='Plant-for-the-Planet'
alt='UN Environment Program'
```

**Suggested fix:** `Common.partners.{plantForThePlanetAlt, unepAlt}`

**Namespace:** `Common.partners`

---

### 2.7 Stage Top Bar — Image alt text

**File:** [src/components/stage/stage-top-bar.tsx:21,32](../src/components/stage/stage-top-bar.tsx#L21-L32)

```tsx
alt='Plant-for-the-Planet'
alt='Partner'
```

**Suggested fix:** `Stage.topBar.{brandAlt, partnerAlt}`

**Namespace:** `Stage.topBar`

---

### 2.8 User Menu — Multiple issues

**File:** [src/components/auth/user-menu.tsx:75,96,125](../src/components/auth/user-menu.tsx#L75-L125)

```tsx
alt='Profile'
{displayName || 'User'}                                  // English fallback
{isImpersonating ? 'Switch impersonation' : 'Impersonate user'}
```

**Suggested fix:** `Auth.userMenu.{profileAvatarAlt, defaultDisplayName, switchImpersonation, impersonate}`

**Namespace:** `Auth.userMenu`

---

### 2.9 Donation Method Icons — Aria labels

**Files:**

- [ApplePayIcon.tsx:15](../src/components/icons/donation/ApplePayIcon.tsx#L15) → `'Apple Pay'`
- [BankIcon.tsx:15](../src/components/icons/donation/BankIcon.tsx#L15) → `'Bank Transfer'` ⚠️
- [CreditCard.tsx:11](../src/components/icons/donation/CreditCard.tsx#L11) → `'Credit Card'` ⚠️
- [GooglePayIcon.tsx:15](../src/components/icons/donation/GooglePayIcon.tsx#L15) → `'Google Pay'`
- [PaypalIcon.tsx:11](../src/components/icons/donation/PaypalIcon.tsx#L11) → `'PayPal'`
- [SepaIcon.tsx:11](../src/components/icons/donation/SepaIcon.tsx#L11) → `'SEPA Direct Debit'` ⚠️

**Why it's an issue:** Brand names (PayPal, Apple Pay, Google Pay) can stay, but "Bank Transfer", "Credit Card", and "SEPA Direct Debit" must be translated.

**Suggested fix:** Accept `aria-label` as a prop — the parent [`payment-methods.tsx`](../src/components/donate/payment-methods.tsx) already translates method names; pass them down.

**Namespace:** `Donate.methods`

---

### 2.10 Stripe SEPA Form — Validation errors & placeholder

**File:** [src/components/donate/stripe-sepa-form.tsx](../src/components/donate/stripe-sepa-form.tsx)

| Line | Hardcoded |
|---|---|
| 72 | `return { error: 'Validation failed' }` |
| 74 | `return { error: 'Stripe not initialized' }` |
| 76 | `return { error: 'IBAN element not found' }` |
| 96 | `error.message ?? 'Payment method creation failed'` |
| 101 | `return { error: 'Stripe not initialized' }` |
| 133 | `placeholder='Jane Doe'` |

**Suggested fix:** `Donate.sepa.errors.*` and `Donate.sepa.accountHolderNamePlaceholder`.

**Namespace:** `Donate.sepa.errors`

---

### 2.11 Stripe Card Form — Error fallbacks

**File:** [src/components/donate/stripe-card-form.tsx:164,172](../src/components/donate/stripe-card-form.tsx#L164-L172)

```ts
return { error: error.message ?? 'Payment method creation failed' };
if (error) return { error: error.message ?? 'Card action failed' };
```

**Suggested fix:** `Donate.card.errors.{paymentMethodFailed, cardActionFailed}`

---

### 2.12 Contribution Settings — Native `alert()`

**File:** [src/components/fundraisers/contribution-settings.tsx:18-22](../src/components/fundraisers/contribution-settings.tsx#L18-L22)

```ts
alert(
  `Preview Mode\nWould donate ${formatCurrency(amount, currency)} ${frequency}${isDedicated ? ' (dedicated)' : ''}`
);
```

**Why it's an issue:** Native `alert()` is poor UX, and the strings are English-only.

**Suggested fix:** Replace with a translated toast/dialog using `Fundraisers.form.contributionSettings.preview.{previewMode, previewDonation, dedicated}`.

---

### 2.13 Location Category Map — Placeholder copy

**File:** [src/components/explore/location-category-map.tsx:7-8](../src/components/explore/location-category-map.tsx#L7-L8)

```tsx
<p className='text-lg font-medium mb-2'>Map View</p>
<p className='text-sm'>Interactive map coming soon</p>
```

**Suggested fix:** `Explore.locationMap.{title, comingSoon}` — even temporary copy must be translated.

**Namespace:** `Explore.locationMap`

---

### 2.14 Category Page Skeleton — Loading aria

**File:** [src/components/explore/category-page-skeleton.tsx:6](../src/components/explore/category-page-skeleton.tsx#L6)

```tsx
<div className='category-page-skeleton' role='status' aria-label='Loading'>
```

**Why it's an issue:** Sibling skeletons use `t('loading')` (Dashboard.list.item.loading, Dashboard.summary.loading) — this one is inconsistent.

**Suggested fix:** `Explore.categoryPage.loadingAria` or reuse `Common.aria.loading`.

---

### 2.15 Info Tooltip — English fallback

**File:** [src/components/ui/info-tooltip.tsx:48](../src/components/ui/info-tooltip.tsx#L48)

```tsx
<span className='sr-only'>{triggerLabel ?? 'More information'}</span>
```

**Why it's an issue:** Ships English to users when callers omit the prop.

**Suggested fix:** Either require `triggerLabel`, or default from `Common.aria.moreInformation`.

---

### 2.16 Donation Summary — Hardcoded conjunction

**File:** [src/components/donate/donation-summary.tsx:69](../src/components/donate/donation-summary.tsx#L69)

```ts
const joinedNames = publicHosts.map(h => h.displayName).filter(Boolean).join(' and ');
```

**Why it's an issue:** `' and '` is English-only; German would expect `' und '`. Locale-aware joining already exists in [`fundraiser-list-item.tsx:38`](../src/components/dashboard/fundraiser-list-item.tsx#L38) using `Intl.ListFormat`.

**Suggested fix:** Use `new Intl.ListFormat(locale, { type: 'conjunction' })`. Extract a shared `joinNames(names, locale)` helper.

---

### 2.17 Sentry Test Page — Entire page

**File:** [src/app/(standard)/sentry-test/page.tsx](../src/app/(standard)/sentry-test/page.tsx)

**Hardcoded:** Page title, all error labels/descriptions, `'Trigger'` button.

**Why it's an issue:** This dev/QA route is reachable in production builds.

**Suggested fix:** Either gate with `process.env.NODE_ENV !== 'production'` or localize.

---

### 2.18 Root Layout Metadata

**File:** [src/app/layout.tsx:67-68](../src/app/layout.tsx#L67-L68)

```ts
return {
  metadataBase: await getMetadataBase(),
  title: 'Fundraisers',
  description: 'Fundraising platform',
};
```

**Why it's an issue:** Renders in browser tab and search engines; affects SEO and user trust.

**Suggested fix:** Use `getTranslations({ namespace: 'Common.metadata' })`.

**Namespace:** `Common.metadata.{title, description}`

---

### 2.19 Home Page Scaffold

**File:** [src/app/page.tsx:15](../src/app/page.tsx#L15)

```tsx
alt='Next.js logo'
```

**Suggested fix:** Likely leftover scaffolding — remove or replace.

---

## 3. Hardcoded Locale Usage & Formatting

### 3.1 Currency Utilities — Default `'en-US'`

**File:** [src/lib/utils/currency.ts:47,96](../src/lib/utils/currency.ts#L47)

**Current code:**

```ts
export function formatCurrency(amountInCents, currency, locale: string = 'en-US')
export function formatCurrencyFromDecimal(amount, currency, locale: string = 'en-US', currencyDisplay)
```

**Why it's an issue:** Many callers omit the locale argument, producing US grouping/decimal separators inside a German UI (e.g. `€12,345.67` instead of `12.345,67 €`).

**Affected call sites omitting locale:**

| File | Line |
|---|---|
| [donate-options.tsx](../src/components/donate/donate-options.tsx#L74) | 74 |
| [fundraisers/donation-form.tsx](../src/components/fundraisers/donation-form.tsx) | 108 |
| [fundraisers/donation-amounts.tsx](../src/components/fundraisers/donation-amounts.tsx) | 72 |
| [fundraisers/contribution-settings.tsx](../src/components/fundraisers/contribution-settings.tsx) | 20 |
| [fundraisers/leaderboard/donation-table.tsx](../src/components/fundraisers/leaderboard/donation-table.tsx#L79) | 79 |
| [fundraisers/leaderboard/donation-item.tsx](../src/components/fundraisers/leaderboard/donation-item.tsx#L65) | 65 |
| [fundraisers/goal-progress-display.tsx](../src/components/fundraisers/goal-progress-display.tsx) | 25, 41 |
| [donate/donation-summary.tsx](../src/components/donate/donation-summary.tsx#L139) | 139, 154, 163 |
| [donate/payment-methods.tsx](../src/components/donate/payment-methods.tsx#L332) | 332, 355, 406 ⚠️ explicitly passes `undefined` |
| [donate/donation-thank-you.tsx](../src/components/donate/donation-thank-you.tsx) | 30, 38 |
| [explore/fundraiser-card.tsx](../src/components/explore/fundraiser-card.tsx#L72) | 72 |
| [dashboard/fundraiser-list-item.tsx](../src/components/dashboard/fundraiser-list-item.tsx#L43-L50) | 43-50 |

**Suggested fix:**

1. Make `locale` **required** (no default).
2. Create a `useFormatCurrency()` hook that binds locale once.
3. Migrate all call sites to the hook.

---

### 3.2 `formatTimeAgo` — English-only, no locale support

**File:** [src/lib/utils/time.ts](../src/lib/utils/time.ts)

**Current code:**

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

**Why it's an issue:** German users see `5m ago`, `2h ago`, `3d ago` on the public fundraiser page.

**Suggested fix:**

```ts
export function formatTimeAgo(ts: string | Date, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  // pick best unit based on diff
  return rtf.format(-diff, unit);
}
```

Or expose as `useFormatTimeAgo()` hook.

---

### 3.3 `toLocaleString()` Without Locale

**Files:**

- [donors-preview.tsx:23](../src/components/fundraisers/donors-preview.tsx#L23)
- [fundraiser-view.tsx:79](../src/components/fundraisers/fundraiser-view.tsx#L79)

```ts
recent.length.toLocaleString()    // ❌ Uses runtime default
```

**Why it's an issue:** Defaults to the JS runtime locale, which differs between SSR and client and isn't the active UI locale. Causes hydration mismatches.

**Suggested fix:** Always pass `useLocale()`:

```ts
recent.length.toLocaleString(locale)
```

---

## 4. Missing Translation Keys

Keys that have **no entry at all yet** — must be added in both `en` and `de`:

| Key | Locale File | Purpose |
|---|---|---|
| `Auth.impersonation.*` | `auth.json` | Impersonation modal |
| `Auth.userMenu.{profileAvatarAlt, defaultDisplayName, impersonate, switchImpersonation}` | `auth.json` | User menu |
| `Common.metadata.{title, description}` | `common.json` | Root layout metadata |
| `Common.actions.close` | `common.json` | Reusable Close label for dialog |
| `Common.aria.{loading, primaryNavigation, legalLinks, moreInformation}` | `common.json` | Shared aria labels |
| `Common.partners.{plantForThePlanetAlt, unepAlt}` | `common.json` | Footer logos |
| `Common.brand.name` | `common.json` | Centralized brand string |
| `Donate.overlay.aria.{label, close}` | `donate.json` | Donate overlay |
| `Donate.sepa.{accountHolderNamePlaceholder, errors.*}` | `donate.json` | SEPA form |
| `Donate.card.errors.*` | `donate.json` | Stripe card form |
| `Explore.locationMap.{title, comingSoon}` | `explore.json` | Map placeholder |
| `Explore.categoryPage.loadingAria` | `explore.json` | Skeleton aria |
| `Fundraisers.notFound.*` | `fundraisers.json` | Not-found page |
| `Fundraisers.form.contributionSettings.preview.*` | `fundraisers.json` | Preview alert |
| `Stage.topBar.{brandAlt, partnerAlt}` | `stage.json` | Stage top bar |

---

## 5. Validation & Error Messages Bypassing Translations

### 5.1 Impersonation Modal

**File:** [impersonation-modal.tsx:44-86](../src/components/auth/impersonation-modal.tsx#L44-L86)

Six `setError('English literal')` paths. API failure handler routes raw English to UI. See [§2.1](#21-impersonation-modal--entire-component-untranslated).

### 5.2 Fundraiser Create/Update Buttons

**Files:**

- [create-fundraiser-button.tsx:56](../src/components/fundraisers/create-fundraiser-button.tsx#L56)
- [update-fundraiser-button.tsx:80](../src/components/fundraisers/update-fundraiser-button.tsx#L80)

```ts
const message = err instanceof Error ? err.message : 'Failed to create fundraiser';
toast.error(t('errorMessage'), { description: message });
```

**Why it's an issue:** The toast title is translated, but the description leaks raw English from `err.message` or the English fallback.

**Fix:** Drop raw `err.message` from the description, or map known error codes to translated messages.

### 5.3 Fundraiser Edit Hook

**File:** [use-fundraiser-for-edit.ts:92](../src/components/fundraisers/use-fundraiser-for-edit.ts#L92)

```ts
const message = error instanceof Error ? error.message : t('loadError');
```

**Why it's an issue:** Truthy branch shows raw English API messages.

**Fix:** Prefer `t('loadError')`; log `error.message` to console only.

### 5.4 Address Form

**File:** [address-form.tsx:75-77](../src/components/donate/address-form.tsx#L75-L77)

Same pattern — surfaces raw `err.message`.

### 5.5 API Services Propagate English

API client services that propagate English strings via `PlatformAPIError`:

- [donation-service.ts:13,82](../src/lib/api/donation-service.ts)
- [payment-service.ts](../src/lib/api/payment-service.ts)
- [paypal-order-service.ts:8](../src/lib/api/paypal-order-service.ts)
- [unsplash-service.ts:16](../src/lib/api/unsplash-service.ts)

**Recommended pattern:** Services should throw typed **error codes**; UI calls `t(code)`. The pattern in [`donation-failure-banner.tsx`](../src/components/donate/donation-failure-banner.tsx) (`SubmissionErrorKey` + `Donate.submissionErrors`) is the correct shape — generalize it across features.

---

## 6. Fallback Text Not Localized

| Location | Fallback |
|---|---|
| [user-menu.tsx:96](../src/components/auth/user-menu.tsx#L96) | `displayName \|\| 'User'` |
| [info-tooltip.tsx:48](../src/components/ui/info-tooltip.tsx#L48) | `triggerLabel ?? 'More information'` |
| [create-fundraiser-button.tsx:56](../src/components/fundraisers/create-fundraiser-button.tsx#L56) | `'Failed to create fundraiser'` |
| [update-fundraiser-button.tsx:80](../src/components/fundraisers/update-fundraiser-button.tsx#L80) | `'Failed to update fundraiser'` |
| [stripe-sepa-form.tsx:96](../src/components/donate/stripe-sepa-form.tsx#L96) | `'Payment method creation failed'` |
| [stripe-card-form.tsx:164,172](../src/components/donate/stripe-card-form.tsx#L164-L172) | `'Payment method creation failed'`, `'Card action failed'` |
| [image-selection.ts:24-48](../src/lib/utils/image-selection.ts#L24-L48) | `'Selected file is empty.'`, `'Image must be ${MB}MB or smaller.'`, `'Please upload a JPG, PNG, WEBP, or GIF image.'` |

**Note on `image-selection.ts`:** The `error.code` is used in the UI ([overlay:88-101](../src/components/fundraisers/image-selection-overlay.tsx#L88-L101)), but the literal `message` field is still set on the result object. Either drop the `message` field or rename to `devMessage` to clarify it's diagnostic-only.

---

## 7. Unused / Orphan Translation Concerns

### 7.1 `cookie.json` Is Not Loaded by next-intl

- [`src/i18n/request.ts`](../src/i18n/request.ts) does **not** import `cookie.json`.
- [`src/i18n/types.ts`](../src/i18n/types.ts) does not include it in the `Messages` type.
- It is consumed via direct static import in [`cookie-consent-config.ts`](../src/lib/constants/cookie-consent-config.ts).

**Implication:** `t('consentModal.title')` via `useTranslations` will **not** work for any `cookie.json` key.

**Fix:** Either (a) load it in `request.ts` and add to `types.ts`, or (b) document explicitly that it's a separate dictionary for `vanilla-cookieconsent`.

### 7.2 No Automated Key Audit

No tooling currently detects orphan keys.

**Recommendation:** Add a CI step using `i18next-scanner`, `lint-i18n-json`, or a small Node script that diffs flattened JSON keys against `t('...')` usages in source.

---

## 8. SSR / Client Locale Mismatch Risks

### 8.1 Cookie-based Locale + No URL Prefix

- [`request.ts`](../src/i18n/request.ts) reads `ui-locale` cookie.
- Routing is `localePrefix: 'never'` — the URL is identical across locales.
- **Risk:** Caches and CDNs **must vary on the `ui-locale` cookie** or users will see a snapshot in the wrong language.
- **Action:** Verify Vercel/Next caching does not strip cookies on cached routes.

### 8.2 `toLocaleString()` Without Args

- [donors-preview.tsx:23](../src/components/fundraisers/donors-preview.tsx#L23), [fundraiser-view.tsx:79](../src/components/fundraisers/fundraiser-view.tsx#L79).
- Returns runtime-default locale → grouping differs server vs. client → React hydration warnings.
- **Fix:** Always pass `useLocale()` or use ICU `{count, number}` via `next-intl`.

### 8.3 `formatTimeAgo`

- Time-sensitive AND locale-agnostic.
- Server timestamp diff differs from client; combined with English-only output, this is a double SSR risk.

---

## 9. Repeated Patterns & Refactor Opportunities

### 9.1 `useFormatCurrency()` Hook

Build a hook that returns a bound function reading `useLocale()`:

```ts
export function useFormatCurrency() {
  const locale = useLocale();
  return useCallback(
    (cents: number, currency: string) => formatCurrency(cents, currency, locale),
    [locale]
  );
}
```

Then make `locale` mandatory in the underlying utility. **Eliminates 17+ inconsistent call sites.**

### 9.2 `useFormatTimeAgo()` Hook

Add a hook with `Intl.RelativeTimeFormat`. Replaces 3 usages and handles SSR consistently.

### 9.3 Host Name List Joining

Standardize on `Intl.ListFormat(locale, { type: 'conjunction' })` via a `joinNames(names, locale)` helper. Fixes [donation-summary.tsx:69](../src/components/donate/donation-summary.tsx#L69) and any other ad-hoc joins.

### 9.4 Aria Labels for Shared Primitives

Add a `Common.aria` namespace. Refactor `Dialog`, `InfoTooltip`, and the donation `*Icon.tsx` files to accept a `label` prop defaulting to translations at the consumer.

### 9.5 Error Code → Message Mapping

Generalize the pattern used in [`donation-failure-banner.tsx`](../src/components/donate/donation-failure-banner.tsx):

- Services throw **typed codes**.
- UI calls `t(code)`.

Apply to: fundraiser create/update, address save, impersonation, SEPA/card validation.

### 9.6 Pluralization

`Dashboard.list.item.donations` correctly uses an ICU `count` param, but plural-sensitive count formatting in `dashboard-summary.tsx` interpolates a pre-`toLocaleString`-formatted string. Audit all `formattedCount` usages and prefer ICU `{count, plural, ...}` so DE plural forms can diverge from EN when needed.

### 9.7 One Key for Two Attributes

[fundraiser-search-input.tsx:52-53](../src/components/dashboard/fundraiser-search-input.tsx#L52-L53) reuses `searchPlaceholder` for both `placeholder` and `aria-label`. Functional, but consider a distinct `searchAria` key in case UX wants a more descriptive aria string.

### 9.8 Centralization in `src/lib/utils/formatting.ts`

`getLocalizedAbbreviatedCount` already lives there. Move `formatCurrency*`, `formatTimeAgo`, and new `joinNames` into the same module — all accepting locale.

Provide `useFormatters()` returning `{ currency, timeAgo, list, number }` to standardize component-level usage.

### 9.9 CI Guardrail

Add a build-time script that flattens both `en/` and `de/` JSON trees and asserts key-set equality (currently true, but no guard).

---

## 10. Inconsistencies

### 10.1 Locale Arg Drift

Some components correctly pass `locale` to `formatCurrencyFromDecimal`:

- ✅ [stage-counter.tsx:58](../src/components/stage/stage-counter.tsx#L58)
- ✅ [dashboard-summary.tsx:50](../src/components/dashboard/dashboard-summary.tsx#L50)

Others omit it (see [§3.1](#31-currency-utilities--default-en-us)). **This is the single biggest source of subtle bugs for German users.**

### 10.2 Aria Label Coverage

Some aria-labels come from translations:

- ✅ [dashboard/fundraiser-action-menu.tsx:137](../src/components/dashboard/fundraiser-action-menu.tsx#L137)
- ✅ [image-selection-overlay.tsx:257](../src/components/fundraisers/image-selection-overlay.tsx#L257)

Others are literal English in the same feature area:

- ❌ [donate-overlay-layout.tsx](../src/components/donate/donate-overlay-layout.tsx)
- ❌ [ui/dialog.tsx](../src/components/ui/dialog.tsx)

**Action:** Apply the rule uniformly.

---

## 11. Quick-Win Priority List

| # | Action | Impact | Effort |
|---|---|---|---|
| 1 | Make `locale` mandatory in `formatCurrency*` + fix all call sites | 🔴 High (currency is broken for DE users today) | Medium |
| 2 | Rewrite `formatTimeAgo` with `Intl.RelativeTimeFormat` | 🔴 High (visible English in public pages) | Small |
| 3 | Translate `ImpersonationModal` end-to-end | 🟡 Medium | Medium |
| 4 | Translate `not-found.tsx` (fundraiser) and `donate-overlay-layout.tsx` aria labels | 🟡 Medium | Small |
| 5 | Replace `'User'`, `'More information'`, `'Loading'`, `'Close'` fallbacks with translated keys | 🟢 Low | Small |
| 6 | Localize root layout metadata | 🟡 Medium (SEO) | Small |
| 7 | Replace `.join(' and ')` and ad-hoc list joins with `Intl.ListFormat(locale)` | 🟡 Medium | Small |
| 8 | Add CI key-parity check; load `cookie.json` (or document the separate dictionary) | 🟢 Low (prevention) | Small |

---

## Appendix: Locale Setup Reference

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
