# Stripe & PayPal Implementation Guide

Background: [donation-implementation-plan.md](./donation-implementation-plan.md) · [donation-flow.md](./donation-flow.md)

This document covers what needs to be added to implement Stripe (card, SEPA) and PayPal on top of the offline payment path already in place.

---

## Overview of what already exists

The two-step submission flow is complete for offline:

```
useDonationSubmit.onSubmit()
  → submitStandardPostpaidDonation()         builds PaymentData, calls both steps
      → donationService               POST /donations
      → buildPaymentRequest()         builds PUT body — offline case done
      → paymentService                PUT /donations/{id}
  ← PaymentResponse (discriminated union on status)
```

The places where Stripe and PayPal need to plug in are marked with `TODO` comments:

| File | Line | What's needed |
|---|---|---|
| [`payment-request-builder.ts`](../src/lib/utils/payment-request-builder.ts) | `case 'stripe'` | Build `StripePaymentRequest` from `paymentMethodId` |
| [`payment-request-builder.ts`](../src/lib/utils/payment-request-builder.ts) | `case 'paypal'` | Build `PayPalPaymentRequest` from SDK callback data |
| [`use-donation-submit.ts`](../src/components/donate/use-donation-submit.ts) | after `submitStandardPostpaidDonation` | Handle `action_required` (3DS) response |

---

## Stripe — card and SEPA

### How the source is obtained

Stripe card details **never pass through React state**. They live inside a Stripe Elements hosted iframe. At submit time, call `stripe.createPaymentMethod()` to get a `pm_xxx` ID, then pass it into `submitStandardPostpaidDonation` as `paymentDetails.paymentMethodId`.

```ts
// In use-donation-submit.ts, before calling submitStandardPostpaidDonation:
const { paymentMethod: stripePaymentMethod, error } =
  await stripe.createPaymentMethod({ type: 'card', card: cardElement });

if (error) { /* show error, return */ }

const paymentDetails: PaymentData['paymentDetails'] = {
  paymentMethodId: stripePaymentMethod.id,
};
```

For SEPA, the flow is the same — use `type: 'sepa_debit'` and an `<IbanElement>` instead of `<CardElement>`.

### Initialising Stripe

```ts
// Once, outside the component (avoids re-creating on renders):
const stripePromise = loadStripe(
  paymentOptions.gateways.stripe.authorization.stripePublishableKey,
  { stripeAccount: paymentOptions.gateways.stripe.authorization.accountId }
);
```

`paymentOptions.gateways.stripe.authorization` already has both fields — `stripePublishableKey` and `accountId`. See [`payment-options.ts`](../src/lib/types/payment-options.ts).

### `buildPaymentRequest` — Stripe case

Replace the `case 'stripe'` throw in [`payment-request-builder.ts`](../src/lib/utils/payment-request-builder.ts) with:

```ts
case 'stripe': {
  const id = paymentDetails.paymentMethodId || paymentDetails.sourceId;
  if (!id) {
    throw new PaymentOptionsError(
      'Missing payment method ID for Stripe payment',
      'MISSING_PAYMENT_METHOD_ID',
      400
    );
  }
  // TODO: handle savedMethod — confirm structure with backend
  return {
    gateway: 'stripe',
    account,
    method: paymentMethod as StripePaymentMethod,
    source: { kind: 'stripe', id: String(id), object: 'payment_method' },
  };
}
```

Internal `PaymentMethod` ids are snake_case (`'card'`, `'sepa_debit'`, `'apple_pay'`, `'google_pay'`), so they line up with `StripePaymentMethod` directly — no mapping function needed. `StripePaymentMethod` is exported from [`payment.ts`](../src/lib/types/payment.ts).

### Note: `kind` field on `StripePaymentSource`

`StripePaymentSource` has a `kind: 'stripe'` field used internally as a TypeScript discriminant on the `PaymentSource` union. This field gets serialised into the PUT body. The API spec does not include it — the backend may silently ignore it or reject it. **Confirm with the backend before sending card/SEPA payments to production.** See the TODO in [`payment.ts`](../src/lib/types/payment.ts).

### Handling 3DS (`action_required` response)

When the API returns `status: 'action_required'`, the user must complete 3DS authentication via Stripe.js. In `use-donation-submit.ts`, after `submitStandardPostpaidDonation` returns:

```ts
if (paymentResponse.status === 'action_required') {
  const { error } = await stripe.confirmCardPayment(
    paymentResponse.response.payment_intent_client_secret
  );
  if (error) {
    setState(prev => ({ ...prev, isLoading: false, error: toSubmitError(error) }));
  } else {
    setState(prev => ({ ...prev, isLoading: false, isSuccess: true, donationId: ... }));
  }
  return;
}
```

`paymentResponse.response.payment_intent_client_secret` and `paymentResponse.response.account` are already modelled in `PaymentResponseActionRequired` in [`payment.ts`](../src/lib/types/payment.ts).

---

## PayPal

### How the source is obtained

PayPal is fundamentally different from Stripe — the `orderId` comes from the PayPal SDK button callback, **not** from `paymentDetails`. The PayPal button renders inline and calls `onApprove` when the user completes checkout in the PayPal popup.

```tsx
// paypal-button.tsx
<PayPalScriptProvider
  options={{ clientId: paymentOptions.gateways.paypal.authorization.client_id }}
>
  <PayPalButtons
    onApprove={(data, actions) => {
      // data contains: orderID, payerID, paymentID, billingToken,
      //                facilitatorAccessToken, paymentSource
      onPayPalApproved(data);
    }}
  />
</PayPalScriptProvider>
```

The full `data` object from `onApprove` is the `PayPalPaymentSource`. It must be passed into `submitStandardPostpaidDonation` as `paymentDetails` so `buildPaymentRequest` can construct the source.

### `buildPaymentRequest` — PayPal case

The PayPal source fields need to be passed through `paymentDetails`. The challenge is that `StripeOrPaypalPaymentData.paymentDetails` has an index signature but `PayPalPaymentSource` uses specific named fields. The simplest approach:

```ts
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

### Wiring in `use-donation-submit.ts`

PayPal does not go through `handleSubmit` — the button's `onApprove` fires independently. The pattern in `use-donation-submit.ts` is:

```ts
// Expose a separate handler for PayPal approval:
const onPayPalApproved = useCallback(async (paypalData: OnApproveData) => {
  const paymentDetails: PaymentData['paymentDetails'] = {
    orderID: paypalData.orderID,
    payerID: paypalData.payerID,
    // ... rest of fields
  };
  await submitStandardPostpaidDonation({
    payload,
    token: token || undefined,
    donationIdempotencyKey: donationKeyRef.current,
    paymentIdempotencyKey: paymentKeyRef.current,
    selectedPaymentMethod: 'paypal',
    paymentOptions,
    paymentDetails: cleanPaymentDetails(paymentDetails),
  });
}, [...]);
```

PayPal does not produce a 3DS `action_required` response — the SDK handles its own auth. After `submitStandardPostpaidDonation` resolves, treat any `status: 'success'` as a normal success.

---

## UI components

Both Stripe and PayPal need new components in `src/components/donate/`:

| Component | Purpose |
|---|---|
| `stripe-card-form.tsx` | `<CardElement>` + ref exposing `createPaymentMethod()` |
| `stripe-sepa-form.tsx` | `<IbanElement>` + mandate acceptance checkbox + ref |
| `paypal-button.tsx` | `<PayPalScriptProvider>` + `<PayPalButtons>` with `onApprove` wired to `useDonationSubmit` |

See [donation-implementation-plan.md — Portion 3](./donation-implementation-plan.md#portion-3--payment-methods) for the full component specs.

Install packages before starting:

```
npm install @stripe/stripe-js @stripe/react-stripe-js @paypal/react-paypal-js
```

---

## Checklist

**Stripe:**
- [ ] `stripe-card-form.tsx` — `<CardElement>`, exposes `createPaymentMethod()` via ref
- [ ] `stripe-sepa-form.tsx` — `<IbanElement>`, mandate checkbox, exposes `createPaymentMethod()` via ref
- [ ] `use-donation-submit.ts` — call `stripe.createPaymentMethod()` before `submitStandardPostpaidDonation` when Stripe method is selected
- [ ] `payment-request-builder.ts` — implement `case 'stripe'`
- [ ] `use-donation-submit.ts` — handle `action_required` (3DS) response
- [ ] Confirm `kind` field on `StripePaymentSource` with backend — remove or strip before send

**PayPal:**
- [ ] `paypal-button.tsx` — `<PayPalButtons>` wired to `onPayPalApproved`
- [ ] `use-donation-submit.ts` — expose `onPayPalApproved` handler
- [ ] `payment-request-builder.ts` — implement `case 'paypal'`

**Shared:**
- [ ] `payment-methods.tsx` — render `StripeCardForm`, `StripeSepaForm`, `PayPalButton` tabs when corresponding gateways are present in `paymentOptions`
