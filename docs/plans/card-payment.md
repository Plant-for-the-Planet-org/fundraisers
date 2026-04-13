# Card Payment Implementation Plan

## Context

The fundraisers project already supports SEPA payments via Stripe. This plan adds card payment support following the same architecture. Card is already scaffolded in types and payment method config:

- `SUPPORTED_METHOD_IDS` includes `'card'`
- `StripePaymentMethod` includes `'card'`
- `payment-request-builder.ts` already routes `case 'stripe'` with `card` → `card` method name
- `derivePaymentMethods` will surface card when the stripe gateway config includes it

What's missing is the card form component, its context wiring, the type extensions, and the submit flow.

Reference implementations:

- `planet-donations/src/Donations/PaymentMethods/PaymentFunctions.ts` — working backend integration; same two-step flow (POST donation, PUT payment). Note: in planet-donations the donation is already created as a draft before the payment form is shown (two-screen flow); in fundraisers both steps happen on the same screen via `submitStandardDonation`.
- `planet-donations/src/Donations/PaymentMethods/CardPayments.tsx` — UI reference: split Stripe elements (CardNumberElement, CardExpiryElement, CardCvcElement).
- `gofundnature/src/...` — UI only reference (5 fields); flow not implemented.
- `src/components/donate/stripe-sepa-form.tsx` — pattern to follow for the ref handle, state, validation, and element styling.

**Key architectural difference from SEPA — 3D Secure:** When the backend returns `action_required`, the `response.type` field determines what to do:

| `response.type` | Stripe call | Second PUT? |
|---|---|---|
| `'cardAction'` | `stripe.handleCardAction(clientSecret)` → returns a `PaymentIntent` | Yes — sends `source: { id: pi_xxx, object: 'payment_intent' }` with **no `method` field** |
| `'cardPayment'` | `stripe.confirmCardPayment(clientSecret)` | No — show thank you directly |

SEPA `action_required` only needs `confirmSepaDebitPayment`, no second PUT.

**Design choice — no separate Cardholder Name field:** Card billing name is not used for authorization (unlike SEPA where bank rejection risk is real). Billing details (including name) are passed to `createPaymentMethod` by the caller from donor info already entered.

**`<Elements>` provider:** Already in place in `donate-overlay.tsx`. No changes needed — `StripeCardForm` uses `useStripe()` / `useElements()` from the existing provider.

---

## Tasks

- [x] Update `src/lib/types/payment.ts` — extend `action_required` response type + add `StripeCardActionConfirmRequest`
- [x] Create `stripe-card-form.tsx` (split CardElement inputs + ref handle)
- [x] Add card translation keys to locales
- [x] Add `cardFormRef` to `DonationFormContext`
- [x] Wire `cardFormRef` in `donate-overlay.tsx` + pass to `useDonationSubmit`
- [x] Render `StripeCardForm` in `payment-methods.tsx` when card is selected
- [ ] Implement card submit + 3DS flow in `use-donation-submit.ts`

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

### Task 2 — Create `src/components/donate/stripe-card-form.tsx`

New `'use client'` component. Mirrors `stripe-sepa-form.tsx`: `forwardRef<StripeCardFormHandle>` + `useImperativeHandle`.

**Handle interface — two Stripe methods matching the two `action_required` subtypes:**
```typescript
export interface StripeCardFormHandle {
  createPaymentMethod(billingDetails: {
    name: string;
    email: string;
    address: { line1: string; city: string; postal_code: string; country: string };
  }): Promise<{ paymentMethodId: string } | { error: string }>;

  handleCardAction(clientSecret: string): Promise<{ paymentIntentId: string } | { error: string }>;

  // paymentMethod required for cardPayment (recurring) — the backend returns the
  // saved pm_xxx that must be passed to stripe.confirmCardPayment
  confirmCardPayment(clientSecret: string, paymentMethod?: string): Promise<{ error?: string }>;
}
```

**State — one complete flag and one error string per element:**
- `cardNumberComplete`, `cardNumberError`
- `cardExpiryComplete`, `cardExpiryError`
- `cardCvcComplete`, `cardCvcError`

Each element's `onChange` sets its completion boolean and error string (same pattern as `IbanElement` in SEPA form).

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

**`createPaymentMethod` — validate all three fields first, then call Stripe:**
```typescript
async createPaymentMethod(billingDetails) {
  let hasError = false;
  if (!cardNumberComplete) {
    if (!cardNumberError) setCardNumberError(t('cardNumberRequired'));
    hasError = true;
  }
  if (!cardExpiryComplete) {
    if (!cardExpiryError) setCardExpiryError(t('expiryRequired'));
    hasError = true;
  }
  if (!cardCvcComplete) {
    if (!cardCvcError) setCardCvcError(t('cvcRequired'));
    hasError = true;
  }
  if (hasError) return { error: 'Validation failed' };

  if (!stripe || !elements) return { error: 'Stripe not initialized' };
  const cardNumberElement = elements.getElement(CardNumberElement);
  if (!cardNumberElement) return { error: 'Card element not found' };

  const { paymentMethod, error } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardNumberElement,
    billing_details: billingDetails,
  });

  if (error) return { error: error.message ?? 'Payment method creation failed' };
  return { paymentMethodId: paymentMethod.id };
}
```

**`handleCardAction` — for `cardAction` response type (second PUT required):**
```typescript
async handleCardAction(clientSecret) {
  if (!stripe) return { error: 'Stripe not initialized' };
  const { paymentIntent, error } = await stripe.handleCardAction(clientSecret);
  if (error) return { error: error.message ?? 'Card action failed' };
  return { paymentIntentId: paymentIntent.id };
}
```

**`confirmCardPayment` — for `cardPayment` response type (recurring; no second PUT):**
```typescript
async confirmCardPayment(clientSecret, paymentMethod) {
  if (!stripe) return { error: 'Stripe not initialized' };
  const { error } = await stripe.confirmCardPayment(
    clientSecret,
    paymentMethod ? { payment_method: paymentMethod } : undefined
  );
  return { error: error?.message };
}
```

**UI layout — CardNumberElement full width, CardExpiryElement + CardCvcElement in a 2-column grid:**
```tsx
<div className='space-y-4'>
  <FormField label={t('cardNumberLabel')} error={cardNumberError ?? undefined}>
    <div className='border border-border rounded-lg p-3'>
      <CardNumberElement options={CARD_ELEMENT_OPTIONS} onChange={handleCardNumberChange} />
    </div>
  </FormField>

  <div className='grid grid-cols-2 gap-3'>
    <FormField label={t('expiryLabel')} error={cardExpiryError ?? undefined}>
      <div className='border border-border rounded-lg p-3'>
        <CardExpiryElement options={CARD_ELEMENT_OPTIONS} onChange={handleCardExpiryChange} />
      </div>
    </FormField>
    <FormField label={t('cvcLabel')} error={cardCvcError ?? undefined}>
      <div className='border border-border rounded-lg p-3'>
        <CardCvcElement options={CARD_ELEMENT_OPTIONS} onChange={handleCardCvcChange} />
      </div>
    </FormField>
  </div>
</div>
```

**Testable:** Render inside a test `<Elements>` wrapper → three card inputs appear. Click Donate without filling any → all three error messages surface simultaneously. Enter test card `4242424242424242`, valid expiry, valid CVC → no errors. Call `createPaymentMethod` with billing details → returns `{ paymentMethodId: 'pm_...' }`.

---

### Task 3 — Add card translation keys to locales

**`locales/en/donate.json`** — add `"card"` block inside `"Donate"` (alongside the existing `"sepa"` block):
```json
"card": {
  "cardNumberLabel": "Card Number",
  "cardNumberRequired": "Card number is required",
  "expiryLabel": "Expiry Date",
  "expiryRequired": "Expiry date is required",
  "cvcLabel": "CVC",
  "cvcRequired": "CVC is required"
}
```

**`locales/de/donate.json`** — add German equivalents:
```json
"card": {
  "cardNumberLabel": "Kartennummer",
  "cardNumberRequired": "Kartennummer ist erforderlich",
  "expiryLabel": "Ablaufdatum",
  "expiryRequired": "Ablaufdatum ist erforderlich",
  "cvcLabel": "CVC",
  "cvcRequired": "CVC ist erforderlich"
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
const { onSubmit, donationState, reset, onPayPalCreateOrder, onPayPalApproved, onPayPalError } =
  useDonationSubmit(donationData, fundraiser, paymentOptions, sepaFormRef, cardFormRef);
```

**Testable:** Overlay opens without console errors.

---

### Task 6 — Render `StripeCardForm` in `payment-methods.tsx`

**File:** `src/components/donate/payment-methods.tsx`

1. Import `StripeCardForm` from `./stripe-card-form`
2. Destructure `cardFormRef` from `useDonationForm()`
3. Add conditional render below the existing SEPA conditional:

```tsx
{selectedPaymentMethod === 'card' && (
  <StripeCardForm ref={cardFormRef} />
)}
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

**In `onSubmit`, declare `cardPaymentMethodId` at the same scope as `paymentDetails`, then add the card block after the SEPA block:**

```typescript
let cardPaymentMethodId: string | undefined;

if (values.selectedPaymentMethod === 'card') {
  const donor = formData.type === 'guest' ? formData.donor : null;
  const selectedAddress =
    donorProfile?.addresses.find(a => a.id === values.selectedAddressId) ??
    donorProfile?.address;
  const cardResult = await cardFormRef.current?.createPaymentMethod({
    name: donor
      ? `${donor.firstname} ${donor.lastname}`
      : `${donorProfile?.firstname ?? ''} ${donorProfile?.lastname ?? ''}`.trim(),
    email: donor?.email ?? donorProfile?.email ?? '',
    address: {
      line1: donor?.address ?? selectedAddress?.address ?? '',
      city: donor?.city ?? selectedAddress?.city ?? '',
      postal_code: donor?.zipCode ?? selectedAddress?.zipCode ?? '',
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

  cardPaymentMethodId = cardResult.paymentMethodId;
  paymentDetails = { paymentMethodId: cardPaymentMethodId };
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
    const handleResult =
      (await cardFormRef.current?.handleCardAction(
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
      thankYouState: { status: 'completed', donationId: donationResponse.donationId },
    }));
    return;
  }

  if (paymentResponse.response.type === 'cardPayment') {
    // confirmCardPayment — recurring donation; no second PUT; show thank you directly
    const confirmResult =
      (await cardFormRef.current?.confirmCardPayment(
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
      thankYouState: { status: 'completed', donationId: donationResponse.donationId },
    }));
    return;
  }
}
```

**Testable:** Select Card, enter test card `4242424242424242`, fill donor info, click Donate → API calls fire, thank-you screen appears. Enter declined card `4000000000000002` → error banner shown. Enter 3DS card `4000000000003220` → Stripe 3DS modal appears; after completing authentication, thank-you screen appears.

---

## Files to create/modify

| File | Action |
|------|--------|
| `src/lib/types/payment.ts` | Modify — add `'cardPayment'` to `action_required` response type; add `StripeCardActionConfirmRequest` to `PaymentRequest` union |
| `src/components/donate/stripe-card-form.tsx` | Create — split CardElement inputs + `StripeCardFormHandle` ref |
| `locales/en/donate.json` | Modify — add `Donate.card.*` keys |
| `locales/de/donate.json` | Modify — add `Donate.card.*` keys (German) |
| `src/components/donate/donation-form-context.tsx` | Modify — add `cardFormRef` to context |
| `src/components/donate/donate-overlay.tsx` | Modify — create `cardFormRef`, pass to provider and hook |
| `src/components/donate/payment-methods.tsx` | Modify — render `<StripeCardForm>` when card selected |
| `src/components/donate/use-donation-submit.ts` | Modify — add `cardFormRef`, card submit + 3DS branching flow |

**Unchanged:**
- `src/lib/utils/payment-request-builder.ts` — `case 'stripe'` already handles card
- `src/lib/types/payment-methods.ts` — `SUPPORTED_METHOD_IDS` already includes `'card'`
- `src/lib/api/payment-service.ts` — `processPayment` accepts `PaymentRequest`; no changes needed

---

## Verification

1. Select Card in the payment method dropdown → CardNumberElement, CardExpiryElement, CardCvcElement appear in the expected layout
2. Click Donate without filling card fields → all three error messages surface simultaneously
3. Enter test card `4242424242424242`, valid expiry, valid CVC, fill donor info, click Donate → success screen
4. Enter declined card `4000000000000002` → error banner shown in overlay
5. Enter 3DS card `4000000000003220` (`cardAction` path) → Stripe 3DS modal appears; complete authentication → second PUT fires → success screen
6. Switch locale to `de` → all card labels and errors appear in German
7. `npm run build` completes without TypeScript errors
