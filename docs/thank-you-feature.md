# Thank You Feature

**Status:** Implemented  
**Last Updated:** 2026-04-08

---

## Overview

The Thank You screen is an in-overlay confirmation view displayed to users immediately after completing a donation. It replaces the donation form inside the `DonateOverlay` dialog — there is no separate route (e.g., `/donate/thank-you`). The entire flow lives within a fixed overlay portal rendered to `document.body`.

The screen handles two primary payment outcomes:

| State                 | Trigger                                           | What the user sees                                                                   |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `completed`           | Payment succeeded (card, PayPal, Apple Pay, etc.) | Green checkmark, receipt-sent message, share section                                 |
| `bankTransferPending` | Payment returned `transfer_required`              | Amber badge, bank account details with copy buttons, frequency-specific instructions |

Failed payments do not navigate to the thank-you screen. They surface a `DonationFailureBanner` on the form itself, allowing the user to retry.

---

## File Structure

```
src/
├── app/(fundraiser)/fundraisers/[slug]/
│   └── page.tsx                          # Server component — fetches fundraiser + payment options
├── components/donate/
│   ├── donate-overlay.tsx                # Orchestrator: form ↔ thank-you conditional rendering
│   ├── donate-overlay-layout.tsx         # Fixed dialog shell (z-50, two-column, portal)
│   ├── donation-form-context.tsx         # React Hook Form + Zod provider
│   ├── donation-thank-you.tsx            # Root thank-you component — picks variant by status
│   ├── thank-you-card.tsx                # Reusable card: header band, icon, title, badge, children
│   ├── status-badge.tsx                  # 'completed' (green) / 'bankTransferPending' (amber) pill
│   ├── transfer-details-list.tsx         # Bank account fields for pending transfers
│   ├── copy-field-row.tsx                # Single copyable field row (label + copy button)
│   ├── share-section.tsx                 # Post-donation fundraiser share CTA
│   ├── donation-summary.tsx              # Right-column: image, allocations, total
│   ├── donate-cta.tsx                    # Submit button (Donate Now → Processing → Complete)
│   ├── donation-failure-banner.tsx       # Error banner with reset action
│   ├── payment-methods.tsx               # Payment method selector
│   └── use-donation-submit.ts            # Hook: submission flow, state machine, idempotency
├── components/fundraisers/
│   └── copy-link-button.tsx              # Shared copy-to-clipboard button
├── lib/
│   ├── api/
│   │   ├── donation-service.ts           # POST /donations — create donation
│   │   └── payment-service.ts            # PUT /donations/{id} — process payment
│   ├── donation/
│   │   ├── donation-submission.ts        # Two-step orchestrator: create → pay
│   │   └── payload-builder.ts            # Form values → API payload mapping
│   └── types/
│       ├── donation.ts                   # DonationFrequency, DonationFormData, DonationPayload
│       ├── donation-submit.ts            # ThankYouState union, DonationSubmitState
│       ├── payment.ts                    # PaymentMethod, PaymentResponse, BankAccountDetails
│       ├── payment-methods.ts            # PaymentMethodId, DerivedPaymentMethod
│       ├── payment-options.ts            # PaymentOptions, PaymentFrequency
│       └── submission-errors.ts          # Error code → i18n key mapping
└── locales/
    ├── en/donate.json                    # English strings (frequency-aware messages)
    └── de/donate.json                    # German translations
```

---

## Data Flow

### 1. Submission

```
User clicks "Donate Now"
  → useDonationSubmit.onSubmit()
    → donationService.submitDonation(payload, authToken?, idempotencyKey)
      ← DonationResponse { donationId, uid }
    → paymentService.processPayment(donationId, paymentRequest, authToken?, idempotencyKey)
      ← PaymentResponse (discriminated union)
```

`DonationResponse` carries `{ donationId, uid, amount, currency, frequency }`. `amount` is a decimal (e.g. `2.5` for €2.50). `frequency` is `null` in the API for one-time donations and mapped to `'once'` in `donation-service.ts`.

### 2. State Resolution

`resolveThankYouState()` in `use-donation-submit.ts` maps the API response to a `ThankYouState`:

```ts
// Discriminated union
type ThankYouState =
  | { status: 'completed'; donationId: string | null }
  | {
      status: 'bankTransferPending';
      donationId: string | null;
      uid: string | null;
      amount: number; // decimal, as returned by the API
      currency: string;
      frequency: DonationFrequency;
      transferAccount: BankAccountDetails;
    };
```

- **`PaymentResponse.status === 'success'`** with `transfer_required` flag → `bankTransferPending`
- **`PaymentResponse.status === 'success'`** without → `completed`
- **`PaymentResponse.status === 'failed'`** → error state (stays on form)

### 3. Rendering Decision

`donate-overlay.tsx` checks `donationState.thankYouState`:

```
thankYouState !== null  →  <DonationThankYou />
thankYouState === null  →  <DonationForm />
```

### 4. Component Responsibilities

| Layer                | Runs on | Responsibility                                    |
| -------------------- | ------- | ------------------------------------------------- |
| `page.tsx`           | Server  | Fetch fundraiser data and payment options         |
| `donate-overlay`     | Client  | Manage overlay lifecycle, form ↔ thank-you switch |
| `useDonationSubmit`  | Client  | API calls, state transitions, idempotency keys    |
| `donation-thank-you` | Client  | Render the correct thank-you variant              |

---

## Key Components

### `DonationThankYou`

- **File:** `donation-thank-you.tsx`
- **Responsibility:** Root component that receives `thankYouState` and renders the appropriate thank-you variant.
- **Props:** `thankYouState: ThankYouState`, fundraiser context (for share URL).
- **Behavior:** Delegates to `ThankYouCard` with variant-specific children (transfer details or share section).

### `ThankYouCard`

- **File:** `thank-you-card.tsx`
- **Responsibility:** Reusable presentation card with a warm header band (`#fdf8f0`), optional `CircleCheckBig` icon (completed variant), localized title, status badge, message body, and `children` slot.
- **Props:** `variant: ThankYouVariant`, `frequency?: DonationFrequency`, `formattedAmount?: string`, `children?: ReactNode`.
- **Behavior:** Renders the checkmark icon only for `completed` variant. For `bankTransferPending`, `frequency` and `formattedAmount` are required for the message — enforced by the call site via `ThankYouState` typing.

### `StatusBadge`

- **File:** `status-badge.tsx`
- **Props:** `variant: 'completed' | 'bankTransferPending'`
- **Behavior:** Green pill for completed, amber pill for pending. Label is localized.

### `TransferDetailsList`

- **File:** `transfer-details-list.tsx`
- **Responsibility:** Renders bank account details (amount, reference/uid, beneficiary, IBAN, BIC, bank name) as a list of `CopyFieldRow` components.
- **Props:** `account: BankAccountDetails`, `formattedAmount: string`, `uid: string | null`, `donationId: string | null`.
- **Behavior:** Each field is independently copyable. Transaction ID shown at the bottom as plain text. If all fields resolve to empty/null, renders an error message with a support email link and the transaction ID (if available).

### `CopyFieldRow`

- **File:** `copy-field-row.tsx`
- **Responsibility:** Single row with a label, value, and copy-to-clipboard button.
- **Behavior:** Uses `navigator.clipboard.writeText()`. Toggles to a `Check` icon for 2 seconds on success. Shows toast notification via `sonner`.

### `ShareSection`

- **File:** `share-section.tsx`
- **Responsibility:** Post-donation CTA encouraging users to share the fundraiser.
- **Behavior:** Constructs the share URL as `{origin}/fundraisers/{slug}` and renders a `CopyLinkButton`.

### `DonationFailureBanner`

- **File:** `donation-failure-banner.tsx`
- **Responsibility:** Displays submission errors on the form (not on the thank-you screen).
- **Behavior:** Maps error codes to localized messages. Close button calls `reset()` to clear the error state.

### `DonateCta`

- **File:** `donate-cta.tsx`
- **Responsibility:** Submit button with three visual states.
- **States:** Default ("Donate Now/Monthly/Yearly") → Loading ("Processing..." + spinner) → Success ("Donation Complete" + check icon).

---

## State Handling

### Storage Mechanism

Payment state is managed entirely in React component state via the `useDonationSubmit` hook:

```ts
// DonationSubmitState
{
  isLoading: boolean;
  thankYouState: ThankYouState | null;
  error: DonationSubmitError | null;
}
```

Initial state: `INITIAL_DONATION_STATE = { isLoading: false, thankYouState: null, error: null }`.

There is **no URL-based state** — the thank-you screen is not a separate route. State lives in the overlay's React tree.

### Idempotency

The hook generates and tracks idempotency keys for both the donation creation and payment processing requests, allowing safe retries without duplicate charges.

### Reset

Calling `reset()` returns state to `INITIAL_DONATION_STATE`, dismissing the thank-you screen or error banner and returning to the form.

### Fallback Handling

- If the overlay is closed and reopened, state resets — the thank-you screen is ephemeral.
- `donationId` and `uid` are typed as `string | null` to handle edge cases where the API returns incomplete data.

---

## UI Behavior

### Conditional Rendering

```
donationState.thankYouState !== null
  ├── status === 'completed'
  │     → ThankYouCard with checkmark icon
  │     → "Receipt sent via email" message
  │     → ShareSection
  └── status === 'bankTransferPending'
        → ThankYouCard without checkmark (amber badge)
        → Frequency-specific instructions (once/monthly/yearly)
        → TransferDetailsList with copyable bank fields

donationState.error !== null
  → DonationFailureBanner on form

donationState.isLoading === true
  → CTA button shows spinner + "Processing..."
  → Form inputs disabled
```

### Copy Interaction

All copy buttons follow a consistent pattern:

1. Click → `navigator.clipboard.writeText(value)`
2. Icon toggles from `Copy`/`Link` → `Check` (green)
3. Toast notification: "Copied!" or "Failed to copy"
4. Reverts after 2 seconds

### Localization

All user-facing strings are translated via `donate.json` namespace. Bank transfer messages are frequency-aware (`once`, `monthly`, `yearly` keys) to provide specific instructions per donation cadence.

---

## Routing Notes

The Thank You screen is **not a standalone route**. It renders inside the `DonateOverlay` component, which is a fixed-position dialog portal.

**Navigation flow:**

```
/fundraisers/[slug]
  → User clicks "Donate" → DonateOverlay opens (portal to document.body)
    → User completes form → thank-you renders in-place
      → User closes overlay → overlay unmounts, state resets
```

There are no query params or navigation state dependencies. The thank-you screen is purely driven by in-memory React state from `useDonationSubmit`.

---

## Edge Cases

| Scenario                                                              | Handling                                                                                                                                       |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Direct navigation to thank-you**                                    | Not possible — there is no `/thank-you` route. The screen only appears after a successful submission within the overlay.                       |
| **Missing payment response**                                          | `donationId` and `uid` are nullable. Components guard against `null` values.                                                                   |
| **Page refresh mid-overlay**                                          | Overlay state is ephemeral (React state only). Refresh resets everything — the user returns to the fundraiser page. No partial state persists. |
| **Incomplete bank transfer details**                                  | `BankAccountDetails` fields are rendered conditionally. Missing fields are omitted from the transfer list.                                     |
| **API inconsistency (success response but missing transfer account)** | `resolveThankYouState` maps to `completed` if transfer details are absent, even if the method was bank-transfer.                               |
| **Duplicate submission**                                              | Idempotency keys on both donation creation and payment processing prevent duplicate charges on retry.                                          |
| **Clipboard API unavailable**                                         | Copy buttons catch errors and show a "Failed to copy" toast instead of crashing.                                                               |

---

## Future Work

- **Additional payment methods:** Stripe-based methods (Google Pay, Apple Pay) and SEPA direct debit are typed but may not yet have full thank-you variants.
- **Social sharing:** Expand the share section beyond link copying to include direct social media share buttons (Twitter/X, WhatsApp, Facebook).
