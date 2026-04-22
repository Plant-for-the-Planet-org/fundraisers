# Donation Gift — Invitation Gift Fields

**Status:** In progress  
**Branch:** `feature/invitation-gifts`  
**Last Updated:** 22 April 2026

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

Gift fields live in `DonationForm` (the widget), not in the overlay. The widget uses `useState` for all its fields — no RHF.

Validation runs on the Donate button click: if `isDedicated`, validate gift fields; if invalid, set error state and abort; if valid, construct `SentInvitationGift` and call `onDonate` with it.

Data flow: `DonationForm` → `onDonate(amount, isDedicated, frequency, gift?)` → `DonationSection` → `DonationData.gift` → `donationData` in context → `assembleFormData` → `buildDonationPayload` → API payload.

The overlay also receives the gift and renders a non-editable `GiftSummary` component so the donor can review their gift details before paying.

---

## Validation Rules

| Field | Required? | Validation |
|---|---|---|
| `recipientName` | Yes (when dedicated) | Non-empty |
| `recipientEmail` | No, unless message present | Valid email format |
| `message` | No | — |

---

## Extensibility

Only `SentInvitationGift` (from `@planet-sdk/common`) is implemented. A future gift type:
- adds fields to `DonationForm` (new state + conditional render)
- adds a new branch in the payload assembly in `payload-builder.ts`

The overlay, `DonationPayload` type, and `DonationData` interface stay largely unchanged.

---

## Future: GiftSummary UI

`GiftSummary` is a temporary placeholder component — its layout and styling are subject to design review. Currently it renders a simple labelled list of the gift details (recipient name, email if present, message if present) in the overlay's left column between `DonorInfo` and `PaymentMethods`. The final design may replace or significantly restyle this component.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/types/donation.ts` | `gift?: SentInvitationGift` on `DonationFormDataBase` and `DonationPayload` |
| `src/components/donate/donate-overlay.tsx` | `gift?: SentInvitationGift` added to `DonationData`; `<GiftSummary />` in left column |
| `src/components/fundraisers/donation-form.tsx` | Gift state + fields rendered below checkbox; validate + pass gift in `onDonate` |
| `src/components/fundraisers/donation-section.tsx` | Thread `gift` from `onDonate` callback into `DonationData` |
| `src/lib/donation/payload-builder.ts` | Pass `donationData.gift` through `assembleFormData` and into `buildDonationPayload` |
| `locales/en/fundraisers.json` | Gift field labels, placeholders, error messages |
| `locales/de/fundraisers.json` | German equivalents |

## New Files

| File | Purpose |
|---|---|
| `src/components/donate/gift-summary.tsx` | Read-only gift details in overlay (placeholder — UI TBD) |

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
