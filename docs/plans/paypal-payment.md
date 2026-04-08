# PayPal Payment Implementation Plan

## Context

The fundraisers project has complete scaffolding for PayPal (types, fee config, payment method UI) but the actual PayPal integration is stubbed out. The goal is to implement the full flow so donors can pay via PayPal when it is available in `paymentOptions`.

The backend uses a **server-backed order flow** (confirmed):

1. `POST /app/donations` — creates donation record, returns `donationId`
2. `POST /app/donations/{donationId}/paypal/orders` — creates PayPal order, returns `orderId`
3. User approves via PayPal popup
4. `PUT /app/donations/{donationId}` — captures payment using approval data

Reference implementations:

- `planet-donations/src/Donations/PaymentMethods/NewPaypal.tsx` — identical backend, already working
- `docs/stripe-paypal-implementation.md` — existing design notes for this project

---

## Tasks

- [x] Install `@paypal/react-paypal-js`
- [x] Create `paypal-button.tsx` component (UI only, stub callbacks)
- [x] Wire `PayPalButton` into `donate-cta.tsx` (render PayPal button when PayPal selected)
- [x] Create `paypal-order-service.ts` (`POST /donations/{id}/paypal/orders`)
- [x] Implement `case 'paypal'` in `payment-request-builder.ts`
- [x] Add `onPayPalCreateOrder` + `onPayPalApproved` + `onPayPalError` to `use-donation-submit.ts`
- [x] Connect real callbacks in `donate-cta.tsx` and `donate-overlay.tsx`
- [x] Add PayPal error translation keys to locales

---

## Implementation

### Task 1 — Install dependency

```bash
npm install @paypal/react-paypal-js
```

`OnApproveData` lives in `@paypal/paypal-js` (peer dep), not `@paypal/react-paypal-js`:

```typescript
import type { OnApproveData } from '@paypal/paypal-js';
```

---

### Task 2 — New: `src/components/donate/paypal-button.tsx`

```
'use client'

Props:
  isSuccess: boolean
  onPayPalCreateOrder: (values: DonationFormValues) => Promise<string>
  onPayPalApproved: (data: OnApproveData) => Promise<void>
  onPayPalError: () => void
```

- Gets `paymentOptions` and `donationData` (for `currency`) from `useDonationForm()` context — no extra props needed
- No `CurrencyReloader` — currency is fixed when the overlay opens
- Default PayPal button styling (no custom label)
- Structure:

```tsx
<PayPalScriptProvider options={{ clientId, currency, enableFunding: 'venmo', disableFunding: 'card,giropay,sofort,sepa' }}>
  <PayPalButtonsInner ... />
</PayPalScriptProvider>
```

**`createOrder` callback** (inside `PayPalButtonsInner`):

1. `trigger()` from `useFormContext` — validates the form; if invalid, throws to block the PayPal popup (form errors shown because `trigger` marks fields as touched)
2. `onPayPalCreateOrder(getValues())` — returns `orderId`

**`onApprove` callback**:

1. Sets local `isProcessing: true`
2. `onPayPalApproved(data)` — full SDK approval data passed through
3. Resets `isProcessing` in `finally`

---

### Task 3 — Modify: `src/components/donate/donate-cta.tsx`

`DonateCTA` is the right place for the conditional — it already has `useFormContext`, `useWatch`, `isLoading`, and `isSuccess`.

Add optional PayPal props:

```typescript
onPayPalCreateOrder?: (values: DonationFormValues) => Promise<string>;
onPayPalApproved?: (data: OnApproveData) => Promise<void>;
onPayPalError?: () => void;
```

Add `useWatch` for `selectedPaymentMethod`. When it equals `'paypal'`, render `<PayPalButton>` using the provided props (or stub no-ops until task 7):

```tsx
if (selectedPaymentMethod === 'paypal') {
  return (
    <PayPalButton
      isSuccess={isSuccess}
      onPayPalCreateOrder={onPayPalCreateOrder ?? (() => Promise.resolve(''))}
      onPayPalApproved={onPayPalApproved ?? (() => Promise.resolve())}
      onPayPalError={onPayPalError ?? (() => undefined)}
    />
  );
}
```

`donate-overlay.tsx` needs no changes for this task — stubs are internal to `DonateCTA`.

---

### Task 4 — New: `src/lib/api/paypal-order-service.ts`

```typescript
export async function createPaypalOrder(
  donationId: string,
  paypalAccount: string,
  authToken?: string
): Promise<string>; // returns orderId
```

- POST `${API_BASE_URL}/donations/${donationId}/paypal/orders`
- Body: `{ paymentRequest: { account, gateway: 'paypal', method: 'paypal', savePaymentMethod: true } }`
- Headers: same pattern as `payment-service.ts` (Content-Type, X-SESSION-ID, optional Authorization)
- Throw a `PaymentError` on failure

---

### Task 5 — Modify: `src/lib/utils/payment-request-builder.ts`

Replace the `throw` at `case 'paypal'` with:

```typescript
case 'paypal': {
  const { orderID, payerID, paymentID, billingToken,
          facilitatorAccessToken, paymentSource } = paymentDetails;
  if (!orderID) {
    throw new PaymentOptionsError('Missing PayPal order ID', 'MISSING_ORDER_ID', 400);
  }
  return {
    gateway: 'paypal',
    account,
    method: 'paypal',
    source: {
      type: 'server_order',
      orderID: String(orderID),
      payerID: String(payerID ?? ''),
      paymentID: String(paymentID ?? ''),
      billingToken: billingToken ? String(billingToken) : null,
      facilitatorAccessToken: String(facilitatorAccessToken ?? ''),
      paymentSource: String(paymentSource ?? ''),
    },
  };
}
```

---

### Task 6 — Modify: `src/components/donate/use-donation-submit.ts`

Add `paypalDonationIdRef` to share `donationId` between the two PayPal callbacks.

**`onPayPalCreateOrder(values: DonationFormValues): Promise<string>`** (returns `orderId`)

- Guards against concurrent calls via `submittingRef`
- Sets `isLoading: true`
- `assembleFormData` + `buildDonationPayload` (same as `onSubmit`)
- `donationService.submitDonation(...)` → stores `donationId` in `paypalDonationIdRef`
- `createPaypalOrder(donationId, paypalAccount, token)` → returns `orderId`
- On error: sets `error` state, clears `isLoading`, rethrows so PayPal SDK blocks the popup

**`onPayPalApproved(data: OnApproveData): Promise<void>`**

- Uses `paypalDonationIdRef.current`
- Builds `paymentDetails` from `data` fields (orderID, payerID, etc.)
- `paymentService.processPayment(donationId, paymentRequest, token, paymentKeyRef.current)`
- Rotates idempotency keys on success
- Sets success/error state

`paypalAccount` from `paymentOptions.gateways.paypal?.account`.

**`onPayPalError(): void`**

- Sets `{ code: 'paypalPaymentError' }` error state
- Resets `isLoading` and releases `submittingRef`
- Handles SDK-level errors (popup blocked, JS load failure, internal SDK errors)

Return `{ donationState, onSubmit, onPayPalCreateOrder, onPayPalApproved, onPayPalError, reset }`.

---

### Task 7 — Connect real callbacks

In `donate-overlay.tsx` (`DonateOverlayInner`):

- Destructure `onPayPalCreateOrder`, `onPayPalApproved`, and `onPayPalError` from `useDonationSubmit`
- Pass all three as props to `<DonateCTA>`

In `donate-cta.tsx`:

- Remove stub no-ops — the real handlers now flow in from the overlay

---

### Task 8 — Translation keys

Add to `locales/en/donate.json` and `locales/de/donate.json` under `Donate.submissionErrors`:

- `paypalOrderCreationError` — `createOrder` API call fails
- `paypalCaptureError` — `onApprove` processing fails
- `paypalPaymentError` — SDK-level `onError` fires

Add to `SUBMISSION_ERROR_CODES` in `src/lib/types/submission-errors.ts`:
- `PAYPAL_ORDER_ERROR: 'paypalOrderCreationError'`
- `PAYPAL_CAPTURE_ERROR: 'paypalCaptureError'`
- `PAYPAL_SDK_ERROR: 'paypalPaymentError'`

Add `PaypalOrderError` to the `instanceof` check in `toSubmitError` in `use-donation-submit.ts`.

---

## Files to create/modify

| File                                                | Action                                      |
| --------------------------------------------------- | ------------------------------------------- |
| `src/components/donate/paypal-button.tsx`           | Create                                      |
| `src/components/donate/donate-cta.tsx`              | Modify — conditional PayPal render          |
| `src/lib/api/paypal-order-service.ts`               | Create                                      |
| `src/lib/utils/payment-request-builder.ts`          | Modify — implement `case 'paypal'`          |
| `src/components/donate/use-donation-submit.ts`      | Modify — add PayPal handlers                |
| `src/components/donate/donate-overlay.tsx`          | Modify — pass real callbacks to `DonateCTA` |
| `src/lib/types/submission-errors.ts`                | Modify — add PayPal error codes             |
| `locales/en/donate.json` + `locales/de/donate.json` | Modify — PayPal error keys                  |

---

## Verification

1. **Unit**: `payment-request-builder.ts` `case 'paypal'` — pass mock `paymentDetails`, assert `PayPalPaymentRequest` structure
2. **Integration**: Select PayPal → click button → PayPal popup opens with correct amount/currency → approve with sandbox account → success banner shown
3. **Validation**: Submit with empty required fields → PayPal popup blocked, form errors shown
4. **Error path**: Mock `createPaypalOrder` to fail → error banner shown in overlay
5. **Idempotency**: Click PayPal button, abandon, click again → no duplicate donations (key unchanged until success)
