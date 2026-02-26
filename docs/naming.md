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
