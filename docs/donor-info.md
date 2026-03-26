# DonorInfo Feature

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
    ├── DonorIdentityForm
    ├── AnonymousDonationField
    └── AddressForm
```

---

## Components

### `ProfileCard`

Shows avatar, display name, email, and an **Organization** badge if applicable. Returns `null` if no profile exists.

### `AnonymousDonationField`

Checkbox bound to `isAnonymous` via React Hook Form. When checked, shows: _"Your name won't be shown publicly on the fundraiser page."_

Used in both `AuthenticatedUserView` and `GuestUserView`.

### `AddressSection`

Syncs saved address data into the form via two `useEffect` hooks:

- On profile load → auto-selects primary address
- On address change → populates or clears all address fields (`address`, `address2`, `zipCode`, `city`, `state`, `country`)

Shows `AddressForm` only when `selectedAddressId === 'new'`.

### `DonorIdentityForm`

Collects identity fields for unauthenticated donors. Rendered as the first section inside `GuestUserView`.

Uses `useFormContext<DonationFormValues>()` and `useController` (React Hook Form). Conditionally renders a **Company Name** field when `isCompany` is checked.

#### Fields

| Field            | Type     | Required | Notes                                                             |
| :--------------- | :------- | :------: | :---------------------------------------------------------------- |
| Company Donation | Checkbox |    ✗     | Bound to `isCompany`                                              |
| Company Name     | Text     |   ✓\*    | Visible only when `isCompany` is `true`; bound to `companyName`   |
| Email            | Email    |    ✓     | Bound to `email`                                                  |
| First Name       | Text     |    ✓     | Bound to `firstname`; renders in a 2-col grid alongside Last Name |
| Last Name        | Text     |    ✓     | Bound to `lastname`; renders in a 2-col grid alongside First Name |

_\* Required only when Company Donation is checked._

#### Behaviour

- First Name and Last Name render side-by-side using a responsive 2-column grid (`grid-cols-1 sm:grid-cols-2`).
- Company Name is indented (`ml-6`) and only mounted when `isCompany` is `true`.
- All text uses i18n keys under the `Donate.donorIdentity` namespace.

---

## Guest View Fields

The full set of fields collected from unauthenticated donors, across `DonorIdentityForm`, `AnonymousDonationField`, and `AddressForm`:

| Field                              | Source                   | Required |
| :--------------------------------- | :----------------------- | :------: |
| This donation is made by a Company | `DonorIdentityForm`      |    ✗     |
| Company Name                       | `DonorIdentityForm`      |   ✓\*    |
| Email                              | `DonorIdentityForm`      |    ✓     |
| First Name                         | `DonorIdentityForm`      |    ✓     |
| Last Name                          | `DonorIdentityForm`      |    ✓     |
| Make my donation anonymous         | `AnonymousDonationField` |    ✗     |
| Country                            | `AddressForm`            |    ✓     |
| Zip Code                           | `AddressForm`            |    ✓     |
| Address                            | `AddressForm`            |    ✓     |
| City                               | `AddressForm`            |    ✓     |
| Address Line 2                     | `AddressForm`            |    ✗     |
| State / Province                   | `AddressForm`            |    ✗     |
