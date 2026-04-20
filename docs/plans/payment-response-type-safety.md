# Payment Response Type Safety Plan

**Status:** Not started  
**Last Updated:** 17 April 2026

---

## Problem

`PaymentResponse` in `src/lib/types/payment.ts` models the `action_required` response as a closed union of two Stripe-specific shapes:

```ts
type PaymentResponseActionRequired =
  | { status: 'action_required'; response: { type: 'cardAction'; ... } }
  | { status: 'action_required'; response: { type: 'cardPayment'; ... } };
```

This is not a safe contract. The backend's `PaymentApiResponse` returns:

```php
status: "action_required"
response: $exception->getClientData()
```

`getClientData()` is an arbitrary array owned by each payment provider. The schema is not enforced — it differs across gateways (e.g. PayPal redirect/approval, confirmation URLs) and may differ across Stripe flows.

**Risk:** The TypeScript union produces incorrect narrowing when any gateway returns an `action_required` response with a shape not in the union. Adding a new payment method that triggers `action_required` with a different payload shape will silently produce `undefined` or misrouted behaviour.

**SEPA note:** `action_required` is not expected in the normal SEPA Direct Debit flow. SEPA returns `success` from the PUT and settles asynchronously via Stripe webhooks (`payment_intent.processing` / `payment_intent.succeeded`). `action_required` would only occur for SEPA in an edge case (unusual `requires_*` + `next_action` state from Stripe, indicating misconfiguration rather than a designed UX step). The `action_required` branch for SEPA in `use-donation-submit.ts` is effectively a defensive fallback, not a live path.

**Note:** The `status: 'success'` and `status: 'failed'` variants are stable and well-modelled. Only `action_required` is affected.

---

## Approaches

### Option A — Honest contract: opaque `response` with runtime guards (recommended)

Model `action_required.response` as `Record<string, unknown>`. Add type guard functions for each known variant:

```ts
interface PaymentResponseActionRequired {
  id: string;
  status: 'action_required';
  response: Record<string, unknown>;
}

function isCardActionResponse(r: Record<string, unknown>): r is CardActionResponse {
  return r.type === 'cardAction' && typeof r.payment_intent_client_secret === 'string';
}

function isCardPaymentResponse(r: Record<string, unknown>): r is CardPaymentResponse {
  return r.type === 'cardPayment' && typeof r.payment_intent_client_secret === 'string';
}
```

Callers (`use-donation-submit.ts`) replace `paymentResponse.response.type === 'cardAction'` checks with the type guards.

**Pros:** Honest to the backend contract; new gateways don't break TypeScript.  
**Cons:** Loses compile-time exhaustiveness; type guards must be kept in sync with reality.

---

### Option B — Standardise the backend schema

Define and enforce a stable schema on the backend for `action_required` responses (e.g. a required `type` field with a per-provider payload). Update frontend types to match once the backend contract is stable.

**Pros:** Correct long-term; compile-time safety preserved.  
**Cons:** Requires backend change; higher coordination cost; blocked on backend team.

---

### Option C — Hybrid: known variants + unknown fallback

Keep strict known variants plus an `UnknownActionRequired` fallback:

```ts
type PaymentResponseActionRequired =
  | { id: string; status: 'action_required'; response: { type: 'cardAction'; ... } }
  | { id: string; status: 'action_required'; response: { type: 'cardPayment'; ... } }
  | { id: string; status: 'action_required'; response: { type: string; [key: string]: unknown } }; // fallback
```

**Pros:** Known paths remain strongly typed; new providers don't break the union.  
**Cons:** The fallback arm weakens inference — callers may need casts for known variants if narrowing fails.

---

## Recommended Approach

**Option A** in the short term (honest contract, runtime guards). **Option B** once a stable backend schema is available. Option C is a middle ground if neither is feasible soon.

---

## Affected Files

| File | Change |
|------|--------|
| `src/lib/types/payment.ts` | Replace `PaymentResponseActionRequired` closed union with open `response: Record<string, unknown>` |
| `src/components/donate/use-donation-submit.ts` | Replace `paymentResponse.response.type === 'cardAction'` checks with type guard calls |
| New: `src/lib/payment/payment-response-guards.ts` | `isCardActionResponse`, `isCardPaymentResponse`, and any future provider guards |

---

## Out of Scope

- Changes to `PaymentResponseSuccess` or `PaymentResponseFailed` — both are well-modelled.
- PayPal flow type modelling — PayPal goes through PUT `/donations/{id}` but cannot receive `action_required` in response. The PayPal SDK approval is the equivalent of the action-required step; by the time `onPayPalApproved` fires and calls the PUT, the user has already approved in the PayPal UI. The backend will only return `success` or `failed` for that PUT.
