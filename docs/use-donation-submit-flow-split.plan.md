---
name: use-donation-submit-flow-split
overview: Structural refactor that splits the useDonationSubmit hook into per-gateway internal composables (useCardFlow, usePayPalFlow, useWalletFlow) sharing a common submission core, leaving useDonationSubmit as a thin orchestrator. The hook's public return shape and all runtime behavior stay identical. This is the Tier 2 follow-up to the helper-extraction refactor in use-donation-submit-refactor.plan.md.
todos:
  - id: extract-submission-core
    content: Extract a useSubmissionCore hook that owns the shared state and helpers (donationState/setDonationState, submittingRef, donationKeyRef, paymentKeyRef, paypalDonationIdRef, rotateIdempotencyKeys, failSubmission, finalizeFromDonation, buildPayloadFor, classifyPaymentMethodResult, confirmCardActionPayment) and returns them for the flow hooks to consume.
    status: pending
  - id: extract-card-flow
    content: Move the onSubmit callback into useCardFlow(core, { sepaFormRef, cardFormRef, onPaymentValidationFailed }), returning { onSubmit }. Preserve the dep array exactly.
    status: pending
  - id: extract-paypal-flow
    content: Move onPayPalCreateOrder, onPayPalApproved, onPayPalError into usePayPalFlow(core), returning the three callbacks. Preserve dep arrays.
    status: pending
  - id: extract-wallet-flow
    content: Move onWalletConfirm, onWalletError, onWalletCancel into useWalletFlow(core), returning the three callbacks. Preserve dep arrays.
    status: pending
  - id: rewire-orchestrator
    content: Reduce useDonationSubmit to wiring - call useSubmissionCore, pass it to the three flow hooks, and return the same object shape (donationState, onSubmit, onPayPal*, onWallet*, reset). reset stays on the orchestrator/core.
    status: pending
  - id: verify-no-behavior-change
    content: Confirm type-check + lint pass and the returned API is byte-for-byte the same shape; spot-check that submittingRef and the key refs are single shared instances across all flows.
    status: pending
isProject: false
---

## Goal

Reduce `useDonationSubmit` from one ~640-line hook that owns three payment flows into a thin orchestrator over three cohesive per-gateway composables, without changing any behavior or its public contract. This is the structural step the in-code TODO anticipates ("extract usePayPalFlow / useStripeFlow as internal composables that receive shared refs/state as arguments, keeping useDonationSubmit as the orchestrator").

**Hard constraints (apply to every step):**

- No functionality changes.
- No behavior changes.
- No public API / signature changes — `useDonationSubmit`'s parameters and returned object stay identical.
- No business-logic changes.
- Memoization parity: every returned callback keeps the same dependency array it has today.
- Each step is validated independently with `npm run type-check` and `npm run lint` before moving on.

This plan assumes the Tier 1 extraction is already done: the pure state helpers now live in [src/lib/donation/donation-submit-state.ts](../src/lib/donation/donation-submit-state.ts).

## Why this is riskier than Tier 1

Tier 1 moved pure, stateless functions — relocation could not change behavior. Tier 2 moves **stateful, memoized callbacks** that close over shared mutable refs. The correctness of the whole hook depends on those refs being **single shared instances**, so the split must thread them through, never re-create them per flow.

## Watch-outs that affect correctness

- **`submittingRef` is the cross-flow guard.** Every flow reads and writes the same `submittingRef` to block concurrent submissions (e.g. a card submit while a PayPal order is in flight). It MUST be created once in the core and passed by reference to all flow hooks. Creating it inside each flow hook would silently break the mutual exclusion.
- **`donationKeyRef` / `paymentKeyRef` are shared idempotency keys.** `onSubmit` and `onWalletConfirm` reuse the same attempt-scoped keys for `action_required` follow-ups and rotate them in their `finally`. `onPayPalApproved` rotates them mid-flow. All flows must share the same two refs and the same `rotateIdempotencyKeys`.
- **`paypalDonationIdRef` bridges the two PayPal callbacks.** It is only used within the PayPal flow, so it can live in `usePayPalFlow` — but double-check no other flow reads it before moving it out of the core.
- **`reset` rotates keys.** `reset` calls `rotateIdempotencyKeys`, so it belongs with the core (or the orchestrator), not a single flow.
- **Closed-over hook params.** `buildPayloadFor`, `classifyPaymentMethodResult`, and `confirmCardActionPayment` close over `donationData`, `fundraiser`, `paymentOptions`, `isAuthenticated`, `donorProfile`, `onPaymentValidationFailed`. These belong in the core so all flows get the same memoized instances.
- **`onPaymentValidationFailed` is card-flow-only via the helper.** It feeds `classifyPaymentMethodResult` (used only by `onSubmit`). Decide deliberately whether `classifyPaymentMethodResult` lives in the core (shared) or in `useCardFlow` (its only consumer). Either is fine; keep its dep `[onPaymentValidationFailed]` intact.
- **`token || undefined` vs `token ?? undefined`.** Unchanged from Tier 1 — pass `token` through verbatim per call site; do not unify the operator.
- **Dep-array parity.** When a callback moves into a flow hook, its dependency array must list the exact same dependencies (now sourced from the `core` object). Destructure `core` at the top of each flow hook so the dep arrays reference stable identities.

## Suggested shape

```ts
// useSubmissionCore.ts (internal)
function useSubmissionCore(donationData, fundraiser, paymentOptions, onPaymentValidationFailed) {
  // donationState/setDonationState, submittingRef, donationKeyRef, paymentKeyRef
  // rotateIdempotencyKeys, failSubmission, finalizeFromDonation,
  // buildPayloadFor, classifyPaymentMethodResult, confirmCardActionPayment
  return { /* all of the above */ };
}

function useCardFlow(core, { sepaFormRef, cardFormRef }) { return { onSubmit }; }
function usePayPalFlow(core) { return { onPayPalCreateOrder, onPayPalApproved, onPayPalError }; }
function useWalletFlow(core) { return { onWalletConfirm, onWalletError, onWalletCancel }; }

export function useDonationSubmit(donationData, fundraiser, paymentOptions, sepaFormRef, cardFormRef, onPaymentValidationFailed) {
  const core = useSubmissionCore(donationData, fundraiser, paymentOptions, onPaymentValidationFailed);
  const { onSubmit } = useCardFlow(core, { sepaFormRef, cardFormRef });
  const paypal = usePayPalFlow(core);
  const wallet = useWalletFlow(core);
  const reset = useCallback(() => { /* INITIAL state + rotate keys */ }, [core.rotateIdempotencyKeys]);
  return { donationState: core.donationState, onSubmit, ...paypal, ...wallet, reset };
}
```

**Open decision (resolve before coding):** whether the flow hooks live in the same file as `useDonationSubmit` (smaller hook, same file) or in their own colocated files (`use-card-flow.ts`, etc.). Separate files maximize the size win but add surface area; same-file keeps everything discoverable. Recommendation: separate files under `src/components/donate/`, matching the existing one-hook-per-file convention (`use-payment-options.ts`, `use-saved-payment-methods.ts`).

## Steps (in execution order)

1. **Extract `useSubmissionCore`.** Move the shared state + helpers, return them as an object. `useDonationSubmit` consumes `core.*` while still defining the flow callbacks inline. Verify nothing changed.
2. **Extract `useCardFlow`.** Move `onSubmit`; pass `core` + the two form refs. Verify.
3. **Extract `usePayPalFlow`.** Move the three PayPal callbacks and `paypalDonationIdRef`. Verify.
4. **Extract `useWalletFlow`.** Move the three wallet callbacks. Verify.
5. **Rewire the orchestrator.** Confirm the returned object is identical in shape and key order is irrelevant to callers. Verify.
6. **Final verification.** type-check + lint clean; manually confirm shared refs are single instances.

## Execution protocol

For each step:

1. Apply the change.
2. Run `npm run type-check` and `npm run lint`.
3. Confirm the diff introduces no behavior change and the public return shape is unchanged.
4. Mark the todo `completed` and move to the next.

Stop and reassess if any step forces a dependency-array change that was not present before — that is a signal the memoization is drifting.
