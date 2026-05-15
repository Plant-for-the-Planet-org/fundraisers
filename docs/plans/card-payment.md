# Card Payment Implementation Plan

## Context

The fundraisers project already supports SEPA payments via Stripe. This plan adds card payment support following the same architecture. Card is already scaffolded in types and payment method config:

- `SUPPORTED_METHOD_IDS` includes `'card'`
- `StripePaymentMethod` includes `'card'`
- `payment-request-builder.ts` already routes `case 'stripe'` with `card` → `card` method name
- `derivePaymentMethods` will surface card when the stripe gateway config includes it

What's missing is the card form component, its context wiring, the type extensions, and the submit flow.

Reference implementations:

- `planet-donations/src/Donations/PaymentMethods/PaymentFunctions.ts` — working backend integration; same two-step flow (POST donation, PUT payment). Note: in planet-donations the donation is already created as a draft before the payment form is shown (two-screen flow); in fundraisers both steps happen on the same screen via `submitStandardPostpaidDonation`.
- `planet-donations/src/Donations/PaymentMethods/CardPayments.tsx` — UI reference: split Stripe elements (CardNumberElement, CardExpiryElement, CardCvcElement).
- `gofundnature/src/...` — UI only reference (5 fields); flow not implemented.
- `src/components/donate/stripe-sepa-form.tsx` — pattern to follow for the ref handle, state, validation, and element styling.

**Key architectural difference from SEPA — 3D Secure:** When the backend returns `action_required`, the `response.type` field determines what to do:

| `response.type` | Stripe call                                                         | Second PUT?                                                                               |
| --------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `'cardAction'`  | `stripe.handleCardAction(clientSecret)` → returns a `PaymentIntent` | Yes — sends `source: { id: pi_xxx, object: 'payment_intent' }` with **no `method` field** |
| `'cardPayment'` | `stripe.confirmCardPayment(clientSecret)`                           | No — show thank you directly                                                              |

SEPA `action_required` only needs `confirmSepaDebitPayment`, no second PUT.

**Card-specific billing fields:** The card form collects additional fields not present in the SEPA form:

- **Cardholder Name** — passed to Stripe as `billing_details.name`; owned by the form (not passed by the caller)
- **Billing address** — passed to Stripe as `billing_details.address`; needed for AVS (Address Verification System) which checks postal code and street number against card issuer records

By default, the form reuses the donor's address via a "Use billing address from my donor info" checkbox (checked by default). When unchecked, separate billing address fields (line1, line2, city, state, zip, country) are shown and validated. This keeps the card's billing address distinct from the donor's mailing address while avoiding double data entry in the common case.

Only `email` and `donorAddress` are passed in by the caller. The form resolves the final billing address from either source and sends `{ name, email, address: { line1, line2, city, state, postal_code, country } }` to Stripe.

**`<Elements>` provider:** Already in place in `donate-overlay.tsx`. No changes needed — `StripeCardForm` uses `useStripe()` / `useElements()` from the existing provider.

---

## Tasks

- [x] Update `src/lib/types/payment.ts` — extend `action_required` response type + add `StripeCardActionConfirmRequest`
- [x] Create `stripe-card-form.tsx` (split CardElement inputs + ref handle)
- [x] Add card translation keys to locales
- [x] Add `cardFormRef` to `DonationFormContext`
- [x] Wire `cardFormRef` in `donate-overlay.tsx` + pass to `useDonationSubmit`
- [x] Render `StripeCardForm` in `payment-methods.tsx` when card is selected
- [x] Implement card submit + 3DS flow in `use-donation-submit.ts`

---

## Implementation

### Task 1 — Extend `src/lib/types/payment.ts` ✓ done

`PaymentResponseActionRequired` refactored into a proper discriminated union on `response.type`. The two variants have different shapes:

- **`cardAction`** — 3DS for one-off card payments. Client calls `handleCardAction`, then re-submits payment server-side (second PUT).
- **`cardPayment`** — 3DS for **recurring donations**. The backend has already saved the payment method; it returns `payment_method: string` which the client must pass to `confirmCardPayment`. No second PUT.

```typescript
type PaymentResponseActionRequired =
  | {
      id: string;
      status: 'action_required';
      response: {
        type: 'cardAction';
        requires_action: true;
        payment_intent_client_secret: string;
        account: string;
      };
    }
  | {
      id: string;
      status: 'action_required';
      response: {
        type: 'cardPayment';
        requires_action: true;
        payment_intent_client_secret: string;
        account: string;
        payment_method: string;
      };
    };
```

`StripeCardActionConfirmRequest` added for the second PUT after `cardAction` (no `method` field, `object: 'payment_intent'`) and added to the `PaymentRequest` union:

```typescript
export interface StripeCardActionConfirmRequest {
  gateway: 'stripe';
  account: string;
  source: { id: string; object: 'payment_intent' };
}

export type PaymentRequest =
  | StripePaymentRequest
  | StripeCardActionConfirmRequest
  | PayPalPaymentRequest
  | OfflinePaymentRequest;
```

---

### Task 2a — Refactor `src/components/donate/address-country-selector.tsx`

Make the component reusable without changing its external interface for existing callers.

**Two changes only:**

1. **Unique IDs via `React.useId()`** — prevents `id`/`aria-controls` collisions when two instances render on the same page (donor address form + card billing address):

```typescript
const uid = useId();
const listboxId = `${uid}-listbox`;
// option ids: `${uid}-option-${countryOption.code}`
```

2. **Optional display-string props** — `label`, `placeholder`, `noResultsText` with defaults from the existing `Donate.userAddress` translations, so existing call sites need no changes:

```typescript
type AddressCountrySelectorProps = {
  country: string | undefined;
  onCountryChange: (code: string) => void;
  onCountryBlur: () => void;
  error?: string;
  label?: string;
  placeholder?: string;
  noResultsText?: string;
};
// Defaults inside component:
const resolvedLabel = label ?? tDonate('country.label');
const resolvedPlaceholder = placeholder ?? tDonate('country.selectCountry');
const resolvedNoResults = noResultsText ?? tDonate('country.noResults');
```

The card form passes `t('countryLabel')`, `t('countryPlaceholder')`, `t('countryNoResults')` from the `Donate.card` namespace.

---

### Task 2 — Create `src/components/donate/stripe-card-form.tsx`

New `'use client'` component. Mirrors `stripe-sepa-form.tsx`: `forwardRef<StripeCardFormHandle>` + `useImperativeHandle`.

**Handle interface:**

```typescript
export interface StripeCardFormHandle {
  createPaymentMethod(options: {
    email: string;
    donorAddress: {
      line1: string;
      city: string;
      state?: string;
      zipCode: string;
      country: string;
    };
  }): Promise<{ paymentMethodId: string } | { error: string }>;

  handleCardAction(
    clientSecret: string
  ): Promise<{ paymentIntentId: string } | { error: string }>;

  // paymentMethod required for cardPayment (recurring) — the backend returns the
  // saved pm_xxx that must be passed to stripe.confirmCardPayment
  confirmCardPayment(
    clientSecret: string,
    paymentMethod?: string
  ): Promise<{ error?: string }>;
}
```

**State:**

Stripe elements (complete flag + error string each):

- `cardNumberComplete`, `cardNumberError`
- `cardExpiryComplete`, `cardExpiryError`
- `cardCvcComplete`, `cardCvcError`

Text inputs (value + error):

- `cardholderName`, `cardholderNameError`

Billing address toggle + fields:

- `useDonorAddress: boolean` (default `true`) — checkbox state
- When `false`: `billingLine1`, `billingLine1Error`, `billingLine2` (optional), `billingCity`, `billingCityError`, `billingState` (optional), `billingZipCode`, `billingZipCodeError`, `billingCountry`, `billingCountryError`

**Element style options** — same hardcoded hex values as `stripe-sepa-form.tsx` (Stripe does not support `hsl()` or CSS custom properties):

```typescript
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: '#030712',
      '::placeholder': { color: '#6b7280' },
    },
    invalid: { color: '#dc2626' },
  },
};
```

**`createPaymentMethod` — validate, resolve billing address, then call Stripe:**

When `useDonorAddress` is true, billing address comes from `options.donorAddress`; when false, from the form's own billing fields. Validation of billing fields only runs when `useDonorAddress` is false.

```typescript
async createPaymentMethod({ email, donorAddress }) {
  let hasError = false;
  // Stripe element validation (unchanged) ...
  if (!cardholderName.trim()) { setCardholderNameError(...); hasError = true; }
  if (!useDonorAddress) {
    if (!billingLine1.trim()) { setBillingLine1Error(...); hasError = true; }
    if (!billingCity.trim()) { setBillingCityError(...); hasError = true; }
    if (!billingZipCode.trim()) { setbillingZipCodeError(...); hasError = true; }
    if (!billingCountry) { setBillingCountryError(...); hasError = true; }
  }
  if (hasError) return { error: 'Validation failed' };

  const billingAddress = useDonorAddress
    ? { line1: donorAddress.line1, city: donorAddress.city, state: donorAddress.state, postal_code: donorAddress.zipCode, country: donorAddress.country }
    : { line1: billingLine1.trim(), line2: billingLine2.trim() || undefined, city: billingCity.trim(), state: billingState.trim() || undefined, postal_code: billingZipCode.trim(), country: billingCountry };

  const { paymentMethod, error } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardNumberElement,
    billing_details: { name: cardholderName.trim(), email, address: billingAddress },
  });

  if (error) return { error: error.message ?? 'Payment method creation failed' };
  return { paymentMethodId: paymentMethod.id };
}
```

**UI layout:**

```
Card Number (full width)
Expiry | CVC (grid-cols-2)
Cardholder Name (full width)
☑ Use billing address from my donor info  (Checkbox)
[if unchecked]
  Address Line 1 (full width, required)
  Address Line 2 (full width, optional)
  City | State (grid-cols-2; State optional)
  Zip Code | Country (grid-cols-2; both required; Country uses AddressCountrySelector)
```

**Testable:** Check/uncheck the checkbox → billing fields appear/disappear. Submit with unchecked + empty fields → line1/city/zip/country errors surface. Submit with donor address checked → no billing field errors.

---

### Task 3 — Add card translation keys to locales

**`locales/en/donate.json`** — full `"card"` block:

```json
"card": {
  "cardNumberLabel": "Card Number",
  "cardNumberRequired": "Card number is required",
  "expiryLabel": "Expiry Date",
  "expiryRequired": "Expiry date is required",
  "cvcLabel": "CVC",
  "cvcRequired": "CVC is required",
  "cardholderNameLabel": "Cardholder Name",
  "cardholderNameRequired": "Cardholder name is required",
  "useDonorAddressLabel": "Use billing address from my donor info",
  "addressLine1Label": "Address Line 1",
  "addressLine1Required": "Address is required",
  "addressLine2Label": "Address Line 2",
  "cityLabel": "City",
  "cityRequired": "City is required",
  "stateLabel": "State / Province",
  "billingZipCodeLabel": "Zip / Postal Code",
  "billingZipCodeRequired": "Zip code is required",
  "countryLabel": "Country",
  "countryRequired": "Country is required",
  "countryPlaceholder": "Select country",
  "countryNoResults": "No countries found"
}
```

**`locales/de/donate.json`** — German equivalents:

```json
"card": {
  "cardNumberLabel": "Kartennummer",
  "cardNumberRequired": "Kartennummer ist erforderlich",
  "expiryLabel": "Ablaufdatum",
  "expiryRequired": "Ablaufdatum ist erforderlich",
  "cvcLabel": "CVC",
  "cvcRequired": "CVC ist erforderlich",
  "cardholderNameLabel": "Name des Karteninhabers",
  "cardholderNameRequired": "Name des Karteninhabers ist erforderlich",
  "useDonorAddressLabel": "Rechnungsadresse aus meinen Spenderdaten verwenden",
  "addressLine1Label": "Adresszeile 1",
  "addressLine1Required": "Adresse ist erforderlich",
  "addressLine2Label": "Adresszeile 2",
  "cityLabel": "Stadt",
  "cityRequired": "Stadt ist erforderlich",
  "stateLabel": "Bundesland / Kanton",
  "billingZipCodeLabel": "PLZ",
  "billingZipCodeRequired": "Postleitzahl ist erforderlich",
  "countryLabel": "Land",
  "countryRequired": "Land ist erforderlich",
  "countryPlaceholder": "Land auswählen",
  "countryNoResults": "Keine Länder gefunden"
}
```

**Testable:** No missing-key warnings in console. Card field labels visible in UI. Switch to `de` → German labels appear.

---

### Task 4 — Add `cardFormRef` to `DonationFormContext`

**File:** `src/components/donate/donation-form-context.tsx`

1. Import `StripeCardFormHandle` from `./stripe-card-form`
2. Add `cardFormRef: React.RefObject<StripeCardFormHandle | null>` to `DonationFormContextValue`
3. Add `cardFormRef` to `DonationFormProviderProps`
4. Pass `cardFormRef` into `<DonationFormContext.Provider value={...}>`

**Testable:** `useDonationForm()` returns `cardFormRef`. TypeScript compiles.

---

### Task 5 — Wire `cardFormRef` in `donate-overlay.tsx`

**File:** `src/components/donate/donate-overlay.tsx`

In `DonateOverlayInner`:

1. Import `StripeCardFormHandle` from `./stripe-card-form`
2. Add `const cardFormRef = useRef<StripeCardFormHandle>(null)`
3. Pass `cardFormRef` to `<DonationFormProvider>`
4. Pass `cardFormRef` as 5th argument to `useDonationSubmit`:

```typescript
const {
  onSubmit,
  donationState,
  reset,
  onPayPalCreateOrder,
  onPayPalApproved,
  onPayPalError,
} = useDonationSubmit(
  donationData,
  fundraiser,
  paymentOptions,
  sepaFormRef,
  cardFormRef
);
```

**Testable:** Overlay opens without console errors.

---

### Task 6 — Render `StripeCardForm` in `payment-methods.tsx`

**File:** `src/components/donate/payment-methods.tsx`

1. Import `StripeCardForm` from `./stripe-card-form`
2. Destructure `cardFormRef` from `useDonationForm()`
3. Add conditional render below the existing SEPA conditional:

```tsx
{
  selectedPaymentMethod === 'card' && <StripeCardForm ref={cardFormRef} />;
}
```

No validity gating on the CTA — incomplete card fields are caught inside `createPaymentMethod`.

**Testable:** Select Card in the payment method dropdown → three card inputs appear. Switch to another method → card form disappears.

---

### Task 7 — Implement card submit + 3DS flow in `use-donation-submit.ts`

**File:** `src/components/donate/use-donation-submit.ts`

1. Import `StripeCardFormHandle` from `./stripe-card-form`
2. Import `StripeCardActionConfirmRequest` from `@/lib/types/payment`
3. Add `cardFormRef: RefObject<StripeCardFormHandle | null>` as 5th parameter
4. Add both `sepaFormRef` and `cardFormRef` to the `onSubmit` `useCallback` deps — the `react-hooks/exhaustive-deps` rule requires it; ref objects are stable so this does not cause extra re-renders

**In `onSubmit`, add the card block after the SEPA block:**

```typescript
if (values.selectedPaymentMethod === 'card') {
  const donor = formData.type === 'guest' ? formData.donor : null;
  const selectedAddress =
    donorProfile?.addresses.find(a => a.id === values.selectedAddressId) ??
    donorProfile?.address;
  const cardResult = await cardFormRef.current?.createPaymentMethod({
    email: donor?.email ?? donorProfile?.email ?? '',
    donorAddress: {
      line1: donor?.address ?? selectedAddress?.address ?? '',
      city: donor?.city ?? selectedAddress?.city ?? '',
      state: donor?.state ?? selectedAddress?.state ?? undefined,
      zipCode: donor?.zipCode ?? selectedAddress?.zipCode ?? '',
      country:
        donor?.country ??
        selectedAddress?.country ??
        donorProfile?.country ??
        '',
    },
  });

  if (!cardResult || 'error' in cardResult) {
    setDonationState(prev => ({
      ...prev,
      isLoading: false,
      error: { code: 'paymentFailed' },
    }));
    return; // submittingRef.current reset by finally
  }

  paymentDetails = { paymentMethodId: cardResult.paymentMethodId };
}
```

**In the `action_required` block, add card 3DS handling after the SEPA block, branching on `response.type`:**

```typescript
if (
  paymentResponse.status === 'action_required' &&
  values.selectedPaymentMethod === 'card'
) {
  if (paymentResponse.response.type === 'cardAction') {
    // handleCardAction → second PUT with payment_intent source (no method field)
    const handleResult = (await cardFormRef.current?.handleCardAction(
      paymentResponse.response.payment_intent_client_secret
    )) ?? { error: 'No card form available' };

    if ('error' in handleResult) {
      setDonationState(prev => ({
        ...prev,
        isLoading: false,
        error: { code: 'paymentFailed' },
      }));
      return;
    }

    // Second PUT — same donationId, same idempotency key (not rotated — per existing comment)
    const confirmRequest: StripeCardActionConfirmRequest = {
      gateway: 'stripe',
      account: paymentResponse.response.account,
      source: {
        id: handleResult.paymentIntentId,
        object: 'payment_intent',
      },
    };
    const finalResponse = await paymentService.processPayment(
      donationResponse.donationId,
      confirmRequest,
      token || undefined,
      paymentKeyRef.current
    );

    if (finalResponse.status === 'failed') {
      setDonationState(prev => ({
        ...prev,
        isLoading: false,
        error: { code: 'paymentFailed' },
      }));
      return;
    }

    setDonationState(prev => ({
      ...prev,
      isLoading: false,
      thankYouState: {
        status: 'completed',
        donationId: donationResponse.donationId,
      },
    }));
    return;
  }

  if (paymentResponse.response.type === 'cardPayment') {
    // confirmCardPayment — recurring donation; no second PUT; show thank you directly
    const confirmResult = (await cardFormRef.current?.confirmCardPayment(
      paymentResponse.response.payment_intent_client_secret,
      paymentResponse.response.payment_method
    )) ?? { error: 'No card form available' };

    if (confirmResult.error) {
      setDonationState(prev => ({
        ...prev,
        isLoading: false,
        error: { code: 'paymentFailed' },
      }));
      return;
    }

    setDonationState(prev => ({
      ...prev,
      isLoading: false,
      thankYouState: {
        status: 'completed',
        donationId: donationResponse.donationId,
      },
    }));
    return;
  }
}
```

**Testable:** Select Card, enter test card `4242424242424242`, fill donor info, click Donate → API calls fire, thank-you screen appears. Enter declined card `4000000000000002` → error banner shown. Enter 3DS card `4000000000003220` → Stripe 3DS modal appears; after completing authentication, thank-you screen appears.

---

## Files to create/modify

| File                                                 | Action                                                                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/types/payment.ts`                           | Modify — add `'cardPayment'` to `action_required` response type; add `StripeCardActionConfirmRequest` to `PaymentRequest` union |
| `src/components/donate/address-country-selector.tsx` | Modify — add optional `label`/`placeholder`/`noResultsText` props; use `React.useId()` for unique element IDs                   |
| `src/components/donate/stripe-card-form.tsx`         | Create — split CardElement inputs, cardholder name, billing address toggle + full address fields, `StripeCardFormHandle` ref    |
| `locales/en/donate.json`                             | Modify — add `Donate.card.*` keys                                                                                               |
| `locales/de/donate.json`                             | Modify — add `Donate.card.*` keys (German)                                                                                      |
| `src/components/donate/donation-form-context.tsx`    | Modify — add `cardFormRef` to context                                                                                           |
| `src/components/donate/donate-overlay.tsx`           | Modify — create `cardFormRef`, pass to provider and hook                                                                        |
| `src/components/donate/payment-methods.tsx`          | Modify — render `<StripeCardForm>` when card selected                                                                           |
| `src/components/donate/use-donation-submit.ts`       | Modify — add `cardFormRef`, card submit + 3DS branching flow                                                                    |

**Unchanged:**

- `src/lib/utils/payment-request-builder.ts` — `case 'stripe'` already handles card
- `src/lib/types/payment-methods.ts` — `SUPPORTED_METHOD_IDS` already includes `'card'`
- `src/lib/api/payment-service.ts` — `processPayment` accepts `PaymentRequest`; no changes needed

---

## Verification

1. Select Card → three Stripe element fields, Cardholder Name, and the billing address checkbox appear
2. Checkbox checked by default; uncheck → Line 1, Line 2, City, State, Zip, Country fields appear; re-check → they disappear
3. Two country selectors on the same page (donor address + card billing) → no duplicate `id` or `aria-controls` attributes in the DOM
4. Click Donate with all fields empty → card element errors, cardholder name error, and (if unchecked) billing address errors all surface simultaneously
5. Enter test card `4242424242424242`, valid expiry, valid CVC, fill cardholder name, leave checkbox checked, fill donor info → success screen
6. Uncheck checkbox, fill billing address fields with a different address → success screen; Stripe receives the billing address from the card form, not the donor address
7. Enter declined card `4000000000000002` → error banner shown
8. Enter 3DS card `4000000000003220` (`cardAction` path) → Stripe 3DS modal → second PUT → success screen
9. Switch locale to `de` → all card labels and errors appear in German
10. `npm run build` completes without TypeScript errors
