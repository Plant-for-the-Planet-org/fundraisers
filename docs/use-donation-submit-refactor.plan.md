---
name: use-donation-submit-refactor
overview: Behavior-preserving readability refactor of the useDonationSubmit hook — extract repeated setDonationState updaters, error-code mapping, idempotency-key rotation, and payload assembly into small reusable helpers. No functionality, behavior, signature, or business-logic changes.
todos:
  - id: state-updater-helpers
    content: Extract pure module-level state-updater factories (beginSubmission, withError, withSuccess, stopLoading) and replace the ~30 repeated setDonationState object literals.
    status: completed
  - id: map-payment-error-code
    content: Extract mapPaymentErrorCode helper to replace the triple-nested errorCode ternary repeated in onSubmit, onPayPalApproved, and onWalletConfirm.
    status: completed
  - id: rotate-idempotency-keys
    content: Extract rotateIdempotencyKeys helper for the donation/payment key-regeneration pair repeated in two finally blocks, onPayPalApproved, and reset.
    status: completed
  - id: finalize-from-donation
    content: Extract a helper that resolves the thank-you state from a donation and applies the success update, covering the optional initialThankYouState variant.
    status: completed
  - id: build-payload-helper
    content: Extract buildPayloadFor (assembleFormData -> getDonationProcessingFeeInfo -> buildDonationPayload) returning both formData and payload, used by onSubmit, onPayPalCreateOrder, and onWalletConfirm.
    status: completed
  - id: collapse-create-method-branches
    content: Optional/Medium risk - factor the shared 3-way result-classification ladder for the SEPA and card createPaymentMethod branches in onSubmit, preserving early-return semantics.
    status: completed
  - id: factor-card-action-confirm
    content: Optional/Medium risk - factor the StripeCardActionConfirmRequest + processPayment confirm step shared by onSubmit and onWalletConfirm.
    status: pending
isProject: false
---

## Goal

Improve readability and maintainability of [src/components/donate/use-donation-submit.ts](../src/components/donate/use-donation-submit.ts) by removing duplication and reducing per-branch noise.

**Hard constraints (apply to every step):**

- No functionality changes.
- No behavior changes.
- No API / signature changes (the hook's parameters and return shape stay identical).
- No business-logic changes.
- Each step is validated independently with `npm run type-check` and `npm run lint` before moving on.

The existing [TODO at line 421](../src/components/donate/use-donation-submit.ts#L421) anticipates a future `usePayPalFlow` / `useStripeFlow` split. That architectural rewrite is **out of scope** — these helpers are the incremental step that makes such a split easier later without committing to it now.

## Watch-outs that affect correctness

- **`token || undefined` vs `token ?? undefined`.** Both forms exist in the file. For a `string | null` token they are equivalent, but for `''` they diverge (`||` -> `undefined`, `??` -> `''`). Helpers must pass the token through **verbatim** per call site rather than unifying the operator, so no step changes this. Left as a deliberate observation, not a change.
- **PlanetCash token.** The PlanetCash branch uses a non-null, guarded `token`; other branches use `token ?? undefined`. Any shared helper must accept the token as an argument.
- **Early-return semantics.** Several branches `return` out of `onSubmit` after setting state. Helpers must not swallow these returns — the caller keeps control of `return`.
- **useCallback deps.** Module-level pure helpers (updater factories, mapPaymentErrorCode) touch no deps. Helpers that close over hook state (rotateIdempotencyKeys, finalizeFromDonation, buildPayloadFor) must be wrapped in `useCallback` with correct deps and added to the consuming callbacks' dep arrays without changing memoization behavior.

## Steps (in execution order)

### 1) State-updater helpers (Low risk, highest impact)

**Problem.** The shapes `{ ...prev, isLoading: false, error: { code } }` (~15x), `{ ...prev, isLoading: false, thankYouState }` (~8x), and `{ ...prev, isLoading: true, thankYouState: null, error: null }` (3x) repeat throughout.

**Refactor.** Pure module-level factories returning state updaters: `beginSubmission`, `withError(code)`, `withSuccess(thankYouState)`, `stopLoading`. Type `code` against the existing `error.code` union to keep call sites type-safe.

**Benefit.** Removes ~25 object literals; encodes the "errors/successes always clear isLoading" invariant once.

### 2) mapPaymentErrorCode (Low risk)

**Problem.** The `errorCode ? (SUBMISSION_ERROR_CODES[... as ServiceErrorCode] ?? 'paymentFailed') : 'paymentFailed'` ternary repeats 3x.

**Refactor.** A pure helper `mapPaymentErrorCode(errorCode?: string)`. Combined with step 1: `setDonationState(withError(mapPaymentErrorCode(paymentResponse.errorCode)))`.

**Benefit.** One home for the `as ServiceErrorCode` cast and the fallback.

### 3) rotateIdempotencyKeys (Low risk)

**Problem.** The donation/payment `generateIdempotencyKeyWithPrefix` pair repeats 4x.

**Refactor.** A stable `useCallback` (deps `[]`) that mutates both refs.

**Benefit.** Names the intent; centralizes the prefix strings.

### 4) finalizeFromDonation (Low-Medium risk)

**Problem.** `resolveThankYouStateFromDonation(...)` followed by a success `setDonationState` repeats ~6x.

**Refactor.** A helper accepting `(donationId, token, initialThankYouState?)`, resolving and applying `withSuccess`. The third arg covers the bankTransferPending variant.

**Benefit.** Collapses 6 paired sites; pairs with step 1.

### 5) buildPayloadFor (Medium risk)

**Problem.** `assembleFormData` -> `getDonationProcessingFeeInfo` -> `buildDonationPayload` repeats verbatim in 3 callbacks, differing only in the payment-method value passed.

**Refactor.** A `useCallback` returning `{ formData, payload }` (both needed downstream). Deps: `[donationData, fundraiser, paymentOptions, isAuthenticated, donorProfile]`.

**Benefit.** Removes ~60 lines of triplicated setup.

### 6) Collapse SEPA/card create-method branches (Medium risk, optional)

Factor only the shared 3-way result ladder (`!result` -> paymentFailed, `validationFailed` -> callback, `error` -> paymentFailed). The helper signals "handled, stop" vs "continue with paymentMethodId" — it must not return out of `onSubmit` directly.

### 7) Factor cardAction confirm step (Medium risk, optional)

Share only the `StripeCardActionConfirmRequest` construction + `processPayment` + failed-check, not the action call itself (callers obtain `paymentIntentId` differently).

## Execution protocol

For each step:

1. Apply the change.
2. Run `npm run type-check` and `npm run lint`.
3. Confirm the diff introduces no behavior change.
4. Mark the todo `completed` and move to the next.

Steps 1–4 are the low-risk batch. Step 5 follows. Steps 6–7 are optional follow-ups, each gated on a clean type-check + lint.
