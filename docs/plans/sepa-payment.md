# SEPA Payment Implementation Plan

## Context

The fundraisers project has SEPA Direct Debit scaffolded in types, fee config, and payment method UI, but the actual Stripe integration does not exist yet. The goal is to implement the full flow so donors can pay via SEPA when it is available in `paymentOptions`.

The backend uses a standard two-step flow (same as offline):

1. `POST /app/donations` — creates donation record, returns `donationId`
2. `PUT /app/donations/{donationId}` — processes payment using a Stripe `payment_method` id

SEPA is synchronous from the frontend perspective: `stripe.createPaymentMethod()` returns a `pm_xxx` id, which is sent directly to the backend. The backend handles debit initiation and may (rarely) return `action_required` for SCA.

Reference implementations:

- `planet-donations/src/Donations/PaymentMethods/SepaPayments.tsx` — identical backend, already working. Note: its `billing_details.name` uses only `firstname` — this is a confirmed bug (Stripe requires 2–100 characters; a single initial will be rejected). Use full name `${firstname} ${lastname}`.
- `docs/stripe-paypal-implementation.md` — existing design notes for this project
- `gofundnature/docs/payment/sepa.md` + `stripe-frontend-implementation.md` — API spec and Stripe element details

**Key architectural note:** The `IbanElement` (Stripe's hosted IBAN input) must live inside a Stripe `<Elements>` provider. The `<Elements>` provider is placed in `DonateOverlayInner` (wrapping the portal), shared by all Stripe-based payment methods (SEPA, card, Apple Pay, Google Pay). Considered placing `<Elements>` only around `<StripeSepaForm>` in `PaymentMethods` but rejected: card also uses Stripe, and mounting/unmounting `<Elements>` on every method switch is wasteful. `StripeSepaForm` uses `useStripe()` and `useElements()` internally and exposes `createPaymentMethod()` and `confirmSepaDebitPayment()` via a ref, so `use-donation-submit.ts` never needs to call `useStripe()` itself.

`loadStripe` only receives the publishable key — no `stripeAccount` option needed (confirmed: account travels in the `paymentRequest` body only).

**`getStripe` utility:** `loadStripe` should not be called inside `useMemo` — it should be called once per key+locale pair and cached. A dedicated `src/lib/utils/get-stripe.ts` (mirroring `planet-donations/src/Utils/stripe/getStripe.tsx`) holds a `Map<string, Promise<Stripe | null>>` keyed on `${publishableKey}-${locale}`. This also removes failed loads from the cache so they can be retried. Locale is passed to `loadStripe` directly (`loadStripe(key, { locale })`) rather than via `<Elements options={{ locale }}>` — the Stripe instance carries the locale so `<Elements>` needs no options.

---

## Tasks

- [x] Install `@stripe/stripe-js` and `@stripe/react-stripe-js`
- [x] Fix `StripePaymentSource` type — remove `kind` field
- [x] Install `@stripe/stripe-js` and `@stripe/react-stripe-js`
- [x] Fix `StripePaymentSource` type — remove `kind` field
- [x] Create `stripe-sepa-form.tsx` (IbanElement + mandate text + ref handle)
- [x] Add SEPA translation keys to locales
- [x] Add `sepaFormRef` to `DonationFormContext`
- [x] Create `src/lib/utils/get-stripe.ts` (cached `loadStripe` utility)
- [x] Wire `<Elements>` provider into `donate-overlay.tsx` + create `sepaFormRef`
- [x] Render `StripeSepaForm` in `payment-methods.tsx` when sepa-debit is selected
- [x] Expand `stripe-sepa-form.tsx` — Account Holder Name field + mandate consent checkbox
- [x] Expand SEPA translation keys — mandate section text, account holder fields, validation messages
- [x] Implement `case 'stripe'` in `payment-request-builder.ts`
- [x] Implement SEPA submit flow in `use-donation-submit.ts`

---

## Implementation

### Task 1 — Install dependencies

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

Provides: `loadStripe`, `<Elements>`, `<IbanElement>`, `useStripe()`, `useElements()`.

**Testable:** TypeScript compiles. `import { loadStripe } from '@stripe/stripe-js'` resolves.

---

### Task 2 — Fix `StripePaymentSource` in `src/lib/types/payment.ts`

The existing type has a `kind: 'stripe'` field that was added as a TypeScript discriminant but is not part of the API request (the outer `gateway: 'stripe'` discriminates the union). Remove it:

```typescript
// Before:
export interface StripePaymentSource {
  kind: 'stripe'; // TODO: confirm request type, is "kind" a valid property?
  id: string;
  object: 'payment_method';
}

// After:
export interface StripePaymentSource {
  id: string;
  object: 'payment_method';
}
```

**Testable:** TypeScript compiles. Grep for `kind: 'stripe'` — no remaining usage.

---

### Task 3 — Create `src/components/donate/stripe-sepa-form.tsx`

New `'use client'` component. Renders the IBAN input and mandate text. Exposes a ref handle so `use-donation-submit.ts` can call `createPaymentMethod()` and `confirmSepaDebitPayment()` at submit time.

```
'use client'

export interface StripeSepaFormHandle {
  createPaymentMethod(billingDetails: {
    name: string;
    email: string;
    address: { line1: string; city: string; postal_code: string; country: string };
  }): Promise<{ paymentMethodId: string } | { error: string }>;

  confirmSepaDebitPayment(clientSecret: string): Promise<{ error?: string }>;
}
```

Implementation notes:

- `forwardRef<StripeSepaFormHandle, {}>` — no props needed (billing details are passed at call time)
- `useStripe()` + `useElements()` (requires being inside `<Elements>` context)
- `useImperativeHandle` exposes both methods
- `IbanElement` options: `{ supportedCountries: ['SEPA'] }` with style matched to the existing form field style (see existing `form-field.tsx` for border/color tokens)
- Track `ibanError: string | null` from the `IbanElement` `onChange` event — display below the element
- Mandate text rendered as small muted text below the IBAN input, using translation key `Donate.sepa.mandate`

`createPaymentMethod`:

```typescript
async createPaymentMethod(billingDetails) {
  if (!stripe || !elements) return { error: 'Stripe not initialized' };
  const ibanElement = elements.getElement(IbanElement);
  if (!ibanElement) return { error: 'IBAN element not found' };

  const { paymentMethod, error } = await stripe.createPaymentMethod({
    type: 'sepa_debit',
    sepa_debit: ibanElement,
    billing_details: billingDetails,
  });

  if (error) return { error: error.message ?? 'Payment method creation failed' };
  return { paymentMethodId: paymentMethod.id };
}
```

`confirmSepaDebitPayment`:

```typescript
async confirmSepaDebitPayment(clientSecret) {
  if (!stripe) return { error: 'Stripe not initialized' };
  const { error } = await stripe.confirmSepaDebitPayment(clientSecret);
  return { error: error?.message };
}
```

**Testable:** Render the component inside a test `<Elements>` wrapper → IBAN input appears. Enter an invalid IBAN → error message shown. Enter the test IBAN `DE89370400440532013000` → no error.

---

### Task 3b — Expand `stripe-sepa-form.tsx` with Account Holder Name and mandate consent

Confirmed requirements:

1. **Account Holder Name** — plain text input, empty by default (no prepopulation). The user must type the name intentionally — prepopulating risks the user skipping review, which can cause bank rejections if the name doesn't match the account holder. Required: if empty when `createPaymentMethod` is called, show an inline error and return `{ error }` to block submission.

2. **Mandate consent checkbox** — must be checked before submission. If unchecked when `createPaymentMethod` is called, show an inline error and return `{ error }`.

3. **Mandate section UI** — bordered section with creditor info grid (Creditor name + Creditor ID) and rights text, following the structure used in gofundnature.

4. **`billing_details.name`** — `createPaymentMethod` uses the internal `accountHolderName` value, not the `name` in the `billingDetails` argument from the caller. This keeps Task 9 unchanged — the caller still passes `firstname + lastname`; the form overrides it with its own value.

**Creditor ID:**

```typescript
// TODO: make creditor ID dynamic (source TBD)
const CREDITOR_ID = 'DE98ZZZ09999999999';
```

**Testable:** Click Donate with SEPA selected but no name and mandate unchecked → both inline errors appear. Fill name and check mandate → errors clear. Submit with valid IBAN and both fields satisfied → proceeds to API call.

---

### Task 4 — Add SEPA translation keys to locales

Add to `locales/en/donate.json` under `Donate`:

```json
"sepa": {
  "ibanLabel": "IBAN",
  "mandate": "By providing your IBAN and confirming this payment, you authorise Plant-for-the-Planet Foundation to send instructions to your bank to debit your account, and your bank to debit your account in accordance with those instructions. You are entitled to a refund from your bank under the terms and conditions of your agreement with your bank. A refund must be claimed within 8 weeks starting from the date on which your account was debited."
}
```

Add corresponding German translation to `locales/de/donate.json`.

**Testable:** No missing-key warnings in console. Mandate text visible in UI when SEPA is selected.

---

### Task 4b — Expand SEPA translation keys

Replace the existing `sepa` block in both locale files with the full set of keys required by Task 3b.

`locales/en/donate.json`:

```json
"sepa": {
  "ibanLabel": "IBAN",
  "accountHolderName": "Account Holder Name",
  "accountHolderNameRequired": "Account holder name is required",
  "mandateTitle": "SEPA Direct Debit Mandate",
  "mandateIntro": "By signing this mandate form, you authorize Plant-for-the-Planet Foundation to send instructions to your bank to debit your account and your bank to debit your account in accordance with the instructions from Plant-for-the-Planet Foundation.",
  "creditor": "Creditor",
  "creditorName": "Plant-for-the-Planet Foundation",
  "creditorId": "Creditor ID",
  "mandateRights": "Your rights: You are entitled to a refund from your bank under the terms and conditions of your agreement with your bank. A refund must be claimed within 8 weeks starting from the date on which your account was debited.",
  "mandateConsent": "I agree to the SEPA Direct Debit mandate and authorize the debit of my account",
  "mandateRequired": "You must accept the SEPA Direct Debit mandate to continue"
}
```

Add corresponding German translation to `locales/de/donate.json`.

**Testable:** Switch locale to `de` → all mandate text, labels, and errors appear in German. No missing-key warnings in console.

---

### Task 5 — Add `sepaFormRef` to `DonationFormContext` in `src/components/donate/donation-form-context.tsx`

Add to `DonationFormContextValue`:

```typescript
sepaFormRef: React.RefObject<StripeSepaFormHandle | null>;
```

Add `sepaFormRef` to `DonationFormProviderProps` and include it in the context value passed to `<DonationFormContext.Provider>`.

This lets `PaymentMethods` (and any other child) receive the ref from context without prop drilling.

**Testable:** `useDonationForm()` returns `sepaFormRef`. TypeScript compiles.

---

### Task 6a — Create `src/lib/utils/get-stripe.ts`

Mirrors `planet-donations/src/Utils/stripe/getStripe.tsx`. Caches `loadStripe` promises by `${publishableKey}-${locale}`, removes failed entries so they can be retried.

```typescript
import type { Stripe, StripeElementLocale } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromiseCache = new Map<string, Promise<Stripe | null>>();

export function getStripe(
  publishableKey: string,
  locale: string
): Promise<Stripe | null> {
  const cacheKey = `${publishableKey}-${locale}`;
  const cached = stripePromiseCache.get(cacheKey);
  if (cached) return cached;

  const promise = loadStripe(publishableKey, {
    locale: locale as StripeElementLocale,
  }).catch(error => {
    stripePromiseCache.delete(cacheKey);
    throw error;
  });

  stripePromiseCache.set(cacheKey, promise);
  return promise;
}
```

---

### Task 6b — Wire `<Elements>` into `src/components/donate/donate-overlay.tsx`

In `DonateOverlayInner`:

1. Import `Elements` from `@stripe/react-stripe-js` and `getStripe` from `@/lib/utils/get-stripe`
2. Create `sepaFormRef = useRef<StripeSepaFormHandle>(null)` — the ref that `StripeSepaForm` will attach to
3. Call `getStripe` directly (no `useMemo` — caching is handled inside `getStripe`):

```typescript
const locale = useLocale();
const stripeConfig = paymentOptions.gateways.stripe;
const stripePromise = stripeConfig
  ? getStripe(stripeConfig.authorization.stripePublishableKey, locale)
  : null;
```

4. Wrap the portal content with `<Elements stripe={stripePromise}>` (outside `DonationFormProvider`, no `options` needed — locale is embedded in the Stripe instance):

```tsx
return createPortal(
  <Elements stripe={stripePromise}>
    <DonationFormProvider
      ...
      sepaFormRef={sepaFormRef}
    >
      <DonateOverlayLayout ... />
    </DonationFormProvider>
  </Elements>,
  document.body
);
```

**Testable:** Overlay opens without console errors. Stripe Elements context is available (no `useStripe` out-of-context errors when the SEPA form renders). Switching locale → IbanElement validation errors appear in the correct language.

---

### Task 7 — Render `StripeSepaForm` in `src/components/donate/payment-methods.tsx` when sepa-debit is selected

After the existing payment method selector, add a conditional that renders the SEPA form when `sepa-debit` is selected:

```tsx
const { sepaFormRef } = useDonationForm();

{
  selectedPaymentMethod === 'sepa_debit' && (
    <StripeSepaForm ref={sepaFormRef} />
  );
}
```

Import `StripeSepaForm` and `StripeSepaFormHandle` from `./stripe-sepa-form`.

No validity gating on the CTA button — if the IBAN is invalid or incomplete, `stripe.createPaymentMethod()` will fail and the error will surface inline in `StripeSepaForm`.

**Testable:** Select SEPA Direct Debit in the payment method dropdown → IbanElement and mandate text appear below the selector. Switch to another method → SEPA form disappears.

---

### Task 8 — Implement `case 'stripe'` in `src/lib/utils/payment-request-builder.ts`

Replace the `case 'stripe'` throw with:

```typescript
case 'stripe': {
  const id = paymentDetails.paymentMethodId || paymentDetails.sourceId;
  if (!id) {
    throw new PaymentOptionsError(
      'Missing payment method ID for Stripe payment',
      'MISSING_PAYMENT_METHOD_ID',
      400
    );
  }
  return {
    gateway: 'stripe',
    account,
    method: paymentMethod as StripePaymentMethod,
    source: { id: String(id), object: 'payment_method' },
  };
}
```

Note: internal `PaymentMethod` ids are snake_case and align with `StripePaymentMethod`, so no remapping is needed — only a cast.

**Testable:** Call `buildPaymentRequest` with mock `PaymentData` for `sepa-debit` and a `paymentMethodId` — assert the returned object matches the expected `StripePaymentRequest` shape.

---

### Task 9 — Implement SEPA submit flow in `src/components/donate/use-donation-submit.ts`

Add `sepaFormRef: React.RefObject<StripeSepaFormHandle | null>` as a fourth parameter to `useDonationSubmit`.

In `onSubmit`, before calling `submitStandardPostpaidDonation`, add SEPA-specific payment method creation:

```typescript
// After assembleFormData / buildDonationPayload, before submitStandardPostpaidDonation:
let paymentDetails: PaymentData['paymentDetails'] = {};

if (values.selectedPaymentMethod === 'sepa_debit') {
  const result = await sepaFormRef.current?.createPaymentMethod({
    name: `${formData.firstname} ${formData.lastname}`,
    email: formData.email,
    address: {
      line1: formData.address,
      city: formData.city,
      postal_code: formData.zipCode,
      country: formData.country,
    },
  });

  if (!result || 'error' in result) {
    setDonationState(prev => ({
      ...prev,
      isLoading: false,
      error: { code: 'paymentFailed' },
    }));
    submittingRef.current = false;
    return;
  }

  paymentDetails = { paymentMethodId: result.paymentMethodId };
}
```

Handle `action_required` for SEPA (after `submitStandardPostpaidDonation`, in the existing `action_required` placeholder):

```typescript
if (paymentResponse.status === 'action_required') {
  if (values.selectedPaymentMethod === 'sepa_debit') {
    const sepaResult = (await sepaFormRef.current?.confirmSepaDebitPayment(
      paymentResponse.response.payment_intent_client_secret
    )) ?? { error: 'No SEPA form available' };

    if (sepaResult.error) {
      setDonationState(prev => ({
        ...prev,
        isLoading: false,
        error: { code: 'paymentFailed' },
      }));
    } else {
      setDonationState(prev => ({
        ...prev,
        isLoading: false,
        thankYouState: {
          status: 'completed',
          donationId: donationResponse.donationId,
        },
      }));
    }
    return;
  }

  // Other methods: existing placeholder behavior
  setDonationState(prev => ({ ...prev, isLoading: false }));
}
```

Also update `donate-overlay.tsx` to pass `sepaFormRef` to `useDonationSubmit`:

```typescript
const {
  onSubmit,
  donationState,
  reset,
  onPayPalCreateOrder,
  onPayPalApproved,
  onPayPalError,
} = useDonationSubmit(donationData, fundraiser, paymentOptions, sepaFormRef);
```

**Billing details — address for authenticated users:** `donorProfile` has both a flat `address` object and an `addresses` array. The `values.selectedAddressId` identifies which address the user selected. The lookup priority is:

1. Match `values.selectedAddressId` against `donorProfile.addresses`
2. Fall back to `donorProfile.address` (flat default)
3. For guest users, `formData.donor` fields take precedence over profile data

**Fixes applied during implementation:**

- **IBAN validation not firing on empty submit:** `createPaymentMethod` returned early when name/mandate failed, so the IbanElement was never validated. Fixed by tracking `ibanComplete` from the `IbanElement` `onChange` event and including IBAN completeness in the upfront validation block alongside name and mandate — all three errors now surface together.
- **`IbanElement` style options:** Stripe does not support `hsl()` colors or CSS custom properties in its style configuration. Fixed by using hardcoded hex values (`#030712`, `#6b7280`, `#dc2626`) that approximate the theme tokens. A proper theme-aware solution requires loading the font and resolving colors via `<Elements options={{ appearance }}>` (see F2 in Future improvements).
```

**Testable:** Select SEPA, enter test IBAN `DE89370400440532013000`, fill donor info, click Donate → API calls fire, thank-you screen appears. Enter declined IBAN `DE62370400440532013001` → error banner shown.

---

## Files to create/modify

| File                                              | Action                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/lib/utils/get-stripe.ts`                     | Create — cached `getStripe(publishableKey, locale)` utility                   |
| `src/components/donate/stripe-sepa-form.tsx`      | Modify — add Account Holder Name field, mandate consent checkbox, creditor info |
| `src/lib/types/payment.ts`                        | Modify — remove `kind` from `StripePaymentSource`                             |
| `src/lib/utils/payment-request-builder.ts`        | Modify — implement `case 'stripe'`                                            |
| `src/components/donate/donate-overlay.tsx`        | Modify — add `<Elements>` wrapper, `sepaFormRef`, pass to `useDonationSubmit` |
| `src/components/donate/donation-form-context.tsx` | Modify — add `sepaFormRef` to context                                         |
| `src/components/donate/payment-methods.tsx`       | Modify — render `<StripeSepaForm>` when sepa-debit selected                   |
| `src/components/donate/use-donation-submit.ts`    | Modify — accept `sepaFormRef`, implement SEPA flow + SCA                      |
| `locales/en/donate.json`                          | Modify — add `sepa.*` keys                                                    |
| `locales/de/donate.json`                          | Modify — add `sepa.*` keys (German)                                           |

---

## Verification

1. Select SEPA Direct Debit → IbanElement and mandate text appear below the method selector
2. Enter test IBAN `DE89370400440532013000`, fill donor info, click Donate → success screen
3. Enter declined IBAN `DE62370400440532013001` → error banner shown in overlay
4. Enter a valid IBAN with only an initial as first name → full name (`${firstname} ${lastname}`) is sent, no Stripe rejection
5. `npm run build` completes without TypeScript errors
6. Countries outside SEPA zone do not see SEPA in the payment method list (handled by existing `derivePaymentMethods`)

---

## Future improvements

### F1 — Extract `useStripeFlow` composable

**File:** `src/components/donate/use-donation-submit.ts`

A comment at line ~244 already flags this. When adding card/native pay, extract the SEPA logic into `useStripeFlow(sharedRefs, deps)`, mirroring the PayPal pattern. Keep `useDonationSubmit` as the orchestrator.

### F2 — Stripe Elements appearance config

**File:** `src/components/donate/donate-overlay.tsx` (the `<Elements>` provider)

Pass an `options` prop with an `appearance` object to match the project's theme tokens (font family, border radius, color variables). Currently `<Elements>` is initialised with `stripe` only.

The `IbanElement` currently uses hardcoded hex colors (`#030712`, `#6b7280`, `#dc2626`) that approximate the default theme but do not adapt to theme changes or dark mode. Resolving this properly requires:

1. Loading the active theme font in Stripe's iframe via `<Elements options={{ fonts }}>` — the font URL must be passed explicitly since Stripe's iframe cannot inherit `next/font` variables from the parent page
2. Computing resolved color values to pass to the element style — Stripe does not support `hsl()` or CSS custom properties; colors must be `rgb()` or hex

### F3 — Saved SEPA methods

**File:** `src/lib/utils/payment-request-builder.ts` (stripe case)

The `StripePaymentRequest` type already has a `savedMethod?: string` field. When implementing saved payment methods (authenticated users), populate this from `paymentDetails.savedMethodId` instead of `source`.
