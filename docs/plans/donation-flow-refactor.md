# Donation Flow Refactor Plan

**Status:** Planned  
**Last Updated:** 14 April 2026

---

## Motivation

`use-donation-submit.ts` is 598 lines and mixes UI state management, Stripe form interaction, PayPal flow, donation creation, payment processing, 3DS follow-up, idempotency handling, thank-you-state mapping, and error classification into a single hook. This makes it hard to read, test, and extend.

`payment-methods.tsx` (409 lines) similarly bundles method derivation, fee computation, selection state, accordion UI, and subform switching. `donation-form-context.tsx` (275 lines) bundles schema definition, validation rules, provider setup, and documentation.

The goal of this refactor is to apply a **structural split with no behavior change** — moving responsibility to focused modules whose names reflect what they do.

---

## Current Structure

```
src/
  components/donate/
    use-donation-submit.ts          598 lines — orchestration + Stripe + PayPal + state + errors
    donation-form-context.tsx       275 lines — schema + validation + provider + defaults + docs
    payment-methods.tsx             409 lines — derivation + fee text + accordion UI + subforms
    donate-overlay.tsx              161 lines — composition shell (acceptable as-is)
  lib/
    donation/
      donation-submission.ts        62 lines  — two-step wrapper: POST donation + PUT payment
    api/
      donation-service.ts           150 lines — HTTP client for POST /donations
      payment-service.ts            99 lines  — HTTP client for PUT /donations/{id}
```

---

## Proposed Structure

### `use-donation-submit` split

```
src/components/donate/
  use-donation-submit.ts
    — Thin orchestrator. Holds refs (submittingRef, donationKeyRef, paymentKeyRef,
      paypalDonationIdRef), useState, and exposes the public API:
      { donationState, onSubmit, onPayPalCreateOrder, onPayPalApproved,
        onPayPalError, reset }
    — Delegates to stripe-submit-flow.ts and paypal-submit-flow.ts for
      method-specific steps.

  stripe-submit-flow.ts
    — resolveStripePaymentDetails(values, formData, donorProfile, cardFormRef)
        Builds donorAddress, calls cardFormRef.current.createPaymentMethod,
        returns { paymentMethodId } or error.
    — resolveSepaPaymentDetails(values, formData, donorProfile, sepaFormRef)
        Builds name/email/address, calls sepaFormRef.current.createPaymentMethod,
        returns { paymentMethodId } or error.
    — handleCardAction(cardFormRef, paymentResponse, donationResponse, paymentAttemptKey, token)
        Handles action_required → cardAction branch:
        calls handleCardAction on form ref, builds confirmRequest,
        calls paymentService.processPayment.
    — handleCardPayment(cardFormRef, paymentResponse)
        Handles action_required → cardPayment branch:
        calls confirmCardPayment on form ref.
    — handleSepaAction(sepaFormRef, paymentResponse)
        Handles action_required → sepa-debit branch:
        calls confirmSepaDebitPayment on form ref.

  paypal-submit-flow.ts
    — createPayPalOrder(formData, fundraiser, donorProfile, token, paymentOptions, donationIdempotencyKey)
        Builds payload, submits donation, creates PayPal order.
    — processPayPalApproval(donationId, data, paymentOptions, token, paymentIdempotencyKey)
        Builds PayPal payment request, calls processPayment.

  donation-address.ts
    — resolveSelectedAddress(donorProfile, selectedAddressId)
        Returns the matching address from addresses array or falls back to
        addresses[0].
    — buildDonorBillingAddress(donor, selectedAddress, donorProfile)
        Returns the donorAddress object passed to createPaymentMethod:
        { line1, line2, city, state, zipCode, country }.

  resolve-thank-you-state.ts
    — resolveThankYouState(response, donationResponse): ThankYouState | null
        Extracted pure function, currently inline in use-donation-submit.ts.

  donation-submit-errors.ts
    — toSubmitError(error): DonationSubmitError
        Extracted pure function, currently inline in use-donation-submit.ts.
    — cleanPaymentDetails(details): Record<string, string | number | boolean>
        Extracted pure function, currently inline in use-donation-submit.ts.
```

### `payment-methods` split

```
src/components/donate/payment-methods/
  payment-methods.tsx
    — Composition root. Renders header, SelectedMethodTrigger, option list,
      active payment subform. Delegates data to useDerivedPaymentMethods.

  use-derived-payment-methods.ts
    — Hook that owns:
        availableMethods derivation (derivePaymentMethods)
        visibleMethods filter (SUPPORTED_METHOD_IDS)
        auto-select effect when selected method is no longer available
        visibleMethodOptions map (labels, feeText, feeTooltip)
      Returns: { visibleMethodOptions, selectedMethodOption, handleMethodSelect }

  payment-method-option.tsx
    — Presentational radio-button row (already a memo component, just move to
      own file).

  selected-method-trigger.tsx
    — Presentational collapsed/expanded trigger (already a memo component, just
      move to own file).

  method-fee-details.tsx
    — Presentational fee text + tooltip row (already a memo component, just move
      to own file).
```

### `donation-form-context` split

```
src/components/donate/
  donation-form-schema.ts
    — donationFormSchema (Zod schema + superRefine validation rules)
    — DonationFormValues type

  donation-form-defaults.ts
    — defaultDonationFormValues object

  donation-form-context.tsx
    — DonationFormProvider component
    — useDonationForm hook
    — JSDoc explaining register / useController / control choice
    — DevTool dynamic import
    — useEffect for reset on close
```

---

## Migration Approach

Do this in three PRs, each no-behavior-change:

**PR A — Extract pure functions from `use-donation-submit.ts`**

- Move `resolveThankYouState`, `toSubmitError`, `cleanPaymentDetails` to their own files.
- Move `resolveSelectedAddress` and `buildDonorBillingAddress` to `donation-address.ts`.
- Import them back into the hook. Hook line count drops by ~80 lines.

**PR B — Extract Stripe and PayPal flow steps**

- Move all Stripe-specific branches into `stripe-submit-flow.ts` as pure async functions.
- Move PayPal create/approve logic into `paypal-submit-flow.ts`.
- The hook becomes an orchestrator that calls these functions and updates state.
- Hook line count drops to ~150–200 lines.

**PR C — Split `payment-methods.tsx` and `donation-form-context.tsx`**

- Extract the three memo components to their own files.
- Extract `useDerivedPaymentMethods` hook.
- Extract schema, defaults, and context into separate files.
- No functional change.

---

## Out of Scope for This Refactor

- Behavioral changes to the submission flow.
- Introduction of the pending-payment state (separate plan: `pending-payment-state.md`).
- Tests (should be added after extraction since pure functions become directly testable).
- React Server Component conversion.
