# Donation Gift — Invitation Gift Fields

**Status:** In progress  
**Branch:** `feature/invitation-gifts`  
**Last Updated:** 23 April 2026

---

## Motivation

The `DonationForm` widget already has a "Dedicate this donation" checkbox (`allow_dedication` feature flag) that sets `isDedicated` in local state. That boolean propagates into `DonationData.dedicated` and reaches the overlay, but the submission payload never includes a `gift` object.

This change adds recipient name, email, and message fields directly in the widget card below the checkbox. When the user clicks Donate, the gift data is passed to the overlay, displayed as a read-only summary, and included in the API payload as `gift: { type: "invitation", ... }`.

---

## API Payload Shape

```json
{
  "gift": {
    "type": "invitation",
    "recipientName": "Jane Smith",
    "recipientEmail": "jane@example.com",
    "message": "Happy birthday!"
  }
}
```

`recipientEmail` and `message` are optional. `recipientEmail` becomes required when `message` is present.

---

## Architecture

Gift fields live in `DonationForm` (the widget), not in the overlay. The widget uses `useState` for all its fields - no RHF.

Validation runs on the Donate button click: if `isDedicated`, validate gift fields; if invalid, set error state and abort; if valid, construct `SentInvitationGift` and call `onDonate` with it. Validation is implemented with a local zod schema and trim-normalized values.

Data flow: `DonationForm` → `onDonate(amount, isDedicated, frequency, gift?)` → `DonationSection` → `DonationData.gift` → `donationData` in context → `assembleFormData` → `buildDonationPayload` → API payload.

The overlay also receives the gift and renders a non-editable `GiftSummary` component so the donor can review their gift details before paying.

### Current Implementation Notes

- Gift validation is extracted to `src/lib/donation/gift-validation.ts` and consumed by `DonationForm`.
- Email validation uses non-deprecated zod APIs (`z.email(...)`) with preprocess trim.
- Validation keeps the cross-field rule: if message is present, recipient email is required.
- Input values are trim-normalized before building `SentInvitationGift`.
- The dedication toggle has accessibility attributes (`aria-label`, `aria-pressed`).
- `GiftSummary` no longer uses a non-null assertion for gift data and now includes a top-right heart icon.

---

## Refactor Plan: Extract Gift Section From DonationForm

### Goal

Reduce `DonationForm` complexity by extracting gift-specific UI and validation wiring while preserving existing behavior and public APIs.

### Scope

- Extract gift-specific UI (toggle + fields + errors) into a dedicated component.
- Extract zod schema and validation error mapping into a helper module.
- Keep `onDonate(...)` contract unchanged.
- Keep payload/data flow unchanged.

### Non-Goals

- No payload shape changes.
- No translation key changes.
- No visual redesign.
- No broader form architecture changes (still no RHF).

### Proposed File-Level Changes

1. Add a gift section component under `src/components/fundraisers/` (for example `donation-gift-section.tsx`) for dedicated toggle + fields.
2. Add a gift validation helper under `src/lib/donation/` (for example `gift-validation.ts`) for zod schema and issue-to-error-key mapping.
3. Simplify `src/components/fundraisers/donation-form.tsx` to orchestrate state and submit flow only.

### Execution Checklist

- [x] Create typed gift state and error types in extracted module or colocated helper.
- [x] Move gift UI rendering from `DonationForm` into new section component.
- [x] Move zod schema and cross-field validation rules into helper module.
- [x] Keep exact current validation behavior (trim normalization, message-email dependency).
- [x] Keep exact current error-clearing behavior on field edits.
- [x] Keep accessibility semantics on dedication toggle.
- [x] Keep `onDonate(amount, isDedicated, frequency, gift?)` behavior unchanged.
- [x] Run `npm run type-check`.
- [x] Smoke-test donation flow paths in widget/overlay (code-level flow verification).

### Smoke Validation Notes

- Completed code-level smoke validation of gift flow wiring:
  - `DonationForm` validates and emits gift.
  - `DonationSection` forwards gift into `DonationData`.
  - `assembleFormData` / `buildDonationPayload` include `gift`.
  - `GiftSummary` renders dedicated gift details from context.
- Manual browser interaction smoke test is still recommended before merge.

---

## Validation Rules

| Field            | Required?                  | Validation         |
| ---------------- | -------------------------- | ------------------ |
| `recipientName`  | Yes (when dedicated)       | Non-empty          |
| `recipientEmail` | No, unless message present | Valid email format |
| `message`        | No                         | —                  |

---

## Extensibility

Only `SentInvitationGift` (from `@planet-sdk/common`) is implemented. A future gift type:

- adds fields to `DonationForm` (new state + conditional render)
- adds a new branch in the payload assembly in `payload-builder.ts`

The overlay, `DonationPayload` type, and `DonationData` interface stay largely unchanged.

---

## GiftSummary UI

`GiftSummary` sits in the **right column of the overlay, above `DonationSummary`**. It renders only when `donationData.dedicated === true` and a gift is present.

### Visual structure

```
Dedicated to John Doe

  "some message goes here"

An email with your message and a certificate will be sent to johndoe@example.com
```

- **Heading**: "Dedicated to {recipientName}" — `font-semibold`
- **Message block** (conditional — only when `message` is present): the message text in a blockquote-style indent, wrapped in typographic quotes (`"…"`)
- **Email line** (conditional — only when `recipientEmail` is present): a single sentence informing the donor that an email and certificate will be sent

### Translation keys needed

Under `Donate.gift` (in `locales/{en,de}/donate.json`):

| Key                    | EN value                                                                        |
| ---------------------- | ------------------------------------------------------------------------------- |
| `dedicatedTo`          | `Dedicated to {recipientName}`                                                  |
| `emailNotice`          | `An email with your message and a certificate will be sent to {recipientEmail}` |
| `emailNoticeNoMessage` | `A certificate will be sent to {recipientEmail}`                                |

(`emailNoticeNoMessage` covers the case where email is present but no message was entered.)

### Placement change

The component moves from the **left column** (between `DonorInfo` and `PaymentMethods`) to the **right column** (above `DonationSummary`). The left column import and render are removed; the right column gains a `<GiftSummary />` before `<DonationSummary />`.

---

## Files Changed

| File                                                   | Change                                                                                                                            |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/types/donation.ts`                            | `gift?: SentInvitationGift` on `DonationFormDataBase` and `DonationPayload`                                                       |
| `src/components/donate/donate-overlay.tsx`             | `gift?: SentInvitationGift` added to `DonationData`; `<GiftSummary />` moved to right column above `<DonationSummary />`          |
| `src/components/fundraisers/donation-form.tsx`         | Orchestrates gift state + submit flow; delegates gift UI and validation to extracted modules                                      |
| `src/components/fundraisers/donation-section.tsx`      | Thread `gift` from `onDonate` callback into `DonationData`                                                                        |
| `src/lib/donation/payload-builder.ts`                  | Pass `donationData.gift` through `assembleFormData` and into `buildDonationPayload`                                               |
| `locales/en/fundraisers.json`                          | Gift field labels, placeholders, error messages                                                                                   |
| `locales/de/fundraisers.json`                          | German equivalents                                                                                                                |
| `src/components/donate/gift-summary.tsx`               | Redesigned read-only gift summary (title typography aligned with `DonationSummary`, heart icon, message blockquote, email notice) |
| `src/components/fundraisers/donation-gift-section.tsx` | Extracted gift UI section (toggle, fields, error display)                                                                         |
| `src/lib/donation/gift-validation.ts`                  | Extracted zod schema + gift validation helper                                                                                     |
| `locales/en/donate.json`                               | `dedicatedTo`, `emailNotice`, `emailNoticeNoMessage` keys                                                                         |
| `locales/de/donate.json`                               | German equivalents                                                                                                                |

## New Files

| File                                                   | Purpose                                                    |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| `src/components/donate/gift-summary.tsx`               | Read-only gift details in overlay right column             |
| `src/components/fundraisers/donation-gift-section.tsx` | Extracted donation widget gift UI                          |
| `src/lib/donation/gift-validation.ts`                  | Extracted zod-based gift validation and error code mapping |

---

## Testing Checklist

- [ ] `allow_dedication: true` on fundraiser → "Dedicate this donation" checkbox visible
- [ ] Check checkbox → gift fields appear below it in the widget
- [ ] Click Donate without recipient name → validation error on that field
- [ ] Enter message without email → email required error
- [ ] Enter invalid email → invalid email error
- [ ] Valid data → overlay shows read-only gift summary with correct details
- [ ] Valid data → POST `/donations` body includes `gift: { type: "invitation", ... }`
- [ ] Leave dedication unchecked → gift fields hidden, gift summary absent, `gift` absent from payload
- [ ] German locale → translated labels and error messages
