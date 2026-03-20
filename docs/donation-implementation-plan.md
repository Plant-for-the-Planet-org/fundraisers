# Donation Implementation Plan

Background context: [donation-flow.md](./donation-flow.md)

The overlay is being built in 4 independent portions. New sub-components go in **`src/components/donate/`** (new folder).

The reference implementation is in the `gofundnature` project at `/Users/mohit3/plant-for-the-planet/gofundnature/`. Deviations from it are noted inline.

---

## State management architecture

State lives in three layers. Nothing outside these layers needs to hold donation state.

### 1. Immutable props (flow down, never mutate during a session)

`DonationSection` already holds `fundraiser` and `paymentOptions`. Add `paymentOptions` as a new prop on `DonateOverlay` — it is not there yet.

```
DonationSection
  └─ DonateOverlay(fundraiser, donationData, paymentOptions)
      ├─ DonationOverview   ← fundraiser + donationData
      ├─ PaymentMethods     ← paymentOptions.gateways (determines which methods to show)
      │   ├─ StripeCardForm ← paymentOptions.gateways.stripe (publishable key + accountId)
      │   └─ PayPalButton   ← paymentOptions.gateways.paypal (client_id)
      └─ DonateCTA          ← paymentOptions.recurrency.supported (monthly toggle visibility)
```

### 2. RHF form in `DonateOverlay`

The overlay owns the single `useForm` instance. RHF covers **all user-controlled inputs** — donor fields and in-overlay preferences — so that `handleSubmit` is the single assembly point for everything the user has entered.

RHF fields:

- `firstname`, `lastname`, `email`
- `address`, `zipCode`, `city`, `country` (unauthenticated / new address only)
- `isAnonymous`
- `makeMonthly`, `coverFees`
- `selectedPaymentMethod`

`donorAlias` is **not** an RHF field — it is derived at payload-build time from `firstname + lastname`, and omitted entirely when `isAnonymous` is true.

`DonorDetails` receives `register`, `control`, and `formState.errors` as props. It does **not** call `useForm` itself.

### 3. Submission state (`useDonation` hook)

- `isLoading`, `isSuccess`, `error`, `fieldErrors`
- `donationId` (from POST /donations)
- `transferDetails` (set on `transfer_required` response — triggers `BankTransferInfo`)

### Submit flow

```
DonateCTA button
  → RHF handleSubmit(onSubmit)     ← validates RHF fields, shows inline errors if invalid
  → onSubmit(rhfValues):
      1. stripeFormRef.current.createPaymentMethod()   (if Stripe selected)
      2. assemble DonationFormData from:
           rhfValues                        (all user inputs — donor fields + preferences)
           donationData prop                (amount, currency, base frequency)
           effectiveFrequency = rhfValues.makeMonthly ? 'monthly' : donationData.frequency
           stripePaymentMethodId            (from step 1, never stored in state)
      3. useDonation.submitDonation(formData, paymentContext)
```

Two validation layers:

- RHF: donor field rules (required, email format) — runs before any API call
- `useDonation`: API-level field errors — set on hook state after a failed call

### Payment information

Actual payment details (card numbers, IBAN, CVV) are **never stored in React state**. They live inside Stripe's hosted element iframes.

- **Stripe (card or SEPA):** `stripeFormRef.current.createPaymentMethod()` is called at submit time. The resulting PM ID (`pm_xxx`) is passed directly into `submitDonation` — never put into state.
- **PayPal:** The SDK handles everything in its own popup and calls back with an `orderId`. This is assembled directly into the payment context at that point.
- **Offline:** No payment details collected. `submitDonation` is called with an empty source `{}`.

### Auth token

`gofundnature` uses `platformAPIClient.getAuthToken()` — this method does not exist in this project. Use `useAuthStore.getState().accessToken` instead (from `src/stores/authStore.ts`). The token is optional; unauthenticated donations are allowed.

---

## Portion 1 — Donor Info

> **Owner: colleague**

File: `src/components/donate/donor-info.tsx`

- Guest: full form (email, firstName, lastName, address, zip, city, country)
- Authenticated: pre-populate from `authStore.user.profile` (`src/stores/authStore.ts`)
  - Primary address: `profile.addresses.find(a => a.isPrimary)`
- Profile type: `UserProfileResponse` from `src/lib/api/user-service.ts`

Reference: `gofundnature/src/components/donate/donor-info.tsx`

---

## Portion 2 — Donation Summary

Files:

- `src/lib/donation/line-item-calculator.ts`
- `src/components/donate/donation-overview.tsx`

### `line-item-calculator.ts`

Splits donation amount across `projectAllocations` by percentage.
Last project gets the remainder to avoid rounding errors.

```ts
// Input: projectAllocations (from Fundraiser), totalAmountCents (integer)
// Output: Array<{ projectId, projectName, amountCents }>
```

Reference: `gofundnature/src/lib/donation/line-item-calculator.ts`

### `donation-overview.tsx`

Props:

```ts
{
  fundraiser: Fundraiser; // src/lib/types/fundraiser.ts
  donationData: DonationData; // src/components/fundraisers/donate-overlay.tsx
}
```

Shows:

- Fundraiser thumbnail + title
  - `getImageUrl('fundraiser', 'small', fundraiser.image)` from `src/lib/utils/images.ts`
- Per-project breakdown from `calculateLineItems`
  - Fallback: fundraiser title as single line item if no allocations
- Frequency label (`one-time → "One-time"`, `monthly → "Monthly"`, `quarterly → "Quarterly"`, `yearly → "Yearly"`)
- Total amount row — `formatCurrency(amountCents, currency)` from `src/lib/utils/currency.ts`
- Dedicated badge if `donationData.dedicated === true`

Reference: `gofundnature/src/components/donate/donation-overview.tsx`

Wire into overlay: replace `{/* Donation overview */}` stub in `donate-overlay.tsx` right column.

---

## Portion 3 — Payment Methods

Install packages first:

```
yarn add @stripe/stripe-js @stripe/react-stripe-js @paypal/react-paypal-js
```

Files:

- `src/components/donate/payment-methods.tsx`
- `src/components/donate/stripe-card-form.tsx`
- `src/components/donate/stripe-sepa-form.tsx`
- `src/components/donate/paypal-button.tsx`
- `src/components/donate/bank-transfer-info.tsx`
- `src/components/donate/donate-cta.tsx`

### `payment-methods.tsx`

Derives available methods from `paymentOptions.gateways` — **no hardcoding**:

- `gateways.stripe.methods` includes `'card'` → show Card tab
- `gateways.stripe.methods` includes `'sepa_debit'` → show SEPA tab
- `gateways.paypal` present → show PayPal tab
- `gateways.offline` present → show Bank Transfer tab

Extension point: accept optional `planetCash` prop (future — not rendered now).

Reference: `gofundnature/src/components/donate/payment-methods.tsx`

### `stripe-card-form.tsx`

**Deviation from gofundnature**: use Stripe Elements (`<CardElement>`) instead of raw input fields.

```ts
// Initialize:
const stripe = loadStripe(
  paymentOptions.gateways.stripe.authorization.stripePublishableKey,
  { stripeAccount: paymentOptions.gateways.stripe.authorization.accountId }
)
// Expose via ref:
createPaymentMethod(billingDetails) → stripe payment method ID
```

### `stripe-sepa-form.tsx`

Same Stripe init as card form. Uses `<IbanElement>`. Mandate acceptance checkbox required.

### `paypal-button.tsx`

```tsx
<PayPalScriptProvider
  options={{ clientId: paymentOptions.gateways.paypal.authorization.client_id }}
>
  <PayPalButtons onApprove={data => onApproved(data.orderID)} />
</PayPalScriptProvider>
```

### `bank-transfer-info.tsx`

Static display after `transfer_required` response. Shows: beneficiary, IBAN, BIC, bank name.

### `donate-cta.tsx`

- Submit button with loading/success states
- Monthly toggle: visible only if `paymentOptions.recurrency.supported === true`
- Cover fees toggle

Reference: `gofundnature/src/components/donate/donate-cta.tsx`

---

## Portion 4 — Donation Process (API)

### Files to create

**`src/lib/donation/types.ts`**

- `DonationFormData`, `DonationPayload`, `PaymentRequest`, `PaymentResponse` (union), `DonationError`
- Reference: `gofundnature/src/lib/donation/types.ts`

**`src/lib/utils/idempotency.ts`**

- `generateIdempotencyKey(prefix)` → `${prefix}-${crypto.randomUUID()}`
- Reference: `gofundnature/src/lib/utils/idempotency.ts`

**`src/lib/donation/payload-builder.ts`**

- Builds POST `/donations` body
- `donorAlias` derived from `firstname + lastname`; omitted when `isAnonymous` is true — not a separate input
- Frequency map: `'one-time' → 'once'`, others pass through. ⚠️ **Open question**: verify where `frequency` belongs in the payload (top-level field, lineItem attribute, or PUT call only) against the staging API before implementing
- `receiptAddress` and `donor` address fields are mutually exclusive — authenticated users with a saved address send `receiptAddress: id`; all others send address inside `donor`
- `customFields: []` by default — extension point for future
- Reference: `gofundnature/src/lib/donation/payload-builder.ts`

**`src/lib/api/donation-service.ts`**

- `createDonation(payload, token?)` — adds `Idempotency-Key: donation_{uuid}` header
- `submitPayment(donationId, paymentRequest, token?)` — adds `Idempotency-Key: payment_{uuid}` header
- Uses `platformAPIClient` from `src/lib/api/external-client.ts`
- Reference: `gofundnature/src/lib/api/donation-service.ts`

**`src/hooks/use-donation.ts`**

- State: `{ isLoading, isSuccess, error, fieldErrors, donationId, bankTransferDetails }`
- `submitDonation(formData, paymentContext)`:
  1. Validate required fields → set fieldErrors
  2. `createDonation` with `useAuthStore.getState().accessToken` (optional)
  3. `submitPayment` with gateway/method/source
  4. Dispatch response:
     - `type: "cardAction"` → `stripe.confirmCardPayment(payment_intent_client_secret)`
     - `type: "redirect_required"` → `window.location.href = redirectUrl`
     - `type: "transfer_required"` → set `bankTransferDetails`, show `BankTransferInfo`
     - success → set `isSuccess`
- `clearError()`
- Reference: `gofundnature/src/hooks/use-donation.ts`

### PUT /donations payload reference

| Gateway     | `gateway`   | `account`                  | `method`       | `source`                                          |
| ----------- | ----------- | -------------------------- | -------------- | ------------------------------------------------- |
| Stripe card | `"stripe"`  | `gateways.stripe.account`  | `"card"`       | `{ id: "<pm-id>", object: "payment_method" }`     |
| Stripe SEPA | `"stripe"`  | `gateways.stripe.account`  | `"sepa_debit"` | `{ id: "<pm-id>", object: "payment_method" }`     |
| PayPal      | `"paypal"`  | `gateways.paypal.account`  | `"paypal"`     | `{ type: "server_order", orderId: "<order-id>" }` |
| Offline     | `"offline"` | `gateways.offline.account` | `"offline"`    | `{}`                                              |

### Final wiring

`src/components/fundraisers/donate-overlay.tsx`:

- Add `paymentOptions: PaymentOptions` to props
- Wire all `src/components/donate/*` components
- Use `useDonation` hook

`src/components/fundraisers/donation-section.tsx`:

- Pass `paymentOptions` to `DonateOverlay` (it already has it as a prop)

---

## Out of scope for now

- **Custom fields** — leave stub comment in overlay; `payload-builder` accepts empty `customFields` array as extension point
- **Saved payment methods** — design `PaymentMethods` with optional `savedMethods` prop (not rendered)
- **PlanetCash** — `PaymentMethods` accepts optional `planetCash` prop (not rendered)

---

## Existing utilities to reuse

| Utility                                 | Location                           |
| --------------------------------------- | ---------------------------------- |
| `formatCurrency(amountCents, currency)` | `src/lib/utils/currency.ts`        |
| `getImageUrl(type, size, filename)`     | `src/lib/utils/images.ts`          |
| `platformAPIClient`                     | `src/lib/api/external-client.ts`   |
| `useAuthStore`                          | `src/stores/authStore.ts`          |
| `PaymentOptions` type                   | `src/lib/types/payment-options.ts` |
| `Fundraiser` type                       | `src/lib/types/fundraiser.ts`      |
