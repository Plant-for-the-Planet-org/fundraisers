# Pending Payment State Plan

**Status:** Planned  
**Last Updated:** 16 April 2026

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
3. **No false "completed" screen.** The user must not see a "completed" screen while the donation is still being processed.
4. **Don't make the user wait.** Payment settlement latency is unpredictable (the HAR evidence shows ~60 seconds for SEPA). Keeping the user on a spinner for an unknown duration is poor UX. Show a result immediately.

---

## Approach: Single GET, Immediate Result

Rather than polling until the payment settles, do **one GET immediately after the PUT**:

- If `paymentStatus === 'paid'` → show the completed thank-you screen.
- If anything else (`pending`, `failed`, GET error, or unknown status) → show a `paymentProcessing` thank-you screen: _"Your payment is being processed. You will receive an email when it is confirmed."_

**Why not poll?** The HAR evidence shows settlement can take ~60 seconds. There is no way to know in advance how long any given payment will take. Making the user wait on a spinner for up to a minute (or longer) is not acceptable. The single GET is a best-effort check: if the payment happens to have settled by the time the GET fires, we show the confirmed state; otherwise we give the user an informational view and let the email notification carry the confirmation.

**Why not skip the GET entirely?** A single GET costs ~400 ms and has a reasonable chance of catching fast-settling card payments. It is worth the call.

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

## New Utility Function

Add `resolveThankYouStateFromGet` to a new `src/lib/donation/resolve-donation-status.ts`:

```ts
// Calls GET /donations/{donationId} once and maps the result to a ThankYouState.
// paid         → { status: 'completed', donationId }
// anything else → { status: 'paymentProcessing', donationId }
// GET error    → { status: 'paymentProcessing', donationId }  (safe fallback — never surfaces a confusing error for a payment the user has already submitted)
async function resolveThankYouStateFromGet(
  donationId: string,
  token?: string
): Promise<ThankYouState>
```

---

## Revised Submission Flow

### Card (both `cardAction` and `cardPayment` paths)

```
POST /donations
  ↓ success
PUT /donations/{id}   (+ handleCardAction / confirmCardPayment if action_required)
  ↓ status === 'success'
[NEW] GET /donations/{id}  (single call, immediate)
  ↓ paid    → thankYouState: { status: 'completed' }
  ↓ pending → thankYouState: { status: 'paymentProcessing' }
```

### PayPal

```
POST /donations
  ↓ success → createOrder returns orderId
PayPal SDK → onApprove fires
  ↓
PUT /donations/{id}
  ↓ success
[NEW] GET /donations/{id}  (single call, immediate)
  ↓ paid    → thankYouState: { status: 'completed' }
  ↓ pending → thankYouState: { status: 'paymentProcessing' }
```

### SEPA Direct Debit

```
POST /donations
  ↓ success
PUT /donations/{id}
  ↓ if status === 'action_required' → confirmSepaDebitPayment
[NEW] GET /donations/{id}  (single call, immediate)
  ↓ paid    → thankYouState: { status: 'completed' }
  ↓ pending → thankYouState: { status: 'paymentProcessing' }
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

### Settlement latency (HAR polling log)

After the PUT completed, 5 XHR requests were made to the backend API at a constant ~12.5 second interval:

| Request | Started (UTC) | Duration | `paymentStatus` |
| ------- | ------------- | -------- | --------------- |
| 1st     | 07:07:45.890  | 380 ms   | `"pending"`     |
| 2nd     | 07:07:58.285  | 476 ms   | `"pending"`     |
| 3rd     | 07:08:10.778  | 480 ms   | `"pending"`     |
| 4th     | 07:08:23.271  | 416 ms   | `"pending"`     |
| 5th     | 07:08:35.697  | 381 ms   | `"paid"`        |

The donation resolved on the 5th poll (~60 seconds after the PUT). The `paymentDate` field was `null` for all `"pending"` responses and populated (`"2026-04-14 07:08:13"`) in the `"paid"` response.

This confirms that `GET /donations/{id}` is a real, stable endpoint on the backend. It also shows why polling is not used: a ~60 second wait is unacceptable.

---

## `ThankYouState` Changes

```ts
// Add a new status for payments that are submitted but not yet confirmed
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
  | { status: 'paymentProcessing'; donationId: string }; // NEW
```

`paymentProcessing` shows the user: _"Your payment is being processed. You will receive an email when it is confirmed."_ — different from an error, and not a false success.

### UI for `paymentProcessing`

Rendered by an existing `ThankYouCard` variant (no new component needed):
- No icon (consistent with `bankTransferPending` style)
- Amber status badge labelled "Processing"
- Informational message directing the user to check their email

---

## `DonationSubmitState`

The existing flat interface is **not changed**. The `isLoading: true` state during the brief GET call is indistinguishable from the submission loading state from the user's perspective — both are covered by the disabled/loading CTA button. A discriminated union refactor would add complexity without a meaningful UX benefit given the single-call approach.

---

## Implementation Tasks

- [ ] **Backend alignment** — confirm exact `paymentStatus` values and expected transition latency. Update the `PaymentResponseBase` TODO comment.
- [ ] **`DonationStatusResponse` type** — add to `src/lib/types/donation.ts` (alongside existing `DonationResponse`).
- [ ] **`donationService.getDonation`** — implement in `donation-service.ts`.
- [ ] **`resolveThankYouStateFromGet` utility** — pure async function; lives in `src/lib/donation/resolve-donation-status.ts`.
- [ ] **`use-donation-submit.ts`** — replace the 5 direct `thankYouState: { status: 'completed' }` assignments (4 in `onSubmit`, 1 in `onPayPalApproved`) with `resolveThankYouStateFromGet` calls. The `bankTransferPending` path in `resolveThankYouState` is not affected.
- [ ] **`ThankYouState`** — add `paymentProcessing` variant to `src/lib/types/donation-submit.ts`.
- [ ] **`donation-thank-you.tsx`** — replace the ternary with a switch to handle `paymentProcessing`.
- [ ] **`thank-you-card.tsx`** — add `paymentProcessing` variant (no icon, amber badge, informational message).
- [ ] **`status-badge.tsx`** — add `paymentProcessing` variant (amber styling).
- [ ] **Locale files** — add `paymentProcessing` keys to `locales/en/donate.json` and `locales/de/donate.json`.

---

## Considered and Abandoned Approaches

### ~~Polling loop (original design)~~

The original plan described polling `GET /donations/{id}` up to 5 times at 12.5 s intervals (max ~62 seconds total), based on the HAR evidence showing a SEPA payment taking ~60 seconds to settle.

**Why abandoned:** Settlement latency is unpredictable. The ~60 s SEPA observation is not representative of all payment methods — card payments may settle faster, others may take longer. There is no safe upper bound. Keeping the user on a spinner for an unknown duration (potentially >60 s) is unacceptable UX. A single immediate GET is a best-effort check; if it returns `pending`, the `paymentProcessing` view communicates the state honestly without making the user wait.

### ~~`DonationSubmitState` discriminated union~~

The original plan proposed replacing the flat `{ isLoading, thankYouState, error }` interface with a discriminated union that included a `paymentPending` phase to display a spinner view during polling.

**Why abandoned:** The `paymentPending` phase was only needed because polling could take tens of seconds — long enough that the form needed to be replaced with a visible "waiting" UI. With a single immediate GET (~400 ms), the existing `isLoading: true` loading state is sufficient. Adding the discriminated union refactor would increase the scope and diff size of this change without a meaningful UX improvement.

---

## Out of Scope for This Plan

- Changes to the `bank-transfer` (offline) flow.
- Polling / WebSocket / server-sent events.
- Refactoring `DonationSubmitState` to a discriminated union.
- The donation flow refactor (separate plan: `donation-flow-refactor.md`). However, doing this plan after PR A of the refactor plan (pure function extraction) will be cleaner.
