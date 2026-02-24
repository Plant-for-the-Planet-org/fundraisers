# Theme System — Implementation Plan

## Goals

- Each page/route renders with its correct theme from the very first paint — no flash
- Per-fundraiser themes (background, accent, fonts, mode, animation) stored in DB, applied server-side
- Client components can read the current theme (accent color, mode) without a separate fetch
- Interactive theme selector in the create/edit fundraiser flow
- Tailwind v4 CSS-first config throughout — no `tailwind.config.js`

---

## Why there is no flash

The flash in the old project came from `EnhancedThemeProvider` resolving the theme *client-side* after hydration. Here, the server layout already knows the theme at render time:

- **Static routes**: theme is hardcoded in the server layout component
- **Fundraiser pages**: layout fetches fundraiser data server-side and applies the theme before the HTML leaves the server

The HTML that arrives in the browser already has the correct background class, mode class (`dark`/`light`), and CSS variable inline styles on the wrapper div. Before any JavaScript runs, the browser sees and renders the right theme. No client-side resolution needed, no effect that fires after hydration.

The one remaining risk is **client-side navigation** (clicking a `<Link>`). App Router handles this by sending a new RSC payload that already contains the correct theme applied by the new route's server layout. React reconciles it in a single DOM update. Adding `transition-colors duration-300` to the background layer makes any theme change during navigation smooth rather than a hard cut.

---

## Architecture overview

```
Server layout (RSC)
  ├── Fetches theme data (DB for fundraisers, hardcoded for static routes)
  ├── Applies theme to wrapper div:
  │     className={mode}                          → "dark" or "light"
  │     className={background}                    → Tailwind gradient classes
  │     style={{ --theme-body-font, --theme-title-font, --color-accent }}
  └── Renders <ThemeProvider theme={theme}>       → serialised into RSC payload
        └── children
              └── Client components
                    └── useTheme()                → reads from context (no fetch)
```

The `ThemeProvider` is a client component but receives its value as a prop from the server. Because it's part of the RSC payload, the context value is available at the moment React hydrates — it matches what the server rendered. No mismatch, no flash.

---

## Data model

```ts
// src/lib/theme/types.ts

// All values that can appear as accent or colorOption across the 14 predefined themes.
// Custom DB themes are validated against this set in buildTheme.
export type AccentColor =
  | 'blue' | 'cyan' | 'emerald' | 'green' | 'teal' | 'lime'
  | 'indigo' | 'purple' | 'violet' | 'fuchsia'
  | 'pink' | 'rose' | 'red'
  | 'orange' | 'amber' | 'yellow'
  | 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone';

export type FontId =
  | 'open-sans' | 'inter' | 'poppins' | 'playfair' | 'roboto';

// 'hearts' comes from the wedding theme; 'particles' reserved for future use
export type AnimationType = 'none' | 'snow' | 'confetti' | 'hearts' | 'particles';

export type ThemeMode = 'light' | 'dark';

export type ThemeCategory =
  | 'minimal' | 'celebration' | 'nature' | 'business' | 'atmospheric';

export interface Theme {
  id: string;
  name: string;
  category: ThemeCategory;
  background: string;       // Tailwind class string, e.g. 'bg-gradient-to-br from-emerald-300/25 to-lime-300/20'
  accent: AccentColor;
  mode: ThemeMode;
  bodyFont: FontId;
  titleFont: FontId;
  animation: AnimationType;
  colorOptions: AccentColor[]; // accent colours offered in the theme selector for this theme
  isPlain?: boolean;           // true for solid-colour backgrounds (bg-white, bg-gray-50, etc.)
  featured?: boolean;          // highlighted in the theme selector grid
}

// The shape stored in fundraiser.settings.theme (raw DB record)
export interface FundraiserThemeSettings {
  background?: string;
  accent?: string;
  mode?: string;
  body_font?: string;
  title_font?: string;
  animation?: string;
}
```

---

## File structure

```
src/
  lib/
    theme/
      types.ts              ← Theme, AccentColor, FontId, etc.
      themes.ts             ← Predefined named themes registry
      font-utils.ts         ← fontId → CSS variable font stack string
      accent-utils.ts       ← accentName → Tailwind class sets
      build-theme.ts        ← FundraiserThemeSettings → Theme (with validation/defaults)
  components/
    theme/
      theme-provider.tsx    ← 'use client' context provider
      animation-layer.tsx   ← 'use client' snow/confetti components
  styles/
    theme-safelist.ts       ← All gradient class strings (scanned by Tailwind)
  app/
    globals.css             ← @theme config, CSS variables, dark variant, font rules
```

---

## Step 1 — `globals.css` changes

### Replace `@media prefers-color-scheme` with class-based dark mode

The current file uses `@media (prefers-color-scheme: dark)`. This needs to change to class-based so fundraiser pages can force `dark` mode regardless of the user's OS setting.

```css
@import 'tailwindcss';

/* Tell Tailwind: dark: prefix activates when any ancestor has class="dark" */
@variant dark (&:is(.dark *));

/* Scan the safelist file for dynamic gradient classes */
@source "../src/styles/theme-safelist.ts";
```

### `@theme` block

```css
@theme {
  /* Fonts — referencing Next.js font CSS variables (see Step 2) */
  --font-open-sans: var(--font-open-sans-var), 'Open Sans', sans-serif;
  --font-inter:     var(--font-inter-var),     'Inter',     sans-serif;
  --font-poppins:   var(--font-poppins-var),   'Poppins',   sans-serif;
  --font-playfair:  var(--font-playfair-var),  'Playfair Display', serif;
  --font-roboto:    var(--font-roboto-var),    'Roboto',    sans-serif;

  /* Semantic color tokens */
  --color-background:         hsl(var(--background));
  --color-foreground:         hsl(var(--foreground));
  --color-muted:              hsl(var(--muted));
  --color-muted-foreground:   hsl(var(--muted-foreground));
  --color-card:               hsl(var(--card));
  --color-card-foreground:    hsl(var(--card-foreground));
  --color-border:             hsl(var(--border));
  --color-input:              hsl(var(--input));
  --color-primary:            hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-accent-color:       var(--accent-color); /* theme accent, set per-page */

  /* Border radius */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);

  /* Breakpoints */
  --breakpoint-xs: 475px;
}
```

### CSS variable defaults (`:root`)

```css
:root {
  --background:         0 0% 100%;
  --foreground:         224 71.4% 4.1%;
  --muted:              220 14.3% 95.9%;
  --muted-foreground:   220 8.9% 46.1%;
  --card:               0 0% 100%;
  --card-foreground:    224 71.4% 4.1%;
  --border:             220 13% 91%;
  --input:              220 13% 91%;
  --primary:            142 76% 36%;
  --primary-foreground: 0 0% 100%;
  --radius:             0.5rem;
  --accent-color:       #16a34a; /* overridden per-page via inline style */
}

/* Dark mode token overrides — activated by class="dark" on any ancestor */
.dark {
  --background:         224 71.4% 4.1%;
  --foreground:         210 20% 98%;
  --muted:              215 27.9% 16.9%;
  --muted-foreground:   217.9 10.6% 64.9%;
  --card:               224 71.4% 4.1%;
  --card-foreground:    210 20% 98%;
  --border:             215 27.9% 16.9%;
  --input:              215 27.9% 16.9%;
}
```

### Font application rules

These rules apply the per-theme fonts globally, falling back to the defaults. They're set once and never need to change — the `--theme-body-font` and `--theme-title-font` custom properties are what changes per page (see Step 4).

```css
body {
  font-family: var(--theme-body-font, var(--font-open-sans));
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--theme-title-font, var(--font-poppins));
}
```

---

## Step 2 — Font loading in root layout

All fonts are loaded once at the root. The key detail: Next.js `next/font` sets a CSS variable on the element its `variable` prop refers to. To avoid a circular reference in the `@theme` block, the Next.js variable names get a `-var` suffix, and `@theme` maps them to the clean names that become Tailwind classes.

```tsx
// src/app/layout.tsx
import { Open_Sans, Inter, Poppins, Playfair_Display, Roboto } from 'next/font/google';

const openSans = Open_Sans({ variable: '--font-open-sans-var', subsets: ['latin'], display: 'swap' });
const inter    = Inter({     variable: '--font-inter-var',     subsets: ['latin'], display: 'swap' });
const poppins  = Poppins({   variable: '--font-poppins-var',   subsets: ['latin'], display: 'swap',
                              weight: ['400', '500', '600', '700'] });
const playfair = Playfair_Display({ variable: '--font-playfair-var', subsets: ['latin'], display: 'swap' });
const roboto   = Roboto({    variable: '--font-roboto-var',    subsets: ['latin'], display: 'swap',
                              weight: ['400', '500', '700'] });

export default async function RootLayout({ children }) {
  return (
    <html lang={locale}>
      <body className={`
        ${openSans.variable} ${inter.variable} ${poppins.variable}
        ${playfair.variable} ${roboto.variable} antialiased
      `}>
        {/* providers */}
        {children}
      </body>
    </html>
  );
}
```

All font CSS variables are now available anywhere in the document. The `@theme` block in `globals.css` references them via `var(--font-open-sans-var)` etc.

---

## Step 3 — `ThemeProvider` client component

This is intentionally minimal — just a context bridge. All the theme *application* (backgrounds, CSS variables) happens in the server layout in Step 4.

```tsx
// src/components/theme/theme-provider.tsx
'use client';

import { createContext, useContext } from 'react';
import type { Theme } from '@/lib/theme/types';

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

Client components call `useTheme()` to get the accent name, mode, etc. for generating Tailwind class names (e.g. `bg-blue-600` for a button). Because the `ThemeProvider` receives its value as a prop from the server layout (not from a client-side fetch), the context value is baked into the RSC payload. React can read it on first hydration — it matches what the server rendered.

---

## Step 4 — Theme application in server layouts

### Static routes

The `(standard)` layout and its sub-routes have fixed themes. Apply directly:

```tsx
// src/app/(standard)/layout.tsx
export default function StandardLayout({ children }) {
  return (
    <ThemeProvider theme={THEMES.spring}>
      <div className="light relative min-h-screen flex flex-col">
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-300/25 via-sky-200/15 to-lime-300/20
                        transition-colors duration-300" />
        <div className="relative z-10 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <div className="max-w-[960px] rounded-2xl backdrop-blur-[10px] w-full mx-auto my-8 px-4 py-4">
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </ThemeProvider>
  );
}
```

No route mapper, no client-side detection. The layout's position in the file tree determines which theme it shows.

### Fundraiser pages

```tsx
// src/app/raise/[id]/layout.tsx
import { buildTheme }      from '@/lib/theme/build-theme';
import { getFontStack }    from '@/lib/theme/font-utils';
import { getAccentColor }  from '@/lib/theme/accent-utils';
import { ThemeProvider }   from '@/components/theme/theme-provider';
import { AnimationLayer }  from '@/components/theme/animation-layer';

export default async function FundraiserLayout({ params, children }) {
  const fundraiser = await getCachedFundraiser(params.id);
  const theme      = buildTheme(fundraiser.settings?.theme); // validates + applies defaults

  const cssVars = {
    '--theme-body-font':  getFontStack(theme.bodyFont),
    '--theme-title-font': getFontStack(theme.titleFont),
    '--accent-color':     getAccentColor(theme.accent),     // hex value for CSS variable
  } as React.CSSProperties;

  return (
    <ThemeProvider theme={theme}>
      <div className={theme.mode} style={cssVars}>
        {/* Fixed background — transition-colors smooths client-side navigation */}
        <div className={`fixed inset-0 ${theme.background} transition-colors duration-300`} />

        {/* Animation layer — client component, conditionally included */}
        {theme.animation !== 'none' && <AnimationLayer type={theme.animation} />}

        <div className="relative z-10 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <div className="max-w-[960px] rounded-2xl backdrop-blur-[10px] w-full mx-auto my-8 px-4 py-4">
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </ThemeProvider>
  );
}
```

The `class={theme.mode}` on the outer div activates Tailwind's `dark:` variant for all descendants. The inline CSS variables set the font stacks and accent color. The gradient background class is applied directly. Everything is in the server-rendered HTML.

`buildTheme` handles validation and defaults so that a fundraiser with missing or invalid theme settings always produces a valid `Theme` object — no runtime errors, no blank pages.

---

## Step 5 — Gradient safelisting

Tailwind v4 purges classes that aren't found in scanned source files.

**Predefined themes are already covered.** Because `src/lib/theme/themes.ts` lives inside `src/`, Tailwind's scanner reads it at build time and includes every gradient class string it finds there. All 14 themes and their backgrounds are free.

**The safelist only needs to cover custom DB gradient strings** — i.e. backgrounds a fundraiser creator has built themselves in the editor, which arrive at runtime and are never present in source files. That's a much smaller problem.

```ts
// src/styles/theme-safelist.ts
// This file is NOT imported at runtime. Tailwind's scanner reads it at build time.
// Only covers classes that may arrive as freeform strings from the DB.

export const _GRADIENT_DIRECTIONS = `
  bg-gradient-to-r bg-gradient-to-l bg-gradient-to-t bg-gradient-to-b
  bg-gradient-to-br bg-gradient-to-bl bg-gradient-to-tr bg-gradient-to-tl
`;

// Full stop × colour matrix for from-*, via-*, to-*
// (without opacity — solid stops used by dark themes like dark-ocean, volcanic, lush-forest)
export const _GRADIENT_STOPS_SOLID = `
  from-red-100 from-red-200 from-red-300 from-red-400 from-red-500
  from-red-600 from-red-700 from-red-800 from-red-900
  from-orange-100 from-orange-200 from-orange-300 from-orange-400 from-orange-500
  from-orange-600 from-orange-700 from-orange-800 from-orange-900
  from-amber-100 from-amber-200 from-amber-300 from-amber-400 from-amber-500
  from-amber-600 from-amber-700 from-amber-800 from-amber-900
  from-yellow-100 from-yellow-200 from-yellow-300 from-yellow-400 from-yellow-500
  from-yellow-600 from-yellow-700 from-yellow-800 from-yellow-900
  from-green-100 from-green-200 from-green-300 from-green-400 from-green-500
  from-green-600 from-green-700 from-green-800 from-green-900
  from-emerald-100 from-emerald-200 from-emerald-300 from-emerald-400 from-emerald-500
  from-emerald-600 from-emerald-700 from-emerald-800 from-emerald-900
  from-teal-100 from-teal-200 from-teal-300 from-teal-400 from-teal-500
  from-teal-600 from-teal-700 from-teal-800 from-teal-900
  from-cyan-100 from-cyan-200 from-cyan-300 from-cyan-400 from-cyan-500
  from-cyan-600 from-cyan-700 from-cyan-800 from-cyan-900
  from-sky-100 from-sky-200 from-sky-300 from-sky-400 from-sky-500
  from-sky-600 from-sky-700 from-sky-800 from-sky-900
  from-blue-100 from-blue-200 from-blue-300 from-blue-400 from-blue-500
  from-blue-600 from-blue-700 from-blue-800 from-blue-900
  from-indigo-100 from-indigo-200 from-indigo-300 from-indigo-400 from-indigo-500
  from-indigo-600 from-indigo-700 from-indigo-800 from-indigo-900
  from-purple-100 from-purple-200 from-purple-300 from-purple-400 from-purple-500
  from-purple-600 from-purple-700 from-purple-800 from-purple-900
  from-pink-100 from-pink-200 from-pink-300 from-pink-400 from-pink-500
  from-pink-600 from-pink-700 from-pink-800 from-pink-900
  from-rose-100 from-rose-200 from-rose-300 from-rose-400 from-rose-500
  from-rose-600 from-rose-700 from-rose-800 from-rose-900
  from-gray-100 from-gray-200 from-gray-300 from-gray-400 from-gray-500
  from-gray-600 from-gray-700 from-gray-800 from-gray-900
  from-slate-100 from-slate-200 from-slate-300 from-slate-400 from-slate-500
  from-slate-600 from-slate-700 from-slate-800 from-slate-900
  from-zinc-100 from-zinc-200 from-zinc-300 from-zinc-400 from-zinc-500
  from-zinc-600 from-zinc-700 from-zinc-800 from-zinc-900
  /* repeat same set prefixed with via- and to- */
`;

// Opacity variants — the most important part for custom themes.
// Tailwind only generates /N modifiers if they appear in source.
// Expand this list as the theme editor exposes more opacity options.
export const _GRADIENT_STOPS_OPACITY = `
  from-red-100/10    from-red-100/20    from-red-100/25    from-red-100/30
  from-red-100/35    from-red-100/40    from-red-100/45    from-red-100/50
  from-orange-100/10 from-orange-100/20 from-orange-100/25 from-orange-100/30
  from-orange-100/35 from-orange-100/40 from-orange-100/45 from-orange-100/50
  from-orange-200/25 from-orange-300/25
  from-amber-200/35
  from-yellow-100/40
  from-green-800/80  from-emerald-300/25 from-emerald-700/80
  from-teal-800/80
  from-sky-200/15
  from-blue-100/30   from-blue-200/25   from-blue-300/25   from-blue-900/80
  from-indigo-900/80
  from-pink-100/35   from-pink-200/20   from-pink-300/20
  from-purple-100/30
  from-rose-300/50
  from-slate-50/20   from-slate-800/80
  from-red-900/80    from-orange-800/80 from-yellow-700/80
  from-gray-900/80
  /* mirror all the above for via- and to- */
  via-red-200/20     via-pink-100/35    via-pink-200/20    via-pink-200/45
  via-orange-200/30  via-sky-200/15     via-slate-50/20    via-slate-800/80
  via-blue-900/80    via-emerald-700/80 via-orange-800/80
  to-pink-300/20     to-purple-100/30   to-purple-100/40
  to-blue-200/25     to-blue-300/25
  to-lime-300/20     to-indigo-900/80   to-teal-800/80
  to-yellow-700/80
`;
```

In `globals.css`:
```css
@source "../src/styles/theme-safelist.ts";
```

> The opacity variants (`/15`, `/20`, `/25`, `/35`, `/40`, `/45`, `/50`) are the critical part. Tailwind only generates a `/N` modifier if that exact combination appears somewhere in the scanned source. Expand the list to match whatever opacity steps the theme editor exposes to users.

---

## Step 6 — Predefined theme registry

The 14 themes from the old project port directly. Because this file lives in `src/`, Tailwind scans it at build time — all gradient strings are automatically included in the CSS bundle with no safelist entries needed.

Note the spring theme has **two `via-` stops** (`via-pink-200/20 via-sky-200/15`). Tailwind supports this — both stops are applied — but the theme editor's gradient builder needs to account for it if users can edit predefined themes as a starting point.

```ts
// src/lib/theme/themes.ts
import type { Theme } from './types';

export const THEMES: Record<string, Theme> = {
  spring: {
    id: 'spring', name: 'Spring Vibes', category: 'nature',
    background: 'bg-gradient-to-br from-emerald-300/25 via-pink-200/20 via-sky-200/15 to-lime-300/20',
    accent: 'emerald', mode: 'light', bodyFont: 'open-sans', titleFont: 'poppins',
    animation: 'none', featured: true,
    colorOptions: ['emerald', 'green', 'teal', 'cyan', 'pink', 'lime', 'blue', 'indigo'],
  },
  clean: {
    id: 'clean', name: 'Clean White', category: 'minimal',
    background: 'bg-white',
    accent: 'blue', mode: 'light', bodyFont: 'open-sans', titleFont: 'poppins',
    animation: 'none', isPlain: true, featured: true,
    colorOptions: ['blue', 'emerald', 'purple', 'indigo', 'teal', 'cyan', 'slate', 'gray'],
  },
  dashboard: {
    id: 'dashboard', name: 'Dashboard', category: 'business',
    background: 'bg-gray-50',
    accent: 'blue', mode: 'light', bodyFont: 'open-sans', titleFont: 'poppins',
    animation: 'none', isPlain: true, featured: true,
    colorOptions: ['blue', 'indigo', 'slate', 'gray', 'emerald', 'teal', 'cyan', 'purple'],
  },
  birthday: {
    id: 'birthday', name: 'Birthday Party', category: 'celebration',
    background: 'bg-gradient-to-br from-orange-300/25 via-red-200/20 to-pink-300/20',
    accent: 'orange', mode: 'light', bodyFont: 'open-sans', titleFont: 'poppins',
    animation: 'confetti',
    colorOptions: ['blue', 'pink', 'yellow', 'green', 'orange', 'purple', 'red', 'indigo'],
  },
  wedding: {
    id: 'wedding', name: 'Wedding Elegance', category: 'celebration',
    background: 'bg-gradient-to-br from-rose-300/50 via-pink-200/45 to-purple-100/40',
    accent: 'rose', mode: 'light', bodyFont: 'open-sans', titleFont: 'playfair',
    animation: 'hearts',
    colorOptions: ['rose', 'pink', 'red', 'purple', 'indigo', 'blue', 'violet', 'fuchsia'],
  },
  corporate: {
    id: 'corporate', name: 'Corporate', category: 'business',
    background: 'bg-gradient-to-br from-blue-100/30 via-slate-50/20 to-blue-200/25',
    accent: 'blue', mode: 'light', bodyFont: 'open-sans', titleFont: 'poppins',
    animation: 'none',
    colorOptions: ['blue', 'indigo', 'slate', 'gray', 'emerald', 'teal', 'cyan', 'purple'],
  },
  stratospheric: {
    id: 'stratospheric', name: 'Polar Stratospheric Clouds', category: 'atmospheric',
    background: 'bg-gradient-to-br from-yellow-100/40 via-pink-100/35 to-purple-100/30',
    accent: 'amber', mode: 'light', bodyFont: 'open-sans', titleFont: 'poppins',
    animation: 'none', featured: true,
    colorOptions: ['yellow', 'pink', 'amber', 'orange', 'rose', 'purple', 'indigo', 'blue'],
  },
  sunset: {
    id: 'sunset', name: 'Sunset', category: 'nature',
    background: 'bg-gradient-to-br from-amber-200/35 via-orange-200/30 to-blue-300/25',
    accent: 'orange', mode: 'light', bodyFont: 'open-sans', titleFont: 'poppins',
    animation: 'none', featured: true,
    colorOptions: ['orange', 'amber', 'pink', 'purple', 'blue', 'rose', 'red', 'yellow'],
  },
  'dark-ocean': {
    id: 'dark-ocean', name: 'Dark Ocean', category: 'nature',
    background: 'bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900',
    accent: 'blue', mode: 'dark', bodyFont: 'open-sans', titleFont: 'poppins',
    animation: 'none',
    colorOptions: ['blue', 'indigo', 'slate', 'cyan', 'teal', 'purple', 'emerald', 'gray'],
  },
  'lush-forest': {
    id: 'lush-forest', name: 'Lush Forest', category: 'nature',
    background: 'bg-gradient-to-br from-green-800 via-emerald-700 to-teal-800',
    accent: 'emerald', mode: 'dark', bodyFont: 'open-sans', titleFont: 'poppins',
    animation: 'snow',
    colorOptions: ['emerald', 'green', 'teal', 'cyan', 'blue', 'lime', 'indigo', 'slate'],
  },
  volcanic: {
    id: 'volcanic', name: 'Volcanic', category: 'nature',
    background: 'bg-gradient-to-br from-red-900 via-orange-800 to-yellow-700',
    accent: 'orange', mode: 'dark', bodyFont: 'open-sans', titleFont: 'poppins',
    animation: 'none',
    colorOptions: ['orange', 'red', 'yellow', 'pink', 'purple', 'amber', 'rose', 'indigo'],
  },
  midnight: {
    id: 'midnight', name: 'Midnight', category: 'minimal',
    background: 'bg-gradient-to-br from-gray-900 via-slate-800 to-zinc-900',
    accent: 'slate', mode: 'dark', bodyFont: 'open-sans', titleFont: 'poppins',
    animation: 'none',
    colorOptions: ['slate', 'gray', 'zinc', 'blue', 'purple', 'indigo', 'cyan', 'teal'],
  },
  dark: {
    id: 'dark', name: 'Professional Dark', category: 'business',
    background: 'bg-gray-900',
    accent: 'blue', mode: 'dark', bodyFont: 'open-sans', titleFont: 'poppins',
    animation: 'none', isPlain: true,
    colorOptions: ['blue', 'slate', 'gray', 'zinc', 'neutral', 'purple', 'indigo', 'cyan'],
  },
  minimal: {
    id: 'minimal', name: 'Minimal', category: 'minimal',
    background: 'bg-gray-50',
    accent: 'gray', mode: 'light', bodyFont: 'open-sans', titleFont: 'poppins',
    animation: 'none', isPlain: true,
    colorOptions: ['gray', 'slate', 'zinc', 'neutral', 'stone', 'blue', 'indigo', 'purple'],
  },
};

export const DEFAULT_THEME = THEMES.spring;
```

---

## Step 7 — `buildTheme` utility

Converts the raw DB record into a validated `Theme`. This runs server-side in layouts, never on the client.

```ts
// src/lib/theme/build-theme.ts
import type { Theme, FundraiserThemeSettings } from './types';
import { DEFAULT_THEME } from './themes';

const VALID_ACCENTS = new Set<string>([
  'blue', 'cyan', 'emerald', 'green', 'teal', 'lime',
  'indigo', 'purple', 'violet', 'fuchsia',
  'pink', 'rose', 'red',
  'orange', 'amber', 'yellow',
  'slate', 'gray', 'zinc', 'neutral', 'stone',
]);
const VALID_FONTS   = new Set(['open-sans', 'inter', 'poppins', 'playfair', 'roboto']);
const VALID_MODES   = new Set(['light', 'dark']);
const VALID_ANIMS   = new Set(['none', 'snow', 'confetti', 'hearts', 'particles']);

export function buildTheme(settings?: FundraiserThemeSettings | null): Theme {
  if (!settings) return DEFAULT_THEME;

  return {
    id:         'fundraiser-custom',
    name:       'Custom',
    background: settings.background  ?? DEFAULT_THEME.background,
    accent:     VALID_ACCENTS.has(settings.accent  ?? '') ? settings.accent  as any : DEFAULT_THEME.accent,
    mode:       VALID_MODES.has(settings.mode       ?? '') ? settings.mode    as any : DEFAULT_THEME.mode,
    bodyFont:   VALID_FONTS.has(settings.body_font  ?? '') ? settings.body_font  as any : DEFAULT_THEME.bodyFont,
    titleFont:  VALID_FONTS.has(settings.title_font ?? '') ? settings.title_font as any : DEFAULT_THEME.titleFont,
    animation:  VALID_ANIMS.has(settings.animation  ?? '') ? settings.animation  as any : DEFAULT_THEME.animation,
  };
}
```

---

## Step 8 — Using the theme in client components

Most components should reach for CSS variables first. The semantic tokens (`text-foreground`, `bg-card`, `border-border`) already adapt automatically via the `.dark` class and the CSS variable cascade. No JS needed.

For cases where you need accent-colored Tailwind classes (e.g. a primary action button), use the hook:

```tsx
// src/lib/theme/accent-utils.ts
export function getAccentClasses(accent: AccentColor) {
  const map: Record<AccentColor, { button: string; buttonHover: string; icon: string }> = {
    blue:    { button: 'bg-blue-600',    buttonHover: 'hover:bg-blue-700',    icon: 'text-blue-500'    },
    cyan:    { button: 'bg-cyan-600',    buttonHover: 'hover:bg-cyan-700',    icon: 'text-cyan-500'    },
    emerald: { button: 'bg-emerald-600', buttonHover: 'hover:bg-emerald-700', icon: 'text-emerald-500' },
    green:   { button: 'bg-green-600',   buttonHover: 'hover:bg-green-700',   icon: 'text-green-500'   },
    teal:    { button: 'bg-teal-600',    buttonHover: 'hover:bg-teal-700',    icon: 'text-teal-500'    },
    lime:    { button: 'bg-lime-600',    buttonHover: 'hover:bg-lime-700',    icon: 'text-lime-500'    },
    indigo:  { button: 'bg-indigo-600',  buttonHover: 'hover:bg-indigo-700',  icon: 'text-indigo-500'  },
    purple:  { button: 'bg-purple-600',  buttonHover: 'hover:bg-purple-700',  icon: 'text-purple-500'  },
    violet:  { button: 'bg-violet-600',  buttonHover: 'hover:bg-violet-700',  icon: 'text-violet-500'  },
    fuchsia: { button: 'bg-fuchsia-600', buttonHover: 'hover:bg-fuchsia-700', icon: 'text-fuchsia-500' },
    pink:    { button: 'bg-pink-600',    buttonHover: 'hover:bg-pink-700',    icon: 'text-pink-500'    },
    rose:    { button: 'bg-rose-600',    buttonHover: 'hover:bg-rose-700',    icon: 'text-rose-500'    },
    red:     { button: 'bg-red-600',     buttonHover: 'hover:bg-red-700',     icon: 'text-red-500'     },
    orange:  { button: 'bg-orange-600',  buttonHover: 'hover:bg-orange-700',  icon: 'text-orange-500'  },
    amber:   { button: 'bg-amber-600',   buttonHover: 'hover:bg-amber-700',   icon: 'text-amber-500'   },
    yellow:  { button: 'bg-yellow-500',  buttonHover: 'hover:bg-yellow-600',  icon: 'text-yellow-500'  },
    slate:   { button: 'bg-slate-600',   buttonHover: 'hover:bg-slate-700',   icon: 'text-slate-500'   },
    gray:    { button: 'bg-gray-600',    buttonHover: 'hover:bg-gray-700',    icon: 'text-gray-500'    },
    zinc:    { button: 'bg-zinc-600',    buttonHover: 'hover:bg-zinc-700',    icon: 'text-zinc-500'    },
    neutral: { button: 'bg-neutral-600', buttonHover: 'hover:bg-neutral-700', icon: 'text-neutral-500' },
    stone:   { button: 'bg-stone-600',   buttonHover: 'hover:bg-stone-700',   icon: 'text-stone-500'   },
  };
  return map[accent];
}
```

Because these class strings are hardcoded in this file (inside `src/`), Tailwind scans them and includes them all in the bundle — no safelist needed here either.

```tsx
// In a client component
'use client';
import { useTheme } from '@/components/theme/theme-provider';
import { getAccentClasses } from '@/lib/theme/accent-utils';

export function DonateButton() {
  const theme   = useTheme();
  const accent  = getAccentClasses(theme.accent);

  return (
    <button className={`${accent.button} ${accent.buttonHover} text-white px-6 py-2 rounded-lg`}>
      Donate
    </button>
  );
}
```

For purely server components that also need accent classes (e.g. a server-rendered stat card), pass the accent as a prop from the layout — the layout already has the `Theme` object.

---

## Step 9 — Create/edit fundraiser theme selector

This is a self-contained client component. It does not interact with the global `ThemeProvider` — it manages its own local state and renders a scoped preview.

### Structure

```
src/app/(standard)/dash/raise/[id]/
  page.tsx                    ← server component, fetches current fundraiser
  components/
    theme-customizer.tsx      ← 'use client', owns theme state
    theme-preview.tsx         ← renders a miniature version of the fundraiser page with selected theme
    theme-preset-grid.tsx     ← grid of predefined theme cards
    accent-picker.tsx         ← color swatch selector
    font-picker.tsx           ← font pair selector
    mode-toggle.tsx           ← light/dark toggle
```

### Data flow

```
page.tsx (server)
  └── fetches current fundraiser (including saved theme settings)
  └── renders <ThemeCustomizer initialTheme={fundraiser.settings.theme} />

ThemeCustomizer (client)
  ├── useState<FundraiserThemeSettings> — tracks current selections
  ├── renders ThemePreview with current state applied
  └── on save → PATCH /api/fundraisers/[id] with new theme settings
```

### Preview approach

The preview does not use the global `ThemeProvider`. It's a styled `<div>` inside the form that applies the selected theme directly:

```tsx
function ThemePreview({ theme }: { theme: FundraiserThemeSettings }) {
  const background  = theme.background ?? DEFAULT_THEME.background;
  const mode        = theme.mode        ?? 'light';
  const bodyFont    = getFontStack(theme.body_font  ?? 'open-sans');
  const titleFont   = getFontStack(theme.title_font ?? 'poppins');

  return (
    <div
      className={`${mode} relative h-48 rounded-xl overflow-hidden`}
      style={{ '--theme-body-font': bodyFont, '--theme-title-font': titleFont } as React.CSSProperties}
    >
      <div className={`absolute inset-0 ${background}`} />
      <div className="relative z-10 p-4 text-foreground">
        {/* Miniature fundraiser card mockup */}
      </div>
    </div>
  );
}
```

Because this preview div has `class={mode}` and the inline font variables, it renders exactly as the live fundraiser page would — using the same CSS rules — without polluting the page-level theme.

---

## Implementation order

1. **`src/lib/theme/types.ts`** — define all types
2. **`src/lib/theme/themes.ts`** — define predefined themes
3. **`src/lib/theme/font-utils.ts`** and **`accent-utils.ts`** — small pure utilities
4. **`src/lib/theme/build-theme.ts`** — DB record → validated Theme
5. **`src/styles/theme-safelist.ts`** — gradient class strings
6. **`src/app/globals.css`** — `@variant dark`, `@source`, `@theme` block, `:root`/`.dark` variables, font rules on `body`/headings
7. **`src/app/layout.tsx`** — load all fonts, apply `-var` CSS variables to `<body>`
8. **`src/components/theme/theme-provider.tsx`** — client context
9. **`src/components/theme/animation-layer.tsx`** — client animations
10. **`src/app/(standard)/layout.tsx`** — apply static theme to standard routes
11. **`src/app/raise/[id]/layout.tsx`** — apply fundraiser theme server-side
12. **Theme selector UI** — `ThemeCustomizer`, `ThemePreview`, `ThemePresetGrid`, etc.

Steps 1–5 have no dependencies on the running app. Steps 6–9 can be done together (they're all self-contained files). Steps 10–11 are where things become visible in the browser. Step 12 builds on all of the above.
