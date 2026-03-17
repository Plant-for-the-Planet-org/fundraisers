# Donation Flow

## Current state

The donation flow is partially implemented. The form is fully wired, the overlay opens, but no API call is made yet.

### What works

**`paymentOptions` API**

The donation form is now driven by the `GET /paymentOptions/{fundraiserId}` endpoint, fetched server-side in `page.tsx`. This replaces the previous approach of reading `fundraiser.settings.modules.contribution` directly.

Key differences from the old approach:

- Preset amounts come from `frequencies.{once,monthly,yearly}[].quantity` (full currency units) — the mapper multiplies by 100 to get cent values
- Which frequency tabs to show comes from the keys present in `frequencies` (`once` → `one_time`, `monthly` → `monthly`, `yearly` → `annual`)
- Whether recurrency is supported comes from `recurrency.supported` (replaces `allow_recurrency`)
- `allow_dedication` and `show_totals_on_fundraiser` still come from `fundraiser.settings.modules.contribution` since the `paymentOptions` endpoint does not expose them
- The response also includes `gateways` (Stripe publishable key, PayPal client ID, offline account) — these will be needed for the checkout step

The mapping lives in `mapPaymentOptionsToContributionSettings()` in `contribution-utils.ts`. The old `mapContributionSettings()` is kept as a fallback but is no longer used in the donation flow.

**`canDonate` flag and closed state**

`paymentOptions` is only fetched when `fundraiser.canDonate` is true. `FundraiserView` gates `DonationSection` on both `fundraiser.canDonate && paymentOptions`. When either is falsy, `ClosedForContribution` is shown instead, with an optional custom message from `fundraiser.metadata?.closedMessage`.

**Tax deductibility**

`SecurityNotice` (shown below the donation form) derives `isTaxDeductible` from `paymentOptions.taxDeductionCountries` — this is an array of country codes where donations to this fundraiser are tax-deductible. We check whether `fundraiser.workspace.country` is in that list.

Note: `src/lib/utils/country-currency.ts` contains a hardcoded `TAX_DEDUCTIBLE_COUNTRIES` set (`DE`, `US`, `ES`) with a `getTaxDeductibilityInfo()` helper. This predates the `paymentOptions` API and should not be used for the donation flow — `paymentOptions.taxDeductionCountries` is the authoritative source.

**Client boundary**

`FundraiserView` is a server component. `DonationSection` (`src/components/fundraisers/donation-section.tsx`) is the client boundary that owns all donation interactivity. It holds:

- `donationData` — values from the form: `{ amount, currency, frequency, dedicated }`
- `isOverlayOpen` — controls whether the overlay is shown

`useState` is used here (not Zustand) because the state is fully contained within `DonationSection` and its children.

**Overlay**

`DonateOverlay` (`src/components/fundraisers/donate-overlay.tsx`) opens full-screen when Donate is clicked. It uses `createPortal` to render into `document.body`.

The portal is necessary because `MainContent` applies `backdrop-blur`, which causes the browser to treat that element as the containing block for `position: fixed` descendants. Without the portal, `fixed inset-0` would be clipped to the content box rather than covering the full viewport.

The overlay currently shows a donation summary, per-project line items, a raw JSON debug block (to verify passed values), a stubbed donor alias field, and a disabled pay button. It uses `useForm` (RHF) for the donor form — ready to expand.

---

## What's not done yet

### `ClosedForContribution` + `SecurityNotice`

Two components from `gofundnature` need to be ported:

- **`ClosedForContribution`** — shown in place of the donation form when `canDonate` is false. Displays a "thank you" message + a custom closed message from `fundraiser.metadata?.closedMessage`, falling back to a default string.
- **`SecurityNotice`** — shown below the donation form when `canDonate` is true. Shows the org name, country, and tax deductibility. Tax-deductible countries are now available from `paymentOptions.taxDeductionCountries` — check if `paymentOptions.effectiveCountry` is in that list.

Both need i18n keys added to `locales/{en,de}/fundraisers.json`.

### Donation submission

Creating a donation requires two API calls:

**Step 1 — Create a draft**

```
POST /donations
Authorization: Bearer {token}
Idempotency-Key: donation_{uuid}    ← generate a fresh UUID per attempt; safe to retry with the same key

{
  "currency": "EUR",
  "lineItems": [
    { "project": "proj_...", "amount": 10 }   ← full units, NOT cents
  ],
  "donorAlias": "Jane Smith",                 ← omit or set isAnonymous for anonymous donations
  "metadata": {
    "fundraiser": {
      "id": "fr_...",
      "source": "{window.location.href}",
      "referrer": "direct | {document.referrer}",
      "user_id": "{platform profile ID}",     ← only if authenticated
      "privacy": { "is_anonymous": false }
    }
  },
  "receiptAddress": "adr_..."                 ← optional; address ID for tax receipt
}

→ { id: "don_...", paymentStatus: "draft", token: "..." }
```

**Step 2 — Add payment**

```
PUT /donations/{id}
{ /* payment method details — Stripe, SEPA, etc. */ }
```

The `don_...` ID from step 1 is used for step 2. A `donation-service.ts` needs to be created in `src/lib/api/` — `gofundnature/src/lib/api/donation-service.ts` covers the full implementation including retries and idempotency.

The `paymentOptions.gateways` response now provides the Stripe publishable key and PayPal client ID needed to initialise the payment SDKs for step 2.

**Multiple project allocations**

When a fundraiser has multiple projects, split the total proportionally:

```ts
lineItems = fundraiser.projectAllocations.map(allocation => ({
  project: allocation.project.id,
  amount: (donationData.amount / 100) * (allocation.percentage / 100),
  // €20 total, 60% allocation → 20 * 0.6 = 12.0
}))
```

### Donor details form

The overlay's RHF form needs to be expanded:

- **Display name** (`donorAlias`) — pre-fill from the authenticated user's profile name
- **Anonymous toggle** — when on, omit `donorAlias` and set `privacy.is_anonymous: true`
- **Receipt address** — for authenticated users, allow selecting a saved address (returns an `adr_...` ID for `receiptAddress`) or entering a new one (address goes inside the `donor` object instead)
- **Unauthenticated users** — collect full donor details (name, email, address) directly in the form

### Recurring donations

The `frequency` field from the donation form (`'one-time'`, `'monthly'`, `'quarterly'`, `'yearly'`) needs to map to the API payload. The exact field name and accepted values should be verified against the staging API — check how the old project's `donate-overlay.tsx` passes `frequency` to `useDonation`.

### Custom fields

`fundraiser.settings.modules.custom_fields` can define additional required inputs (checkbox, dropdown, free text). If present, render them in the overlay and include their values in `metadata`. Reference: `gofundnature/src/components/donation/custom-fields.tsx`.

---

## Key files

| File | Purpose |
|------|---------|
| `src/components/fundraisers/donation-section.tsx` | Client boundary; owns overlay state |
| `src/components/fundraisers/donate-overlay.tsx` | Full-page overlay; placeholder RHF form |
| `src/components/fundraisers/donation-form.tsx` | Amount/frequency/dedication UI |
| `src/lib/utils/contribution-utils.ts` | Settings mapping and defaults |
| `src/lib/types/fundraiser.ts` | `ContributionModuleSettings`, `FundraiserSettings` types |
| `src/lib/types/payment-options.ts` | `PaymentOptions` type |
| `src/lib/api/payment-options-service.ts` | `getPaymentOptions(fundraiserId)` |
