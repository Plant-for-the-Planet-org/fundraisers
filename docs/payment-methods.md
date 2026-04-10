# Payment Methods Feature Plan (`fundraiser` donate overlay)

## Summary

Implement `PaymentMethods` in `fundraiser` with **gofundnature-matching collapsible selector UI** (selector-only scope), using available gateways/methods from `DonationFormContext.paymentOptions`.  
Method list will be dynamic (no hardcoded availability), with legacy-style fee labels/tooltip content powered by ported fee logic.  
No saved-card/SEPA-account sub-dropdowns or card/IBAN forms in this slice.

## Implementation Changes

- Build payment-method derivation in `lib` from `paymentOptions.gateways`:
  - Normalize method ids (`sepa_debit`/`sepa-debit`, `bank-transfer`/`offline`, etc.).
  - Dedupe and enforce stable legacy display order.
  - Filter rules aligned with legacy behavior (SEPA hidden for non-EUR).
  - Include provider mapping needed for fee calculation (`stripe`, `paypal`, `offline`).
- Port fee calculation utilities from `gofundnature` into `fundraiser/lib`:
  - Region-based fee rules (US/EU/ROW), `No fee` handling, and tooltip copy generation.
  - Keep fee rendering behind fee-collection toggle parity (`NEXT_PUBLIC_ALLOW_FEE_COLLECTION`, default enabled).
- Replace placeholder `src/components/donate/payment-methods.tsx`:
  - Use `useDonationForm()` for `paymentOptions`, `donationData`, `fundraiser`.
  - Use RHF form state (`selectedPaymentMethod`) from `DonationFormContext`.
  - Auto-select first available method when empty/invalid; guard updates to avoid loops.
  - Implement exact selector-only UI pattern from gofundnature:
    - Collapsed selected-method summary row
    - Expandable method list with radio/check state
    - Disabled state rendering (if any method resolves disabled in future)
    - Fee text and info icon tooltip content per method
  - Render localized empty state when no methods are available.
- Add i18n keys in `locales/en/de/fundraisers.json` under `Fundraisers.donate.paymentMethods`:
  - Section heading/description, empty-state text, select-method fallback.
  - Method labels (card, sepa, paypal, bank transfer, open banking, apple pay, google pay).
  - Fee-related copy (`noFee`, tooltip text templates where needed).

## Public APIs / Types

- Add internal payment-method domain types in `fundraiser/lib` for derived UI methods (id, provider, label key, fee, tooltip, disabled).
- Keep `DonationFormValues.selectedPaymentMethod` shape unchanged (`string` field in RHF); no external API contract changes.
- No backend contract changes; source of truth remains `PaymentOptions` from context.

## Test Plan

1. Gateway-to-method derivation:
   - Stripe (`card`, `sepa_debit`) + PayPal + Offline yields all expected methods in legacy order.
   - Unknown method ids are ignored safely.
2. Normalization:
   - Both underscore and hyphen method variants map correctly.
3. Filtering:
   - SEPA hidden when currency is not EUR.
4. RHF integration:
   - First available method auto-selected on first render.
   - No infinite re-render loop when selection is already valid.
5. UI parity:
   - Collapsed summary and expandable method list match legacy interaction.
   - Selecting a method updates checked state and collapses list.
6. Fees:
   - Fee labels/tooltip text appear when fee collection enabled.
   - Fee labels hidden when `NEXT_PUBLIC_ALLOW_FEE_COLLECTION=false`.
7. Localization:
   - All payment-method strings render in both `en` and `de`.

## Assumptions

- Scope is **selector-only parity** for this step (no saved-method dropdown or new-card/new-SEPA forms).
- “Exact same UI” is interpreted as matching legacy selector structure/interaction and visual rhythm within fundraiser’s existing theme tokens.
- Available methods are derived strictly from `paymentOptions` context (no fallback hardcoding of availability).
- This slice does not implement payment SDK forms or submit payload changes.
