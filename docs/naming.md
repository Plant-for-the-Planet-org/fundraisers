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

Readable tokens win. UTM values show up as labels in Umami and in the donation `metadata`, and the person reading those numbers is usually not the person who set the token, so a value has to be decodable on sight without this file open. Rules:

- Lowercase `snake_case`, ASCII only, no spaces. Whole words, no dropped vowels.
- Avoid values that read as something else in an analytics column. `fr` looks like the French locale before it looks like a fundraiser.
- `utm_source` on a link that is copied or scanned, where we cannot know where it goes, names the surface it came from: `fundraiser` (fundraiser page), `thank_you` (thank-you screen), `stage` (Stage Mode).
- `utm_source` on a link made to be posted somewhere else names that place: `instagram`, `whatsapp`, `newsletter`, or `share_sheet` when the phone's share menu picks the app.
- `utm_medium` names the mechanism on our surface (`qr`, `copy_link`) or the kind of place the link was posted (`social`, `messaging`, `email`).
- `utm_campaign` is reserved by the platform for the fundraiser GUID. Never set it from this app (see `src/lib/donation/utm.ts`).
- `utm_id` carries a fundraiser GUID only on links that leave the fundraiser, so the destination knows who sent the donor. Never on internal links.
- Internal navigation gets no UTM at all. Umami records page flow on its own, and rewriting a visitor's UTM would steal attribution from the channel that brought them.
- Third-party attribution formats (for example the Unsplash `utm_source=plant-for-the-planet&utm_medium=referral` links) follow the third party's spec, not this list.

Every token in use lives in this table. Add a row before using a new one, so a reader can see the whole vocabulary in one place.

| Parameter    | Token           | Meaning                                                             | Set in                                                                                      |
| ------------ | --------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `utm_source` | `fundraiser`    | Copy Link on the fundraiser page and in its Share images dialog     | `components/fundraisers/use-fundraiser-share-url.ts`                                        |
| `utm_source` | `thank_you`     | Copy Link on the thank-you screen after a donation                  | `components/donate/share-section.tsx`, through `useFundraiserShareUrl`                      |
| `utm_source` | `stage`         | Stage Mode screen                                                   | `modules/stage/components/stage-qr-panel.tsx`                                               |
| `utm_source` | `instagram`     | Instagram, from the share studio or a Share tab link                | `lib/share/channels.ts`, `components/dashboard/fundraiser-detail/share-links.tsx`           |
| `utm_source` | `whatsapp`      | WhatsApp, from the share studio or a Share tab link                 | `lib/share/channels.ts`, `components/dashboard/fundraiser-detail/share-links.tsx`           |
| `utm_source` | `tiktok`        | TikTok, from the share studio                                       | `lib/share/channels.ts`                                                                     |
| `utm_source` | `youtube`       | YouTube Shorts, from the share studio                               | `lib/share/channels.ts`                                                                     |
| `utm_source` | `linkedin`      | LinkedIn, from the share studio or a Share tab link                 | `lib/share/channels.ts`, `components/dashboard/fundraiser-detail/share-links.tsx`           |
| `utm_source` | `facebook`      | Facebook, from the share studio or a Share tab link                 | `lib/share/channels.ts`, `components/dashboard/fundraiser-detail/share-links.tsx`           |
| `utm_source` | `x`             | X, from the share studio                                            | `lib/share/channels.ts`                                                                     |
| `utm_source` | `share_sheet`   | "Any app" in the share studio: the phone's share menu picks the app | `lib/share/channels.ts`                                                                     |
| `utm_source` | `email`         | Email link on the Share tab                                         | `components/dashboard/fundraiser-detail/share-links.tsx`                                    |
| `utm_source` | `newsletter`    | Newsletter, from the share studio banner or a Share tab link        | `lib/share/channels.ts`, `components/dashboard/fundraiser-detail/share-links.tsx`           |
| `utm_medium` | `qr`            | QR code scan                                                        | `modules/stage/components/stage-qr-panel.tsx`                                               |
| `utm_medium` | `copy_link`     | A Copy Link button                                                  | `components/fundraisers/use-fundraiser-share-url.ts`                                        |
| `utm_medium` | `social`        | Posted on a social platform                                         | `lib/share/channels.ts`, `components/dashboard/fundraiser-detail/share-links.tsx`           |
| `utm_medium` | `messaging`     | Sent in a chat app                                                  | `lib/share/channels.ts`, `components/dashboard/fundraiser-detail/share-links.tsx`           |
| `utm_medium` | `email`         | Sent by email or in a newsletter                                    | `lib/share/channels.ts`, `components/dashboard/fundraiser-detail/share-links.tsx`           |
| `utm_medium` | `closed_banner` | Share from the closed fundraiser banner                             | No longer set. Older links still carry it.                                                  |
