# Naming Conventions

> This is a living document. Update it when conventions change or new patterns emerge.

## Files and Folders

- Use `kebab-case` for all file and folder names
- Match the file name to the primary export: `FundraiserCard` → `fundraiser-card.tsx`
- Feature folders group related components: `components/explore/`, `components/header/`

## Components

- Use `PascalCase` for component names
- Let the folder provide location context — do not repeat it in the component name:

```ts
// ✓ components/explore/browse-categories.tsx
export function BrowseCategories() { ... }

// ✗ Redundant folder prefix
export function ExploreBrowseCategories() { ... }
```

- Avoid suffixing components with their rendering mode — rendering is an implementation detail and `'use client'` already communicates it. Prefer names that describe purpose instead:

```ts
// ✓
export function DonationForm() { ... }       // client component
export function DonationFormLoader() { ... } // server component that fetches data

// ✗ Prefer purpose over rendering mode
export function DonationFormClient() { ... }
export function DonationFormInteractive() { ... }
```

When a server/client split genuinely needs to be explicit (e.g. two complementary components with the same conceptual name), a suffix is acceptable — but keep it descriptive of the role, not the directive (`-Loader`, `-Shell`, `-Provider` rather than `-Server`/`-Client`).

- One component per file as a general rule. Co-locating closely related components in the same file is acceptable when they form a natural unit — for example, a component and its skeleton/loading state:

```ts
// fundraiser-categories.tsx
export async function CategoriesSkeleton() { ... }  // loading state
export async function FundraiserCategories() { ... } // the real component
```

If a component starts being reused elsewhere, move it to its own file.

- Named exports only — no default exports

## Props

Props interfaces follow the `ComponentNameProps` pattern and are defined in the same file as the component:

```ts
interface FundraiserCardProps {
  fundraiser: Fundraiser;
  className?: string;
}

export function FundraiserCard({ fundraiser, className }: FundraiserCardProps) { ... }
```

## Functions and Variables

- Use `camelCase` for functions, variables, and hook calls
- Module-level constants use `SCREAMING_SNAKE_CASE`:

```ts
export const API_BASE_URL = '...';
export const FOOTER_LINKS = [...] as const;
```

## Booleans

Prefix boolean variables and props with `is`, `has`, or `can`:

```ts
isPublic: boolean
canDonate: boolean
hasCurrencySymbol(currency: string): boolean
```

## Hooks

Custom hooks use the `use` prefix:

```ts
export function useLocaleStore() { ... }
export function useTheme() { ... }
```

## TypeScript Types

- Use `interface` for object shapes
- Use `type` for unions, aliases, and utility types
- No `I` or `T` prefix — plain PascalCase names:

```ts
interface Fundraiser { ... }
interface FundraiserCardProps { ... }

type FundraiserSortOptions = 'popular' | 'recent' | 'gross';
type Nullable<T> = T | null;
```

String values in union types use `kebab-case`:

```ts
type FontId = 'open-sans' | 'inter' | 'poppins' | 'playfair' | 'roboto';
type ThemeCategory = 'minimal' | 'celebration' | 'nature' | 'business';
```

## Imports

Order within a file:

1. `import type` statements (separate block)
2. External packages
3. Internal modules via `@/` alias

```ts
// ✓
import type { Fundraiser } from '@/lib/types/fundraiser';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
```

## UTM Parameters

Short tokens win. UTM values show up as labels in Umami and in the donation `metadata`, and they travel on links people copy, so keep them short and stable. Rules:

- Lowercase `snake_case`, ASCII only, no spaces. Aim for 8 characters or fewer.
- `utm_source` names the surface the link was made on: `fr` (fundraiser page), `stage` (Stage Mode).
- `utm_medium` names the placement or mechanism on that surface: `qr`, `cl_bnr` (closed fundraiser banner share).
- `utm_campaign` is reserved by the platform for the fundraiser GUID. Never set it from this app (see `src/lib/donation/utm.ts`).
- `utm_id` carries a fundraiser GUID only on links that leave the fundraiser, so the destination knows who sent the donor. Never on internal links.
- Internal navigation gets no UTM at all. Umami records page flow on its own, and rewriting a visitor's UTM would steal attribution from the channel that brought them.
- Third-party attribution formats (for example the Unsplash `utm_source=plant-for-the-planet&utm_medium=referral` links) follow the third party's spec, not this list.

Every token in use lives in this table. Add a row before using a new one so abbreviations stay decodable.

| Parameter    | Token    | Meaning                                 | Set in                                               |
| ------------ | -------- | --------------------------------------- | ---------------------------------------------------- |
| `utm_source` | `fr`     | Public fundraiser page                  | `components/fundraisers/closed-for-contribution.tsx` |
| `utm_source` | `stage`  | Stage Mode screen                       | `modules/stage/components/stage-qr-panel.tsx`        |
| `utm_medium` | `qr`     | QR code scan                            | `modules/stage/components/stage-qr-panel.tsx`        |
| `utm_medium` | `cl_bnr` | Share from the closed fundraiser banner | `components/fundraisers/closed-for-contribution.tsx` |
