# PlanetCash Payment Method

## Context

PlanetCash is Planet's internal prepaid account system. When an authenticated user has a PlanetCash account and the payment options API returns it in `gateways`, it appears as a selectable payment method in the donate overlay.

The flow is simpler than card or SEPA: a single `POST /app/donations` with `prePaid: true` — no payment step (PUT) needed. The backend deducts from the user's PlanetCash balance immediately. Reference: `planet-donations` → `handlePlanetCashDonate`.

---

## Business Logic

### Display conditions

PlanetCash appears in the payment method list only when **all** of the following are true:

1. The `planet-cash` gateway is present in `paymentOptions.gateways` (returned by the payment options API — only sent for eligible authenticated users). `derivePaymentMethods` produces a `planet_cash` entry only when this gateway is present; if absent, the method never reaches the visibility filter below.
2. Donation is one-time (`!isSubscription`) — recurring donations are not supported
3. User is authenticated
4. User profile has a `planetCash` account (`donorProfile.planetCash !== undefined`)
5. PlanetCash account country matches the fundraiser's workspace country

If any condition fails, the option is not shown at all.

### Disabled state

PlanetCash is shown but disabled when `pcGateway.available < donationData.amountCents` (both in cents). The user sees the available balance followed by an insufficient balance message. Auto-select skips disabled options.

### Loading state

`PaymentMethodsSkeleton` renders until `paymentOptionsReady` (from `useDonationForm()`) is true. This prevents layout shift: the `planet-cash` gateway arrives after the authenticated payment options fetch, so all methods must render together. The skeleton shows the static title and description, and 3 placeholder rows matching the shape of a real option (radio dot + logo + label).

### Payment flow

1. User selects PlanetCash and submits.
2. **Token guard** — if `token` is null, set `error: { code: 'unexpected' }` and return. PlanetCash is only reachable for authenticated users; a missing token is an unexpected state.
3. **Single POST** — `submitPrepaidDonation(payload, token, donationAttemptKey)` → `donationService.createDonation(...)`. Payload has `prePaid: true` and no `donor` field. The backend deducts from the PlanetCash balance immediately.
4. **Resolve state** — `resolveThankYouStateFromDonation(donationId, token)` fetches the donation status until it is final.
5. **Done** — `thankYouState` is set and the thank-you UI is shown.

No PUT step. No payment method creation (`createPaymentMethod` for card/SEPA is skipped entirely).

### Error states

| Condition | Error code | User-facing message |
|---|---|---|
| Token absent at submission | `'unexpected'` | "An unexpected error occurred. Please try again." |
| POST throws | mapped by `toSubmitError()` | depends on error type |

### Payload types

`DonationPayload` is a discriminated union on `prePaid: true`:

```typescript
PrepaidDonationPayload  // prePaid: true — no donor field, no absorbedFee
PostpaidDonationPayload // donor: DonorInfo (required), absorbedFee?: number
```

`buildDonationPayload` returns `PrepaidDonationPayload` when `selectedPaymentMethod === 'planet_cash'`, otherwise `PostpaidDonationPayload`. Callers pass `selectedPaymentMethod: PaymentMethodId` directly — no intermediate boolean needed.

---

## Tasks

- [x] Add `planet_cash` to `PaymentMethodId` union and `SUPPORTED_METHOD_IDS`
- [x] Update `payment-methods.ts` utility: handle `planet-cash` gateway, add to `PAYMENT_METHOD_ORDER`
- [x] Add `planet_cash` to Zod enum in `donation-form-context.tsx`
- [x] Add PlanetCash to `payment-methods.tsx` UI: label, branded icon, balance remark, disabled state, skeleton loader
- [x] Implement PlanetCash donation flow in `use-donation-submit.ts`: discriminated payload type, `buildDonationPayload` refactor, single POST
- [x] Add i18n keys for PlanetCash in `en` and `de` locale files

**Commit status:**
- Tasks 1–4 and 6 (initial UI): committed (`feat: display PlanetCash as a payment method option`)
- Task 5 + skeleton loader + branded icon: committed (`feat: implement PlanetCash donation flow`)

---

## Implementation

### Task 1 — `PaymentMethodId`

**File:** `src/lib/types/payment-methods.ts`

`'planet_cash'` added to the `PaymentMethodId` union and `SUPPORTED_METHOD_IDS` set.

`PaymentMethod` in `src/lib/types/payment.ts` is NOT changed — it drives the payment (PUT) step, which PlanetCash skips entirely.

---

### Task 2 — `payment-methods.ts` utility

**File:** `src/lib/utils/payment-methods.ts`

`'planet_cash'` is first in `PAYMENT_METHOD_ORDER` (displayed at top).

The `planet-cash` gateway has no `methods` array. `getRawMethodEntries` handles it with an explicit branch (alongside the existing `paypal` / `offline` checks):

```typescript
} else if (normalizedGateway === 'planet-cash') {
  entries.push({ methodId: 'planet_cash', gateway });
}
```

`resolveMethod` has two matching additions: one to detect the gateway and set `resolvedMethodId`, one to return `{ methodId: 'planet_cash', provider: 'planetcash' }`.

**File:** `src/lib/utils/payment-method-normalizer.ts`

Refactored from an if-chain to an exhaustive alias map `Record<PaymentMethodId, readonly string[]>`. Adding a new `PaymentMethodId` without an alias entry is a compile-time error. The `planet_cash` entry covers `'planet_cash'`, `'planet-cash'`, and `'planetcash'`.

---

### Task 3 — Zod enum

**File:** `src/components/donate/donation-form-context.tsx`

`'planet_cash'` added to the `selectedPaymentMethod` Zod enum.

---

### Task 4 — PlanetCash UI

**File:** `src/components/donate/payment-methods.tsx`

**Icon** — `src/components/icons/donation/PlanetCashIcon.tsx`, exported from the barrel. Uses the same branded SVG as `planet-webapp`. Default color `#4d5153` matches the other payment icons. Sized `width='28' height='20'` to match card icon height while preserving the SVG's 20:14 aspect ratio.

**Skeleton loader** — `PaymentMethodsSkeleton` component (in the same file) renders 3 placeholder rows matching the shape of `PaymentMethodOption` (radio dot, logo slot, label). `PaymentMethods` returns `<PaymentMethodsSkeleton />` until `paymentOptionsReady` is true, preventing layout shift. The `planet-cash` gateway only arrives after the authenticated payment options fetch, so all methods render together.

**Visibility** — PlanetCash appears in `visibleMethodOptions` only when all of:
1. One-time donation (`!isSubscription`)
2. User is authenticated (`isAuthenticated`)
3. Profile has a `planetCash` account (`donorProfile?.planetCash !== undefined`)
4. PlanetCash account country matches fundraiser workspace country

**Disabled state** — `available < donationData.amountCents` (both in cents). Disabled options show an insufficient balance remark. Auto-select skips disabled methods.

**`PaymentMethodOption`** — gained an optional `disabled` prop. When true: `pointer-events-none`, `opacity-70`, `cursor-not-allowed`.

**Single memo** — `visibleMethodOptions` combines filter and map in one pass (no separate `visibleMethods`).

---

### Task 5 — PlanetCash donation flow

**Files:** `src/lib/types/donation.ts`, `src/lib/donation/payload-builder.ts`, `src/components/donate/use-donation-submit.ts`

#### Discriminated `DonationPayload` type

**File:** `src/lib/types/donation.ts`

`DonationPayload` is a discriminated union on `prePaid: true`:

```typescript
interface DonationPayloadBase { /* amount, currency, frequency, lineItems, donorAlias, metadata, gift */ }

export interface PrepaidDonationPayload extends DonationPayloadBase {
  prePaid: true;
}

export interface PostpaidDonationPayload extends DonationPayloadBase {
  donor: DonorInfo;           // required (always provided for non-PlanetCash flows)
  absorbedFee?: number;
}

export type DonationPayload = PrepaidDonationPayload | PostpaidDonationPayload;
```

`donor` is required (not optional) on `PostpaidDonationPayload` — the builders always return a fully-populated `DonorInfo`.

#### `buildDonationPayload` refactor

**File:** `src/lib/donation/payload-builder.ts`

Signature changed from `isPlanetCash: boolean` to `selectedPaymentMethod: PaymentMethodId`. The function now owns the check:

```typescript
if (selectedPaymentMethod === 'planet_cash') {
  return { ...baseDonationPayload, prePaid: true };
}

const absorbedFee = willAbsorbFee && processingFeeCents > 0
  ? { absorbedFee: processingFeeCents / 100 } : undefined;
const donor = formData.type === 'authenticated'
  ? buildAuthenticatedDonorInfo(formData, donorProfile)
  : buildGuestDonorInfo(formData, donorProfile);
return { ...baseDonationPayload, ...absorbedFee, donor };
```

Callers pass `values.selectedPaymentMethod` directly — no intermediate boolean needed.

#### PlanetCash flow in `onSubmit`

**File:** `src/components/donate/use-donation-submit.ts`

```typescript
if (values.selectedPaymentMethod === 'planet_cash') {
  // Token absence is an error: PlanetCash is only shown to authenticated users.
  if (!token) {
    setDonationState(prev => ({ ...prev, isLoading: false, error: { code: 'unexpected' } }));
    return;
  }
  // PlanetCash: single POST, balance deducted immediately — no PUT step needed.
  const donationResponse = await submitPrepaidDonation(payload, token, donationAttemptKey);
  const thankYouState = await resolveThankYouStateFromDonation(donationResponse.donationId, token);
  setDonationState(prev => ({ ...prev, isLoading: false, thankYouState }));
  return;
}
```

The token guard narrows `string | null` to `string`, so `token` is used directly without assertion. The `else` branch (standard donation flow) handles all non-PlanetCash methods — TypeScript narrows `selectedPaymentMethod` out of `'planet_cash'` naturally.

`onPayPalCreateOrder` also passes `values.selectedPaymentMethod` directly (the old `isPlanetCash` variable and its "always false" comment are gone).

---

### Task 6 — i18n keys

**Files:** `locales/en/fundraisers.json`, `locales/de/fundraisers.json`

Under `paymentMethods.methods`: `"planetCash": "PlanetCash"` (same in both locales).

Under `paymentMethods.planetCash`:

| key | en | de |
|---|---|---|
| `availableBalance` | `"Available: {amount}"` | `"Verfügbar: {amount}"` |
| `insufficientBalance` | `"Insufficient balance"` | `"Unzureichendes Guthaben"` |

---

## Files modified

| File | Change |
|---|---|
| `src/lib/types/payment-methods.ts` | Add `'planet_cash'` to `PaymentMethodId` and `SUPPORTED_METHOD_IDS` |
| `src/lib/types/donation.ts` | Discriminated union: `PrepaidDonationPayload \| PostpaidDonationPayload`; `donor` required on postpaid |
| `src/lib/utils/payment-method-normalizer.ts` | Refactor to exhaustive alias map; add `planet_cash` aliases |
| `src/lib/utils/payment-methods.ts` | `planet_cash` first in order; handle gateway in `getRawMethodEntries` and `resolveMethod` |
| `src/lib/donation/payload-builder.ts` | `selectedPaymentMethod: PaymentMethodId` param; early return `{ prePaid: true }` for PlanetCash |
| `src/components/donate/donation-form-context.tsx` | Add `'planet_cash'` to Zod enum |
| `src/components/donate/payment-methods.tsx` | Label, branded icon, `PaymentMethodsSkeleton`, merged memo, balance remark, disabled state |
| `src/components/donate/use-donation-submit.ts` | Single-POST PlanetCash flow, token guard, `selectedPaymentMethod` passed directly |
| `src/components/icons/donation/PlanetCashIcon.tsx` | Branded SVG (from planet-webapp); sized `28×20` to match card icon height |
| `src/components/icons/donation/index.ts` | Export `PlanetCashIcon` |
| `locales/en/fundraisers.json` | `methods.planetCash`, `planetCash.availableBalance`, `planetCash.insufficientBalance` |
| `locales/de/fundraisers.json` | Same keys in German |

---

## Verification

1. Logged-out user → PlanetCash not listed.
2. Logged-in user without `planetCash` in profile → PlanetCash not listed.
3. Subscription donation → PlanetCash not listed.
4. PlanetCash account country does not match fundraiser workspace country → PlanetCash not listed.
5. Logged-in user with matching PlanetCash, gateway present → PlanetCash appears first with branded icon and available balance below label.
6. Payment methods loading → skeleton (3 placeholder rows) shown; no layout shift when methods resolve.
7. Donation amount exceeds available balance → PlanetCash is grayed out and unclickable; shows insufficient balance message.
8. Select PlanetCash, click Donate Now → single `POST /donations` with `prePaid: true`, no `donor` field, no PUT, thank-you state shown.
9. "Cover fees" checkbox does not appear when PlanetCash is selected.
10. `npm run build` completes with no TypeScript errors.
