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

- [ ] Install `@paypal/react-paypal-js`
- [ ] Create `paypal-button.tsx` component (UI only, stub callbacks)
- [ ] Wire `PayPalButton` into `donate-overlay.tsx` (replace `DonateCTA` when PayPal selected)
- [ ] Create `paypal-order-service.ts` (`POST /donations/{id}/paypal/orders`)
- [ ] Implement `case 'paypal'` in `payment-request-builder.ts`
- [ ] Add `onPayPalCreateOrder` + `onPayPalApproved` to `use-donation-submit.ts`
- [ ] Connect real callbacks in `paypal-button.tsx`
- [ ] Add PayPal error translation keys to locales

---

## Implementation Plan

### Task 1 — Install dependency

```bash
npm install @paypal/react-paypal-js
```

---

### Task 2 — New: `src/components/donate/paypal-button.tsx`

```
'use client'

Props:
  paymentOptions: PaymentOptions
  isSuccess: boolean
  onPayPalCreateOrder: (values: DonationFormValues) => Promise<string>
  onPayPalApproved: (data: OnApproveData) => Promise<void>
  onPayPalError: () => void   // called on SDK-level errors — parent sets error state
```

Structure (mirrors `NewPaypal.tsx`):

```tsx
<PayPalScriptProvider options={{ clientId, currency, enableFunding: 'venmo', disableFunding: 'card,giropay,sofort,sepa' }}>
  <CurrencyReloader currency={currency} />   {/* dispatches RESET_OPTIONS on currency change */}
  <PayPalButtons
    style={{ label: 'donate' }}              // closest compliant option to "Donate with PayPal"
    createOrder={createOrder}
    onApprove={onApprove}
    onError={onError}
    onCancel={onCancel}
    disabled={isProcessing || isSuccess}
  />
</PayPalScriptProvider>
```

**`createOrder` callback**:
1. Call `trigger()` from `useFormContext<DonationFormValues>()` to validate form
2. If validation fails — throw (PayPal popup is prevented; form errors are shown because `trigger` marks fields as touched)
3. Call `onPayPalCreateOrder(getValues())` → returns `orderId`
4. Return `orderId`

**`onApprove` callback**:
1. Sets local `isProcessing: true`
2. Calls `onPayPalApproved({ ...data, type: 'server_order' })` — spread all SDK data + add `type`
3. Resets `isProcessing` in `finally`

**Note on button text**: The PayPal SDK does not support arbitrary button text. `style={{ label: 'donate' }}` renders "Donate" with the PayPal logo, which is the most semantically correct compliant option. If exact "Donate with PayPal" text is required, discuss with PayPal ToS constraints (custom button overlays are not recommended).

---

### Task 3 — Modify: `src/components/donate/donate-overlay.tsx`

In `DonateOverlayInner`:
- Destructure `onPayPalCreateOrder` and `onPayPalApproved` from `useDonationSubmit`
- Pass them to `DonationFormProvider` context (see Task 6) OR directly to a new wrapper

Replace `<DonateCTA isLoading={isLoading} isSuccess={isSuccess} />` in the `rightColumn` with a new `<PaymentCTASection>` component (inline in the file or extracted):

```tsx
function PaymentCTASection({
  isLoading, isSuccess, paymentOptions,
  onPayPalCreateOrder, onPayPalApproved, onPayPalError,
}) {
  const { watch } = useFormContext<DonationFormValues>();
  const selectedMethod = watch('selectedPaymentMethod');

  if (selectedMethod === 'paypal') {
    return (
      <PayPalButton
        paymentOptions={paymentOptions}
        isSuccess={isSuccess}
        onPayPalCreateOrder={onPayPalCreateOrder}
        onPayPalApproved={onPayPalApproved}
        onPayPalError={onPayPalError}
      />
    );
  }
  return <DonateCTA isLoading={isLoading} isSuccess={isSuccess} />;
}
```

`onPayPalError` can just call `reset()` + set an error via a small `useState` in the overlay, or reuse the `donationState.error` path by having `onPayPalApproved` set error state on SDK-level failures too.

---

### Task 4 — New: `src/lib/api/paypal-order-service.ts`

New API client for step 2 of the flow (POST /donations/{id}/paypal/orders).

```typescript
export async function createPaypalOrder(
  donationId: string,
  paypalAccount: string,
  authToken?: string
): Promise<string>  // returns orderId
```

- POST `${API_BASE_URL}/donations/${donationId}/paypal/orders`
- Body: `{ paymentRequest: { account, gateway: 'paypal', method: 'paypal', savePaymentMethod: true } }`
- Headers: same pattern as `payment-service.ts` (Content-Type, X-SESSION-ID, optional Authorization)
- Throw a `PaymentError` on failure (same class as `payment-service.ts`)

---

### Task 5 — Modify: `src/lib/utils/payment-request-builder.ts`

Implement the stubbed `case 'paypal'`. Replace the `throw` at line 108–116 with:

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

Add two new handlers alongside the existing `onSubmit`. Also add a `paypalDonationIdRef` to share donationId between the two PayPal callbacks.

**`onPayPalCreateOrder(values: DonationFormValues): Promise<string>`** (returns `orderId`)
- Guards against concurrent calls with `submittingRef` (same as `onSubmit`)
- Sets `isLoading: true`
- Calls `assembleFormData` + `buildDonationPayload` (same as `onSubmit`)
- `donationService.submitDonation(payload, token, donationKeyRef.current)` → stores returned `donationId` in `paypalDonationIdRef`
- Calls `createPaypalOrder(donationId, paypalAccount, token)` (from new service)
- Returns `orderId`
- On error: sets `error` state, clears `isLoading`, rethrows (so PayPal SDK sees failure and doesn't open popup)

**`onPayPalApproved(data: OnApproveData): Promise<void>`**
- Uses `paypalDonationIdRef.current` for donationId
- Builds `paymentDetails` from the OnApproveData fields (orderID, payerID, etc.)
- Calls `paymentService.processPayment(donationId, paymentRequest, token, paymentKeyRef.current)`
- Rotates idempotency keys on success
- Sets success/error state (same pattern as the existing `onSubmit` success block)

Return `{ donationState, onSubmit, onPayPalCreateOrder, onPayPalApproved, reset }` from the hook.

`paypalAccount` is read from `paymentOptions.gateways.paypal?.account`.

---

### Task 7 — Connect real callbacks in `paypal-button.tsx`

Replace stub callbacks with the real `onPayPalCreateOrder` and `onPayPalApproved` from `use-donation-submit.ts` (wired through `donate-overlay.tsx`).

---

### Task 8 — Translation keys

Add to `locales/en/common.json` and `locales/de/common.json`:
- `paypalOrderCreationError` — shown when `createOrder` API call fails
- `paypalCaptureError` — shown when `onApprove` processing fails
- `paypalPaymentError` — shown for SDK-level errors

Map these in `SUBMISSION_ERROR_CODES` or handle them via the existing `toSubmitError` path in `use-donation-submit.ts`.

---

## Files to create/modify

| File | Action |
|---|---|
| `src/components/donate/paypal-button.tsx` | Create |
| `src/lib/api/paypal-order-service.ts` | Create |
| `src/lib/utils/payment-request-builder.ts` | Modify — implement `case 'paypal'` |
| `src/components/donate/use-donation-submit.ts` | Modify — add `onPayPalCreateOrder`, `onPayPalApproved`, `paypalDonationIdRef` |
| `src/components/donate/donate-overlay.tsx` | Modify — add `PaymentCTASection` |
| `locales/en/common.json` + `locales/de/common.json` | Modify — add PayPal error keys |

---

## Verification

1. **Unit**: `payment-request-builder.ts` case 'paypal' — pass mock `paymentDetails` with all fields, assert the returned `PayPalPaymentRequest` structure matches the backend spec
2. **Integration**: Select PayPal in the overlay → click PayPal button → PayPal popup opens with correct amount/currency → approve with sandbox account → success banner shown
3. **Validation**: Submit with empty required fields → PayPal popup is blocked, form errors shown
4. **Error path**: Mock `createPaypalOrder` to fail → error banner shown in overlay
5. **Idempotency**: Click PayPal button, abandon, click again → no duplicate donations created (idempotency key stays the same until success)
