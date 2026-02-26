# Theme System — Phase 1: All Utilities + Preset Theme on Static Pages (No Flash)

## Context

Goal: get a preset theme rendering on `/explore` without any client-side flash, **plus** create all the self-contained utility files that have no external dependencies.

**Why no flash:** The server layout applies theme classes and the gradient background directly to the wrapper div before the HTML leaves the server. The browser renders the correct background from the first paint — before any JavaScript runs.

**11 files created/changed:**
1. `src/lib/theme/types.ts` — new
2. `src/lib/theme/themes.ts` — new
3. `src/lib/theme/font-utils.ts` — new (static lookup, no dependencies)
4. `src/lib/theme/accent-utils.ts` — new (static lookup, no dependencies)
5. `src/lib/theme/build-theme.ts` — new (pure function, no dependencies)
6. `src/lib/theme/route-themes.ts` — new (central route → theme ID config)
7. `src/proxy.ts` — new or update (sets `x-pathname` header so layouts can read the current path server-side)
8. `src/app/globals.css` — replace
9. `src/app/layout.tsx` — replace
10. `src/components/theme/theme-provider.tsx` — new
11. `src/app/(standard)/layout.tsx` — replace (reads pathname from headers, looks up theme)

**Deferred to Phase 2 (requires fundraiser API service first):** `theme-safelist.ts` + `@source`, `animation-layer.tsx`, `fundraiser.ts` settings extension, `raise/[id]/layout.tsx`

---

## Step 1 — `src/lib/theme/types.ts`

```ts
export type AccentColor =
  | 'blue' | 'cyan' | 'emerald' | 'green' | 'teal' | 'lime'
  | 'indigo' | 'purple' | 'violet' | 'fuchsia'
  | 'pink' | 'rose' | 'red'
  | 'orange' | 'amber' | 'yellow'
  | 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone';

export type FontId =
  | 'open-sans' | 'inter' | 'poppins' | 'playfair' | 'roboto';

export type AnimationType = 'none' | 'snow' | 'confetti' | 'hearts' | 'particles';

export type ThemeMode = 'light' | 'dark';

export type ThemeCategory =
  | 'minimal' | 'celebration' | 'nature' | 'business' | 'atmospheric';

export interface Theme {
  id: string;
  name: string;
  category: ThemeCategory;
  background: string;
  accent: AccentColor;
  mode: ThemeMode;
  bodyFont: FontId;
  titleFont: FontId;
  animation: AnimationType;
  colorOptions: AccentColor[];
  isPlain?: boolean;
  featured?: boolean;
}

// The shape stored in fundraiser.settings.theme (raw DB record).
// base_id references a predefined theme from THEMES and serves as the base
// for field-level overrides. Used in Phase 2 (buildTheme).
export interface FundraiserThemeSettings {
  base_id?: string;
  background?: string;
  accent?: string;
  mode?: string;
  body_font?: string;
  title_font?: string;
  animation?: string;
}
```

**Verify:** `tsc --noEmit` passes. No visible browser change.

---

## Step 2 — `src/lib/theme/themes.ts`

```ts
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

**Verify:** `tsc --noEmit` passes. No visible browser change.

---

## Step 3 — `src/lib/theme/font-utils.ts`

Maps a `FontId` to the CSS variable font-family string. Used by the fundraiser layout (Phase 2) to set `--theme-body-font` / `--theme-title-font` as inline styles.

```ts
import type { FontId } from './types';

const FONT_STACKS: Record<FontId, string> = {
  'open-sans': 'var(--font-open-sans)',
  'inter':     'var(--font-inter)',
  'poppins':   'var(--font-poppins)',
  'playfair':  'var(--font-playfair)',
  'roboto':    'var(--font-roboto)',
};

export function getFontStack(font: FontId): string {
  return FONT_STACKS[font];
}
```

**Verify:** `tsc --noEmit` passes.

---

## Step 4 — `src/lib/theme/accent-utils.ts`

Two exports: `getAccentClasses` returns hardcoded Tailwind class strings (so Tailwind's scanner picks them up statically — dynamic class generation like `bg-${accent}-600` would be purged). `getAccentColor` returns a hex value for the `--accent-color` CSS variable used in non-Tailwind contexts (SVG fills, canvas, etc.).

```ts
import type { AccentColor } from './types';

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

export function getAccentColor(accent: AccentColor): string {
  const map: Record<AccentColor, string> = {
    blue:    '#2563eb',
    cyan:    '#0891b2',
    emerald: '#059669',
    green:   '#16a34a',
    teal:    '#0d9488',
    lime:    '#65a30d',
    indigo:  '#4f46e5',
    purple:  '#9333ea',
    violet:  '#7c3aed',
    fuchsia: '#c026d3',
    pink:    '#db2777',
    rose:    '#e11d48',
    red:     '#dc2626',
    orange:  '#ea580c',
    amber:   '#d97706',
    yellow:  '#ca8a04',
    slate:   '#475569',
    gray:    '#4b5563',
    zinc:    '#52525b',
    neutral: '#525252',
    stone:   '#57534e',
  };
  return map[accent];
}
```

**Verify:** `tsc --noEmit` passes.

---

## Step 5 — `src/lib/theme/build-theme.ts`

Converts a raw DB `FundraiserThemeSettings` record into a validated `Theme`. `base_id` loads the base preset; individual fields override it. The `...base` spread ensures `category` and `colorOptions` are always present.

```ts
import type { Theme, AccentColor, FontId, ThemeMode, AnimationType, FundraiserThemeSettings } from './types';
import { THEMES, DEFAULT_THEME } from './themes';

const VALID_ACCENTS = new Set<string>([
  'blue', 'cyan', 'emerald', 'green', 'teal', 'lime',
  'indigo', 'purple', 'violet', 'fuchsia',
  'pink', 'rose', 'red',
  'orange', 'amber', 'yellow',
  'slate', 'gray', 'zinc', 'neutral', 'stone',
]);
const VALID_FONTS = new Set(['open-sans', 'inter', 'poppins', 'playfair', 'roboto']);
const VALID_MODES = new Set(['light', 'dark']);
const VALID_ANIMS = new Set(['none', 'snow', 'confetti', 'hearts', 'particles']);

export function buildTheme(settings?: FundraiserThemeSettings | null): Theme {
  if (!settings) return DEFAULT_THEME;

  const base = (settings.base_id && THEMES[settings.base_id]) ?? DEFAULT_THEME;

  return {
    ...base,
    id:        'fundraiser-custom',
    name:      'Custom',
    background: settings.background  ?? base.background,
    accent:    VALID_ACCENTS.has(settings.accent   ?? '') ? settings.accent   as AccentColor : base.accent,
    mode:      VALID_MODES.has(settings.mode        ?? '') ? settings.mode     as ThemeMode   : base.mode,
    bodyFont:  VALID_FONTS.has(settings.body_font   ?? '') ? settings.body_font  as FontId    : base.bodyFont,
    titleFont: VALID_FONTS.has(settings.title_font  ?? '') ? settings.title_font as FontId    : base.titleFont,
    animation: VALID_ANIMS.has(settings.animation   ?? '') ? settings.animation  as AnimationType : base.animation,
  };
}
```

**Verify:** `tsc --noEmit` passes. Spot-check: `buildTheme({ base_id: 'dark-ocean', accent: 'emerald' })` → `mode: 'dark'`, background from `dark-ocean`, `accent: 'emerald'`.

---

## Step 6 — `src/lib/theme/route-themes.ts`

The central config that maps route path prefixes to theme IDs. **To change which theme a page uses, edit this file only.** Longest-prefix matching means `/explore/animals` inherits the `/explore` theme automatically.

```ts
import type { Theme } from './types';
import { THEMES, DEFAULT_THEME } from './themes';

// Maps route path prefixes → theme ID.
// To change a page's theme, edit this map.
// Longer prefixes take priority (e.g. '/explore/special' overrides '/explore').
const ROUTE_THEME_MAP: Record<string, string> = {
  '/':        'spring',
  '/explore': 'spring',
};

export function getThemeForPath(pathname: string): Theme {
  // Exact match
  if (ROUTE_THEME_MAP[pathname]) {
    return THEMES[ROUTE_THEME_MAP[pathname]] ?? DEFAULT_THEME;
  }
  // Longest prefix match
  const match = Object.keys(ROUTE_THEME_MAP)
    .filter(prefix => prefix !== '/' && pathname.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0];
  const themeId = match ? ROUTE_THEME_MAP[match] : ROUTE_THEME_MAP['/'];
  return THEMES[themeId ?? ''] ?? DEFAULT_THEME;
}
```

**Verify:** `tsc --noEmit` passes.

---

## Step 7 — `src/proxy.ts`

Next.js server layouts don't receive the current pathname by default. This proxy stamps every request with `x-pathname` so the layout can read it via `headers()` without any client-side JS.

> **Note:** Next.js 16 renamed Middleware to Proxy. The file must be named `proxy.ts` and the export named `proxy`.

Check if a `proxy.ts` already exists at the project root or in `src/` before creating.

```ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('x-pathname', request.nextUrl.pathname);
  return response;
}

export const config = {
  // Run on all routes except Next.js internals and static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
```

**Note:** Adding the `x-pathname` header makes the standard layout dynamic (it reads a request-time header). For a fundraiser app with live data, this is expected — the layout isn't statically cached anyway.

**Verify:** After starting dev server, inspect DevTools → Network → any page response headers: `x-pathname` should be present with the current path.

---

## Step 8 — `src/app/globals.css` (replace entirely)

Key changes vs current file:
- `@variant dark` replaces `@media (prefers-color-scheme: dark)` — dark mode is now class-based
- `@theme` block gains all 5 font tokens + full color/radius/breakpoint tokens
- `:root` gains the full set of semantic CSS variables
- `.dark` block overrides them
- `body` uses `var(--theme-body-font, var(--font-open-sans))`; headings use `--theme-title-font`
- No `@source` yet (safelist is Phase 2)

```css
@import 'tailwindcss';

/* Class-based dark mode: activates when any ancestor has class="dark" */
@variant dark (&:is(.dark *));

@theme {
  /* Fonts — referencing Next.js font CSS variables set in layout.tsx */
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
  --color-accent-color:       var(--accent-color);

  /* Border radius */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);

  /* Breakpoints */
  --breakpoint-xs: 475px;
}

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
  --accent-color:       #16a34a;
}

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

body {
  font-family: var(--theme-body-font, var(--font-open-sans));
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--theme-title-font, var(--font-poppins));
}
```

**Verify:** Dev server starts. Body font is Open Sans (DevTools → Computed). OS dark mode no longer changes the page — only a `.dark` class ancestor would.

---

## Step 9 — `src/app/layout.tsx` (replace)

Swap Geist for the 5 theme fonts. The `-var` suffix on each `variable` prop avoids a circular reference with the `@theme` block.

```tsx
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { Open_Sans, Inter, Poppins, Playfair_Display, Roboto } from 'next/font/google';
import { LocaleInitializer } from '@/components/locale-initializer';
import './globals.css';

const openSans = Open_Sans({ variable: '--font-open-sans-var', subsets: ['latin'], display: 'swap' });
const inter    = Inter({     variable: '--font-inter-var',     subsets: ['latin'], display: 'swap' });
const poppins  = Poppins({   variable: '--font-poppins-var',   subsets: ['latin'], display: 'swap',
                              weight: ['400', '500', '600', '700'] });
const playfair = Playfair_Display({ variable: '--font-playfair-var', subsets: ['latin'], display: 'swap' });
const roboto   = Roboto({    variable: '--font-roboto-var',    subsets: ['latin'], display: 'swap',
                              weight: ['400', '500', '700'] });

export const metadata: Metadata = {
  title: 'Fundraisers',
  description: 'Fundraising platform',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`
        ${openSans.variable} ${inter.variable} ${poppins.variable}
        ${playfair.variable} ${roboto.variable} antialiased
      `}>
        <NextIntlClientProvider messages={messages}>
          <LocaleInitializer initialLocale={locale} />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Verify:** DevTools → Network: Open Sans font files load. DevTools → Computed on body: font-family shows Open Sans.

---

## Step 10 — `src/components/theme/theme-provider.tsx` (new)

Minimal context bridge — only needed so client components can call `useTheme()`. The theme value comes from the server layout, so it's available on first hydration with no client-side fetch.

```tsx
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

**Verify:** `tsc --noEmit` passes.

---

## Step 11 — `src/app/(standard)/layout.tsx` (replace)

Replaces the `PageContainer` / `MainContent` wrapper components with direct theme application. Check that nothing else imports those components before deleting them.

Reads the pathname from the `x-pathname` header (set by proxy) and delegates to `getThemeForPath`. **To change which theme a route uses, only edit `route-themes.ts`.**

```tsx
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default async function StandardLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '/';
  const theme = getThemeForPath(pathname);

  return (
    <ThemeProvider theme={theme}>
      <div className={`${theme.mode} relative min-h-screen flex flex-col`}>
        <div className={`fixed inset-0 ${theme.background} transition-colors duration-300`} />
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

**Verify:**
- Visit `/explore` — the Spring Vibes gradient renders as the background
- Hard refresh: gradient is visible immediately, no white flash
- View page source: the gradient classes are in the HTML before any `<script>` tag
- Add `'/explore': 'sunset'` to `route-themes.ts` — confirm the amber/orange gradient loads on the next page visit with no code changes to the layout

---

## Phase 2 — implemented while building the fundraiser page

All Phase 2 items are needed by `src/app/raise/[id]/layout.tsx` and will be added at the same time as that route. Prerequisite: a fundraiser detail API service (`getCachedFundraiser`) must exist first.

Order within that feature:
1. `src/lib/types/fundraiser.ts` — extend `Fundraiser` with `settings?: { theme?: FundraiserThemeSettings; [key: string]: unknown }`
2. `src/styles/theme-safelist.ts` + add `@source "../styles/theme-safelist.ts"` to globals.css — covers custom gradient strings from DB
3. `src/components/theme/animation-layer.tsx` — stub client component for snow/confetti/hearts
4. `src/app/raise/[id]/layout.tsx` — fetches fundraiser, calls `buildTheme`, applies theme server-side
