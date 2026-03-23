# DonorInfo Feature

**Status:** In Progress
**Last Updated:** March 20, 2026

---

## Overview

Collects donor identity and address info during the donation checkout. Renders one of two views depending on auth state.

| Condition                                                    | View                    |
| :----------------------------------------------------------- | :---------------------- |
| Logged in + valid profile (`firstname`, `lastname`, `image`) | `AuthenticatedUserView` |
| Otherwise                                                    | `GuestUserView`         |

---

## Component Structure

```
DonorInfo
├── AuthenticatedUserView
│   ├── ProfileCard
│   ├── AnonymousDonationField
│   └── AddressSection
│       ├── AddressSelector
│       └── AddressForm           ← only when selectedAddressId === 'new'
└── GuestUserView
```

---

## Components

### `ProfileCard`

Shows avatar, display name, email, and an **Organization** badge if applicable. Returns `null` if no profile exists.

### `AnonymousDonationField`

Checkbox bound to `isAnonymous` via React Hook Form. When checked, shows: _"Your name won't be shown publicly on the fundraiser page."_

### `AddressSection`

Syncs saved address data into the form via two `useEffect` hooks:

- On profile load → auto-selects primary address
- On address change → populates or clears all address fields (`address`, `address2`, `zipCode`, `city`, `state`, `country`)

Shows `AddressForm` only when `selectedAddressId === 'new'`.

---

## Guest View Fields

| Field                              | Required |
| :--------------------------------- | :------: |
| Email                              |    ✓     |
| First Name                         |    ✓     |
| Last Name                          |    ✓     |
| Country                            |    ✓     |
| Zip Code                           |    ✓     |
| Address                            |    ✓     |
| City                               |    ✓     |
| Address Line 2                     |    ✗     |
| State / Province                   |    ✗     |
| This donation is made by a Company |    ✗     |
| Make my donation anonymous         |    ✗     |

---

## Key Utilities

| Utility                                  | Purpose                   |
| :--------------------------------------- | :------------------------ |
| `getImageUrl('profile', 'thumb', image)` | Profile thumbnail URL     |
| `getDisplayName(profile)`                | Formatted display name    |
| `getPrimaryAddress(addresses[])`         | Picks the primary address |

---

## Future Work

- [ ] Document `GuestUserView` fields and validation rules
- [ ] Document `AddressSelector` option format and behaviour
- [ ] Confirm `AddressForm` validation schema (zip format per country)
