# Pending Payment State Plan

**Status:** Planned  
**Last Updated:** 14 April 2026

---

## Problem

After a successful PUT to `/donations/{id}`, the payment service returns `{ status: 'success' }`. The current code treats this as confirmation that the donation is finalized and immediately transitions to the `thankYouState: { status: 'completed' }` screen.

However, the payment PUT only confirms that no further client-side action is required (e.g. no 3DS challenge). The donation record on the backend may still be in a processing or pending state. Showing the "completed" thank-you screen while the donation is still being processed is incorrect.

The same problem applies to PayPal: `onPayPalApproved` goes directly to `thankYouState: { status: 'completed' }` as soon as `processPayment` resolves.

**Note:** `bankTransferPending` is unaffected. This state is only reached when the PUT response contains `type: 'transfer_required'`, which is specific to the offline `bank-transfer` payment method. Those donations are _designed_ to be in a pending state and already show a distinct "transfer pending" thank-you view. No change needed there.

SEPA Direct Debit (`sepa-debit`) is a separate Stripe payment method that resolves directly to `{ status: 'completed' }` after `confirmSepaDebitPayment` — it has the same problem as card and PayPal and is equally in scope for this fix.

> **TODO before implementation:** `GET /donations/{id}` is confirmed to exist (see HAR evidence below). The confirmed field is `paymentStatus`; known values are `"pending"` and `"paid"`. Confirm with the backend team what other values are possible (e.g. `"failed"`, `"refunded"`) and whether `"processing"` is a distinct intermediate state.

---

## Design Principles

1. **PUT → payment intent confirmed.** The PUT `/donations/{id}` call establishes a payment method. It does not confirm the donation is finalized.
2. **GET → donation status confirmed.** After the payment PUT succeeds, fetch the donation record and derive the final state from it.
3. **No false "completed" screen.** The user should see a distinct in-progress view between form submission and the confirmed outcome.
4. **Graceful degradation.** If polling exceeds retry bounds, show a safe "payment is being processed" message rather than an error or a fake success.

---

## New `DonationSubmitState` Shape

Replace the current flat interface:

```ts
// CURRENT — avoid (flat boolean obscures state machine)
interface DonationSubmitState {
  isLoading: boolean;
  thankYouState: ThankYouState | null;
  error: DonationSubmitError | null;
}
```

With a discriminated union:

```ts
// PROPOSED
type DonationSubmitState =
  | { phase: 'idle'; error: null; thankYouState: null }
  | { phase: 'submitting'; error: null; thankYouState: null }
  | {
      phase: 'paymentPending';
      donationId: string;
      error: null;
      thankYouState: null;
    }
  | { phase: 'completed'; error: null; thankYouState: ThankYouState }
  | { phase: 'failed'; error: DonationSubmitError; thankYouState: null };
```

### Initial value

```ts
const INITIAL_STATE: DonationSubmitState = {
  phase: 'idle',
  error: null,
  thankYouState: null,
};
```

### `isLoading` derived property for backward compat (if needed at call sites)

```ts
const isLoading =
  state.phase === 'submitting' || state.phase === 'paymentPending';
```

---

## New API Method

Add `getDonation` to `donation-service.ts`:

```ts
getDonation(donationId: string, token?: string): Promise<DonationStatusResponse>
```

**HTTP:** `GET /donations/{donationId}`  
**Auth:** `Bearer {token}` if token is present (guest donations may not have one)

### `DonationStatusResponse` type

```ts
// Confirmed from HAR: "pending" and "paid".
// Additional values (e.g. "failed", "refunded") TBC with backend.
type DonationPaymentStatus = 'pending' | 'paid' | 'failed' | string;

interface DonationStatusResponse {
  id: string;
  paymentStatus: DonationPaymentStatus; // field confirmed from HAR
  paymentDate: string | null; // null while pending, populated once settled
  uid: string;
  amount: number;
  currency: string;
  frequency: string | null;
}
```

---

## Revised Submission Flow

### Card (both `cardAction` and `cardPayment` paths)

```
POST /donations
  ↓ success
PUT /donations/{id}   (+ handleCardAction / confirmCardPayment if action_required)
  ↓ status === 'success'
[NEW] → transition to { phase: 'paymentPending', donationId }
[NEW] GET /donations/{id}
  ↓ paymentStatus resolved
→ transition to { phase: 'completed', thankYouState } or { phase: 'failed' }
```

### PayPal

```
POST /donations
  ↓ success → createOrder returns orderId
PayPal SDK → onApprove fires
  ↓
PUT /donations/{id}
  ↓ success
[NEW] → transition to { phase: 'paymentPending', donationId }
[NEW] GET /donations/{id}
  ↓ paymentStatus resolved
→ transition to { phase: 'completed', thankYouState } or { phase: 'failed' }
```

### SEPA Direct Debit

```
POST /donations
  ↓ success
PUT /donations/{id}
  ↓ if status === 'action_required' → confirmSepaDebitPayment
[NEW] → transition to { phase: 'paymentPending', donationId }
[NEW] GET /donations/{id}
  ↓ paymentStatus resolved
→ transition to { phase: 'completed', thankYouState } or { phase: 'failed' }
```

### Bank Transfer (offline)

No change. `bankTransferPending` remains a direct terminal state — reached only when the PUT response contains `type: 'transfer_required'`. `GET /donations/{id}` is not needed here.

---

## Observed Behavior (HAR Evidence)

A recorded SEPA Direct Debit donation on the staging environment confirms the following.

### PUT response format

```json
{ "id": "don_0w1vwHC2T89KmB4bTuVWZOuk", "status": "success" }
```

Only two fields are returned: `id` (the donation ID) and `status`. No separate `donationId` key.

### Polling pattern

After the PUT completed, 5 XHR requests were made to the backend API at a constant ~12.5 second interval:

| Request | Started (UTC) | Duration | `paymentStatus` |
| ------- | ------------- | -------- | --------------- |
| 1st     | 07:07:45.890  | 380 ms   | `"pending"`     |
| 2nd     | 07:07:58.285  | 476 ms   | `"pending"`     |
| 3rd     | 07:08:10.778  | 480 ms   | `"pending"`     |
| 4th     | 07:08:23.271  | 416 ms   | `"pending"`     |
| 5th     | 07:08:35.697  | 381 ms   | `"paid"`        |

The donation resolved on the 5th poll (~60 seconds after the PUT). The `paymentDate` field was `null` for all `"pending"` responses and populated (`"2026-04-14 07:08:13"`) in the `"paid"` response.

This confirms that `GET /donations/{id}` is a real, stable endpoint on the backend.

---

## Polling Strategy

A single GET after the PUT may hit the donation while it's still processing. If the first fetch returns a non-final status, retry with a fixed 12.5 s interval (matching observed behavior):

| Attempt | Delay before attempt |
| ------- | -------------------- |
| 1st     | 0 ms (immediate)     |
| 2nd     | 12 500 ms            |
| 3rd     | 12 500 ms            |
| 4th     | 12 500 ms            |
| 5th     | 12 500 ms            |
| give up | — show pending UI    |

"Final" statuses: `paid` (→ `completed`), `failed` (→ `failed`)  
"Non-final" statuses: `pending` (and any other non-final values TBC with backend)

```
resolveFromFetch(donationId, token, retries = 0):
  response = GET /donations/{id}
  if response.paymentStatus ∈ final → return resolved ThankYouState
  if retries >= MAX_RETRIES         → return { phase: 'completed', thankYouState: 'processingTimeout' }
  await delay(POLL_INTERVAL_MS)
  return resolveFromFetch(donationId, token, retries + 1)
```

`MAX_RETRIES = 5`, `POLL_INTERVAL_MS = 12_500` — based on observed behavior; `processingTimeout` is reached after ~62 seconds total.

---

## `ThankYouState` Changes

```ts
// Add a new status for the "we gave up polling" case
type ThankYouState =
  | { status: 'completed'; donationId: string | null }
  | {
      status: 'bankTransferPending';
      donationId: string;
      uid: string;
      amount: number;
      currency: string;
      frequency: string;
      transferAccount: TransferAccount;
    }
  | { status: 'processingTimeout'; donationId: string }; // NEW
```

`processingTimeout` shows the user a message like "Your payment is being processed. You will receive an email when it is confirmed." — different from an error, different from a success.

---

## UI Changes

### `donate-overlay.tsx`

Add a third branch alongside `thankYouState ≠ null` and the form:

```tsx
{
  state.phase === 'paymentPending' && (
    <PaymentProcessingView donationId={state.donationId} />
  );
}
```

`PaymentProcessingView` is a simple spinner + message ("We're confirming your payment…"). It is replaced automatically when polling resolves.

### `thank-you.tsx` (or equivalent)

Add a branch to render the `processingTimeout` state — an informational non-error view directing the user to check their email.

---

## Implementation Tasks

1. **Backend alignment** — confirm exact `paymentStatus` values and expected transition latency. Update the `PaymentResponseBase` TODO comment.
2. **`DonationStatusResponse` type** — add to `src/lib/types/donation-submit.ts` (or a new `donation-types.ts`).
3. **`donationService.getDonation`** — implement in `donation-service.ts`.
4. **`resolveFromFetch` utility** — pure async function with retry loop; lives in `resolve-donation-status.ts`.
5. **Refactor `DonationSubmitState`** — replace flat interface with discriminated union in `donation-submit.ts`. Update consumers (`donate-overlay.tsx`, `use-donation-submit.ts`).
6. **`use-donation-submit.ts`** — replace terminal `thankYouState: { status: 'completed' }` assignments in card and PayPal paths with `paymentPending` transition + `resolveFromFetch` call.
7. **`PaymentProcessingView` component** — create minimal spinner view.
8. **`donate-overlay.tsx`** — add `paymentPending` render branch.
9. **`thank-you.tsx`** — add `processingTimeout` render branch.
10. **Update `thank-you-feature.md`** — document the new three-phase flow.

---

## Out of Scope for This Plan

- Changes to the `bank-transfer` (offline) flow.
- WebSocket or server-sent events (polling is sufficient for now).
- The donation flow refactor (separate plan: `donation-flow-refactor.md`). However, doing this plan after PR A of the refactor plan (pure function extraction) will be cleaner.
