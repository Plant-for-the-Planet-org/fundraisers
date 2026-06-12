---
name: use-donation-submit-flow-split
overview: "Structural refactor that splits the useDonationSubmit hook into per-gateway internal composables (useStripeFlow [card + SEPA + saved Stripe methods], usePlanetCashFlow, useBankTransferFlow, usePayPalFlow, useWalletFlow) sharing a common submission core, leaving useDonationSubmit as a thin orchestrator. NOTE: the form-submit path was split by gateway during execution - see the extract-card-flow todo. The originally-planned single useCardFlow became useStripeFlow + usePlanetCashFlow + useBankTransferFlow, with the orchestrator's onSubmit dispatching by selectedPaymentMethod." The hook's public return shape and all runtime behavior stay identical. This is the Tier 2 follow-up to the helper-extraction refactor in use-donation-submit-refactor.plan.md.
todos:
  - id: define-core-contract
    content: Define the SubmissionCore return type (donation-submit-flow-types.ts) and resolve the two open decisions before any code moves - (a) the home of resolveCreatedPaymentMethod (decision below = useCardFlow) and (b) which auth/config values the core must expose (token, donorProfile, paymentOptions). No code move in this step.
    status: completed
  - id: extract-submission-core
    content: Extract a useSubmissionCore hook that owns the shared state and helpers (donationState/setDonationState, submittingRef, donationKeyRef, paymentKeyRef, rotateIdempotencyKeys, failSubmission, finalizeFromDonation, buildPayloadFor, confirmCardActionPayment) AND re-exposes the values the flows read directly (token, donorProfile, paymentOptions; isAuthenticated stays internal to buildPayloadFor). Do NOT put paypalDonationIdRef or resolveCreatedPaymentMethod here. Return everything as one object for the flow hooks to consume.
    status: completed
  - id: extract-card-flow
    content: "REVISED during execution (see note below): the form-submit path was split by gateway, not card-only. Three flows now exist: usePlanetCashFlow(core) for the prepaid single-POST path; useBankTransferFlow(core) for the offline path (submitStandardPostpaidDonation with empty paymentDetails -> success/transfer_required -> bankTransferPending; the bankTransferPending branch was REMOVED from useStripeFlow since transfer_required is offline-only and card/SEPA never produce it); useStripeFlow(core, { sepaFormRef, cardFormRef, onPaymentValidationFailed }) for card + SEPA + saved Stripe methods. resolveCreatedPaymentMethod handles BOTH card and SEPA createPaymentMethod results (the original plan's card-only claim was wrong), so it lives in useStripeFlow. The orchestrator's single onSubmit is a switch dispatcher: planet_cash -> usePlanetCashFlow, bank_transfer -> useBankTransferFlow, else -> useStripeFlow. Each flow keeps its own guard/begin/try/catch/finally envelope (a small intentional duplication so each flow is self-contained); useStripeFlow's onSubmit dep array is preserved exactly from the pre-split onSubmit."
    status: completed
  - id: extract-paypal-flow
    content: Move onPayPalCreateOrder, onPayPalApproved, onPayPalError AND paypalDonationIdRef into usePayPalFlow(core), returning the three callbacks. paypalDonationIdRef is PayPal-only (written in createOrder, read in approved), so it is created here. Preserve dep arrays.
    status: completed
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
- **`paypalDonationIdRef` bridges the two PayPal callbacks.** It is only used within the PayPal flow (written in `onPayPalCreateOrder`, read in `onPayPalApproved`), so create it directly in `usePayPalFlow`. Do not seed it in the core and relocate it — that is needless churn.
- **The core must re-expose the auth/config values the flows read directly.** `token` is used directly in all four flows and appears in every flow's dep array. `donorProfile` is used directly in the card `onSubmit` email fallback and in its dep array. `paymentOptions` appears in every flow's dep array. `useSubmissionCore` must read `useAuthStore` once and return `{ token, donorProfile }`, and expose `paymentOptions`, so flows destructure them from `core` and keep value identity. Flows MUST NOT re-read `useAuthStore` themselves. (`isAuthenticated` is only used by `buildPayloadFor`, so it stays internal to the core.)
- **`resolveCreatedPaymentMethod` is a shared Stripe helper — it lives in `useStripeFlow`, not the core.** CORRECTION (found during execution): it is NOT card-only. The code calls it for both the card AND the SEPA `createPaymentMethod` results, and `onPaymentValidationFailed` fires for both. Because `useStripeFlow` owns card + SEPA, the helper lives there; route `onPaymentValidationFailed` into `useStripeFlow` only. Keep its dep `[onPaymentValidationFailed, setDonationState]` intact. (`confirmCardActionPayment`, by contrast, is shared more widely - Stripe card and wallet both use it - so it stays in the core.)
- **`reset` rotates keys.** `reset` calls `rotateIdempotencyKeys`, so it belongs with the core (or the orchestrator), not a single flow.
- **Closed-over hook params.** `buildPayloadFor` and `confirmCardActionPayment` close over `donationData`, `fundraiser`, `paymentOptions`, `isAuthenticated`, `donorProfile`. They are used by 2+ flows, so they belong in the core and every flow gets the same memoized instance. (`resolveCreatedPaymentMethod` closes over `onPaymentValidationFailed` and is a shared Stripe helper for card + SEPA — see the corrected bullet above; it lives in `useStripeFlow`.)
- **Asymmetric key rotation is load-bearing — copy each `finally`/rotation block verbatim.** Three different policies exist today and must be preserved exactly: `onPayPalCreateOrder` never rotates (only clears the guard + `stopLoading`), so its donation key survives into the approve step; `onPayPalApproved` rotates mid-flow, only after a non-failed payment, with no rotation in its `finally`; `onSubmit` and `onWalletConfirm` rotate in `finally` on every attempt. Do not normalize these.
- **`onPayPalCreateOrder` has a bespoke catch.** It sets `setDonationState(prev => ({ ...prev, error: toSubmitError(error) }))` and re-throws (the PayPal SDK needs the throw), unlike the other catches that use `withSubmitError`. Preserve the throw and the manual state shape.
- **`token || undefined` vs `token ?? undefined`.** Unchanged from Tier 1 — pass `token` through verbatim per call site; do not unify the operator.
- **Dep-array parity.** When a callback moves into a flow hook, its dependency array must list the same logical dependencies (now sourced from the `core` object). Destructure `core` at the top of each flow hook so the dep arrays reference stable identities. **Never put the `core` object itself in a dependency array** — it is a fresh object literal each render, so depending on it would re-create every flow callback on every render. Depend on the destructured members.
  - **Stable core members must be listed explicitly (policy set in step 1).** Once `submittingRef`/`donationKeyRef`/`paymentKeyRef`/`setDonationState` come from `core` instead of a direct `useRef`/`useState` in the same hook, `react-hooks/exhaustive-deps` can no longer prove they are stable and flags them. They ARE stable (ref objects and the state setter never change identity), so add them to the dep arrays where flagged: this is behavior-identical (no memoization drift) and keeps lint clean. This is NOT the "memoization is drifting" stop-condition — it is the expected, benign consequence of the extraction. Do the same in every subsequent flow-extraction step.

## Suggested shape

```ts
// use-donation-submit-core.ts (internal)
function useSubmissionCore(donationData, fundraiser, paymentOptions) {
  // reads useAuthStore once -> token, donorProfile, isAuthenticated
  // donationState/setDonationState, submittingRef, donationKeyRef, paymentKeyRef
  // rotateIdempotencyKeys, failSubmission, finalizeFromDonation,
  // buildPayloadFor, confirmCardActionPayment
  // exposes: token, donorProfile, paymentOptions (the values flows read directly)
  return { /* all of the above; NOT paypalDonationIdRef, NOT resolveCreatedPaymentMethod */ };
}

// resolveCreatedPaymentMethod + paypalDonationIdRef live in their owning flow hooks, not the core.
// NOTE (execution): the single useCardFlow became useStripeFlow + usePlanetCashFlow.
function useStripeFlow(core, { sepaFormRef, cardFormRef, onPaymentValidationFailed }) { return { onSubmit }; } // card + SEPA + saved Stripe methods
function usePlanetCashFlow(core) { return { onSubmit }; } // prepaid single-POST path
function usePayPalFlow(core) { return { onPayPalCreateOrder, onPayPalApproved, onPayPalError }; }
function useWalletFlow(core) { return { onWalletConfirm, onWalletError, onWalletCancel }; }

export function useDonationSubmit(donationData, fundraiser, paymentOptions, sepaFormRef, cardFormRef, onPaymentValidationFailed) {
  const core = useSubmissionCore(donationData, fundraiser, paymentOptions);
  const { onSubmit: onStripeSubmit } = useStripeFlow(core, { sepaFormRef, cardFormRef, onPaymentValidationFailed });
  const { onSubmit: onPlanetCashSubmit } = usePlanetCashFlow(core);
  // Single public onSubmit dispatches by selected method.
  const onSubmit = useCallback((values) =>
    values.selectedPaymentMethod === 'planet_cash' ? onPlanetCashSubmit(values) : onStripeSubmit(values),
    [onPlanetCashSubmit, onStripeSubmit]);
  const paypal = usePayPalFlow(core);
  const wallet = useWalletFlow(core);
  const reset = useCallback(() => { /* INITIAL state + rotate keys */ }, [core.rotateIdempotencyKeys]);
  return { donationState: core.donationState, onSubmit, ...paypal, ...wallet, reset };
}
```

Note `useSubmissionCore` no longer takes `onPaymentValidationFailed` — it moved to `useStripeFlow` along with `resolveCreatedPaymentMethod`. The core reads `useAuthStore` itself rather than receiving auth values as params.

**Open decision (resolved):** the flow hooks live in their own colocated files, matching the existing one-hook-per-file convention (`use-payment-options.ts`, `use-saved-payment-methods.ts`). Group them in a `src/components/donate/donation-submit/` subfolder so the four-file relationship is discoverable, with a `donation-submit-flow-types.ts` holding the `SubmissionCore` return type (this makes the core's contract explicit and stops the auth-exposure gap from recurring silently). Re-export `useDonationSubmit` so call-site import paths stay stable; grep for direct imports of the internal helpers before moving.

## Steps (in execution order)

0. **Define the core contract.** Add `donation-submit-flow-types.ts` with the `SubmissionCore` return type, and lock the two decisions (resolveCreatedPaymentMethod -> card; core exposes token/donorProfile/paymentOptions). No code move. Verify type-check.
1. **Extract `useSubmissionCore`.** Move the shared state + helpers, return them as an object, and re-expose `token`/`donorProfile`/`paymentOptions`. `useDonationSubmit` consumes `core.*` while still defining the flow callbacks inline. Do NOT move `paypalDonationIdRef` or `resolveCreatedPaymentMethod` here. Verify nothing changed.
2. **Extract `useStripeFlow` + `usePlanetCashFlow`.** (Revised from the original single `useCardFlow`.) Move the Stripe path (`onSubmit` for card + SEPA + saved methods) and `resolveCreatedPaymentMethod` into `useStripeFlow` (pass `core` + the two form refs + `onPaymentValidationFailed`); move the prepaid path into `usePlanetCashFlow(core)`. The orchestrator's `onSubmit` dispatches between them by `selectedPaymentMethod`. Verify.
3. **Extract `usePayPalFlow`.** Move the three PayPal callbacks and create `paypalDonationIdRef` inside this hook. Preserve the mid-flow rotation and the bespoke re-throwing catch verbatim. Verify.
4. **Extract `useWalletFlow`.** Move the three wallet callbacks. Verify.
5. **Rewire the orchestrator.** Confirm the returned object is identical in shape and key order is irrelevant to callers. Verify.
6. **Final verification.** type-check + lint clean; manually confirm shared refs are single instances and no flow re-reads `useAuthStore`.
7. **(Optional, separate commit) Renames.** e.g. `isSubmittingRef`, `*IdempotencyKeyRef`, `resolveStripePaymentMethodResult`. Keep relocation diffs pure by deferring renames to their own commit.

## Execution protocol

For each step:

1. Apply the change.
2. Run `npm run type-check` and `npm run lint`.
3. Confirm the diff introduces no behavior change and the public return shape is unchanged.
4. Mark the todo `completed` and move to the next.

Stop and reassess if either signal appears:

- Any step forces a dependency-array change that was not present before — the memoization is drifting.
- Any flow ends up calling `useAuthStore` or creating a `useRef` for a ref that should come from `core` — that is an accidentally-duplicated instance and breaks the single-shared-instance invariant.
