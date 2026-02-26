# Theme System

Documents the current implementation, architectural decisions, and plans for the fundraiser theming system.

---

## Goals

- Each page renders with its correct theme from the first paint — no flash
- Per-fundraiser themes (background, accent, fonts, mode, animation) stored in the DB, applied server-side
- Client components can read the current theme without a separate fetch
- Interactive theme selector in the create/edit fundraiser flow
- Tailwind v4 CSS-first config — no `tailwind.config.js`

---

## Current Status

**Phase 1 is complete.** The following was delivered:

- **All theme types and utilities** — `types.ts`, `themes.ts` (14 predefined themes), `font-utils.ts`, `accent-utils.ts`, `build-theme.ts`, `route-themes.ts` — the full theme library with no external dependencies
- **Flash-free theme rendering on static routes** — the server layout resolves the theme from the route map and applies background, fonts, mode, and accent before the HTML leaves the server; no client-side effect fires to set the theme
- **Class-based dark mode** — replaced `@media (prefers-color-scheme: dark)` with `@variant dark (&:is(.dark *))` in `globals.css`; mode is now controlled by the server layout, not the OS
- **5 fonts loaded** — Open Sans, Inter, Poppins, Playfair Display, and Roboto are loaded in the root layout and available document-wide via CSS variables
- **Route → theme config** — changing a route's theme requires editing only `route-themes.ts`; layout code is untouched
- **`useTheme()` hook** — client components can read the current theme (accent, mode, fonts, etc.) without any fetch or effect
- **Theme infrastructure ready for Phase 2** — `buildTheme` and all utilities are in place; only the fundraiser data service and its layout are missing

**Phase 2 is deferred.** Per-fundraiser themes from the DB are not yet wired up. The fundraiser page (`raise/[id]`) doesn't exist yet.

---

## File Structure

```
src/
  proxy.ts                          ← stamps x-pathname header on every request
  lib/
    theme/
      types.ts                      ← all theme TypeScript types
      themes.ts                     ← 14 predefined themes registry + DEFAULT_THEME
      font-utils.ts                 ← FontId → CSS variable font-family string
      accent-utils.ts               ← AccentColor → Tailwind class sets + hex value
      build-theme.ts                ← FundraiserThemeSettings (DB) → validated Theme
      route-themes.ts               ← route path prefix → theme ID config
  app/
    globals.css                     ← @variant dark, @theme tokens, :root/:dark vars, font rules
    layout.tsx                      ← root layout: font loading, html lang + mode class
    (standard)/
      layout.tsx                    ← standard layout: reads path, applies theme, renders Header/Footer
  components/
    theme/
      theme-provider.tsx            ← 'use client' context bridge; useTheme() hook
```

---

## How the theme renders without flash

The key insight: the server layout knows the theme at render time and bakes it directly into the HTML. Before any JavaScript runs, the browser has:

1. The correct `dark`/`light` class on `<html>` → activates `.dark` CSS variable block
2. The correct gradient/background class on a fixed `<div>` → renders as the visual background
3. The correct font CSS variables and `--accent-color` set via inline `style` → body font and accent immediately correct

No client-side effect fires after hydration to set the theme. The server layout sets everything.

**Client-side navigation** (Next.js `<Link>`) is also fine: when you navigate, the App Router fetches the new RSC payload from the server, which already has the new route's theme applied by its server layout. React reconciles in one DOM update. The `transition-colors duration-300` on the background layer makes the change smooth.

---

## Data flow — step by step

```
1. Browser requests /explore
2. proxy.ts runs → sets response header: x-pathname: /explore
3. Root layout (RSC):
     - reads x-pathname → '/explore'
     - calls getThemeForPath('/explore') → THEMES.stratospheric
     - renders <html lang="en" className="light">  ← mode activates CSS var block
     - renders <body> with all 5 font CSS variables as className
4. StandardLayout (RSC, nested inside root):
     - reads x-pathname → '/explore'  (same header, same pure lookup)
     - calls getThemeForPath('/explore') → THEMES.stratospheric
     - renders:
         <ThemeProvider theme={stratospheric}>
           <div class="light relative min-h-screen flex flex-col"
                style="font-family: var(--font-poppins-var)...;
                       --theme-title-font: var(--font-poppins-var)...;
                       --accent-color: #d97706">
             <div class="fixed inset-0 bg-gradient-to-br from-yellow-100/40 ..."/>
             <div class="relative z-10 ...">
               <Header />
               <main>...</main>
               <Footer />
             </div>
           </div>
         </ThemeProvider>
5. ThemeProvider serialises theme into RSC payload
6. On the client, React hydrates — ThemeContext already has the correct value
7. Client components call useTheme() → get the theme with no fetch
```

---

## The `theme.mode` class: where it lives and why

`theme.mode` (`"light"` or `"dark"`) currently appears in two places:

| Location                                                           | Element           | Why                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [layout.tsx:62](../src/app/layout.tsx#L62)                         | `<html>`          | CSS custom properties in `.dark { ... }` cascade from their element downward. Placing `.dark` on `<html>` means `body`'s `background-color: hsl(var(--background))` and `color: hsl(var(--foreground))` resolve correctly. Removing it from `<html>` leaves `body` using the `:root` (light) values regardless of theme. |
| [(standard)/layout.tsx:24](<../src/app/(standard)/layout.tsx#L24>) | outermost `<div>` | This is the semantic theme boundary — the div where all theme styles are applied (background, fonts, accent). Placing the mode class here makes Tailwind `dark:` utilities work for all descendants and prepares for Phase 2, where a fundraiser layout can override the mode for its subtree independently.             |

The duplication is intentional. Both read from the same `getThemeForPath()` call so they always agree. `getThemeForPath` is a pure in-memory lookup with no I/O, so calling it twice is harmless.

> **Phase 2 note:** When fundraiser pages arrive, the fundraiser's layout will have its own outer div with `theme.mode` from the fundraiser's DB settings. This could be `dark` even if the route-level theme on `<html>` is `light`. The fundraiser div's mode class correctly scopes Tailwind `dark:` utilities for all content inside it. The `<html>` mode class sets the CSS variable baseline for `body`-level rules — there will be a mismatch for fundraisers with modes different from the route default. This is acceptable for Phase 1 and will be addressed in Phase 2 alongside the fundraiser layout.

---

## Modules

### `src/lib/theme/types.ts`

Defines all TypeScript types. Nothing imported from outside the `theme/` directory.

- `AccentColor` — 21 Tailwind color names valid as accent colors
- `FontId` — 5 supported font identifiers
- `AnimationType` — `none | snow | confetti | hearts | particles`
- `ThemeMode` — `light | dark`
- `ThemeCategory` — `minimal | celebration | nature | business | atmospheric`
- `Theme` — the complete theme object used throughout the app
- `FundraiserThemeSettings` — shape stored in `fundraiser.settings.theme` in the DB; uses snake_case and looser string types to match the DB record format; `base_id` references a predefined theme as the base for field-level overrides

---

### `src/lib/theme/themes.ts`

The registry of all 14 predefined themes, exported as `THEMES: Record<string, Theme>`. Also exports `DEFAULT_THEME = THEMES.spring`.

Because this file lives inside `src/`, Tailwind's scanner reads it at build time and includes every gradient class string it finds. No safelist entries are needed for predefined themes.

| ID            | Name                       | Category    | Mode  | Animation | Featured |
| ------------- | -------------------------- | ----------- | ----- | --------- | -------- |
| spring        | Spring Vibes               | nature      | light | none      | ✓        |
| clean         | Clean White                | minimal     | light | none      | ✓        |
| dashboard     | Dashboard                  | business    | light | none      | ✓        |
| birthday      | Birthday Party             | celebration | light | confetti  |          |
| wedding       | Wedding Elegance           | celebration | light | hearts    |          |
| corporate     | Corporate                  | business    | light | none      |          |
| stratospheric | Polar Stratospheric Clouds | atmospheric | light | none      | ✓        |
| sunset        | Sunset                     | nature      | light | none      | ✓        |
| dark-ocean    | Dark Ocean                 | nature      | dark  | none      |          |
| lush-forest   | Lush Forest                | nature      | dark  | snow      |          |
| volcanic      | Volcanic                   | nature      | dark  | none      |          |
| midnight      | Midnight                   | minimal     | dark  | none      |          |
| dark          | Professional Dark          | business    | dark  | none      |          |
| minimal       | Minimal                    | minimal     | light | none      |          |

---

### `src/lib/theme/font-utils.ts`

`getFontStack(font: FontId): string` — maps a `FontId` to the full CSS font-family string referencing Next.js's CSS variable. Used by layouts to set `fontFamily` inline.

---

### `src/lib/theme/accent-utils.ts`

Two exports:

- `getAccentClasses(accent: AccentColor)` — returns `{ button, buttonHover, icon }` Tailwind class strings for each of the 21 accent colors. All strings are hardcoded (not dynamically generated like `bg-${accent}-600`) so Tailwind's scanner picks them up and they're never purged.
- `getAccentColor(accent: AccentColor): string` — returns the hex value for `--accent-color`. Used for SVG fills, canvas, and other non-Tailwind contexts.

---

### `src/lib/theme/build-theme.ts`

`buildTheme(settings?: FundraiserThemeSettings | null): Theme`

Converts a raw DB settings record into a validated `Theme`. Used in Phase 2 by the fundraiser page layout.

- If `settings` is null/undefined, returns `DEFAULT_THEME`
- `base_id` selects a predefined theme as the base; falls back to `DEFAULT_THEME` if unknown
- Each field (`accent`, `mode`, `body_font`, etc.) is validated against a whitelist Set; invalid values fall back to the base theme's value
- Spreads `...base` first, then overrides — ensures `category`, `colorOptions`, and other required fields are always present
- Returns `id: 'fundraiser-custom'` so callers can distinguish from predefined themes

---

### `src/lib/theme/route-themes.ts`

The single source of truth for which theme a route uses.

```ts
const ROUTE_THEME_MAP: Record<string, string> = {
  '/': 'spring',
  '/explore': 'stratospheric',
};
```

`getThemeForPath(pathname: string): Theme` — exact match first, then longest-prefix match, then falls back to the `/` entry. To change a page's theme, edit only this file.

---

### `src/proxy.ts`

Next.js 16 proxy (what Next.js 15 called Middleware). Stamps every request with `x-pathname: <current-path>` so server layouts can read the current URL via `await headers()` — Next.js layouts don't receive the pathname as a prop.

Adding this header makes all routes that read it dynamic (no static caching). For a fundraiser app serving live data, this is expected.

---

### `src/app/globals.css`

Key responsibilities:

- **`@variant dark (&:is(.dark *))`** — class-based dark mode. Tailwind's `dark:` utilities activate when any ancestor has `class="dark"`. OS preference is intentionally ignored; mode is controlled entirely by the server layout.
- **`@theme` block** — maps Next.js font CSS variables to Tailwind font tokens, defines semantic color tokens (`--color-background`, `--color-foreground`, etc.), border radius tokens, and the `xs` breakpoint.
- **`:root`** — light-mode CSS variable defaults.
- **`.dark`** — dark-mode variable overrides. Applied when an ancestor has `class="dark"`.
- **`body`** — uses `var(--theme-body-font, ...)` with Open Sans as fallback; sets `background-color` and `color` from semantic tokens.
- **`h1–h6`** — use `var(--theme-title-font, ...)` with Poppins as fallback.

---

### `src/app/layout.tsx` (root layout)

- Loads all 5 Google Fonts with `display: 'swap'` and a `-var` suffix on the `variable` prop (e.g. `--font-open-sans-var`) to avoid a circular reference with the `@theme` block.
- Puts all font class variables on `<body>`, making them available document-wide.
- Reads `x-pathname`, resolves the route theme, and sets `className={theme.mode}` on `<html>`.
- Does **not** apply background, fonts, or accent — those are the job of nested layouts.

---

### `src/app/(standard)/layout.tsx`

Applies the full theme to the standard pages:

```
<ThemeProvider theme={theme}>
  <div class="theme-{theme.id} {theme.mode} relative min-h-screen flex flex-col"
       data-theme="{theme.id}"
       style="font-family: ...; --theme-title-font: ...; --accent-color: ...">
    <div class="fixed inset-0 {theme.background} transition-colors duration-300" />  ← background
    <div class="relative z-10 flex flex-col min-h-screen">
      <Header />
      <MainContent>{children}</MainContent>
      <Footer />
    </div>
  </div>
</ThemeProvider>
```

- `theme-{id}` class and `data-theme="{id}"` attribute on the outer div identify the active theme. Both are present: the class for CSS targeting via `.theme-spring { }`, the attribute for CSS targeting via `[data-theme="spring"]` and JS access via `el.dataset.theme`. Both attribute and class selectors share the same specificity `(0,0,1,0)`.
- `font-family` is set as a direct inline style (not via `--theme-body-font` CSS variable). This overrides the `body` font for the entire themed subtree.
- `--theme-title-font` is set as a CSS variable, which cascades to all `h1–h6` descendants.
- `--accent-color` is set as a CSS variable for use in non-Tailwind contexts.
- The fixed background layer covers the viewport behind all content.
- `backdrop-blur-[10px]` on the content wrapper creates a frosted-glass effect over the gradient.

---

### `src/components/theme/theme-provider.tsx`

A minimal `'use client'` context bridge. Renders no DOM elements — only `<ThemeContext.Provider>`.

- `ThemeProvider` — receives the theme as a prop from the server layout and provides it to the React tree.
- `useTheme()` — hook for client components to read the current theme. Throws if called outside a `ThemeProvider`.

Because the theme value is a prop from the server (not fetched client-side), it's serialised into the RSC payload and available at first hydration. Client components that call `useTheme()` render correctly on the first pass — no mismatch, no re-render.

`ThemeProvider` is used by **both** server layouts, with different theme sources:

| Layout                              | Theme source                                         |
| ----------------------------------- | ---------------------------------------------------- |
| `(standard)/layout.tsx`             | `getThemeForPath(pathname)` — static route map       |
| `raise/[id]/layout.tsx` _(Phase 2)_ | `buildTheme(fundraiser.settings?.theme)` — DB record |

The provider itself is identical in both cases; only the value passed to it differs. This is why it stays as a pure context bridge with no routing, fetching, or DOM concerns of its own.

---

## Tailwind class scanning

Tailwind v4 scans source files and only emits classes it finds. The theme system relies on this in two ways:

1. **Predefined theme backgrounds** — all gradient strings are hardcoded in `themes.ts`, which lives in `src/`. Tailwind scans it and includes them all automatically.
2. **Accent classes** — all `bg-*-600`, `hover:bg-*-700`, `text-*-500` strings are hardcoded in `accent-utils.ts`. Tailwind scans them; no purging risk.
3. **Custom DB gradients (Phase 2)** — a fundraiser editor will let users build freeform gradient strings. These never appear in source files, so Tailwind would purge them. The solution is a `src/styles/theme-safelist.ts` file containing all possible gradient class combinations as string literals, referenced in `globals.css` with `@source "../src/styles/theme-safelist.ts"`. This is deferred to Phase 2.

---

## Abandoned approach: client-side theme resolution

The earlier version of the project used `EnhancedThemeProvider` — a client component that read the current route and resolved the theme in a `useEffect` after hydration. This caused a visible flash: the page rendered with no theme (or the wrong one) until JavaScript ran and the effect fired.

The current approach eliminates this entirely by resolving the theme in server layouts. The browser receives fully-themed HTML on the first byte.

---

## Abandoned approach: hardcoded per-route theme in the layout

The original Phase 1 plan (in `docs/legacy/theme-system-plan.md`) proposed hardcoding the theme directly in the server layout component:

```tsx
// src/app/(standard)/layout.tsx — original plan
export default function StandardLayout({ children }) {
  return (
    <ThemeProvider theme={THEMES.spring}>
      <div className='light relative ...'>
        <div className='fixed inset-0 bg-gradient-to-br from-emerald-300/25 ...' />
        ...
      </div>
    </ThemeProvider>
  );
}
```

This was replaced by the route-theme map approach (`route-themes.ts`), which keeps the layout code generic and makes theme assignment for new routes a single-line config change. The comment at the top of `(standard)/layout.tsx` documents the pattern: "To change a page's theme, only edit `route-themes.ts`."

---

## Phase 2 — per-fundraiser themes (deferred)

Prerequisite: a `getCachedFundraiser(id)` data service must exist first.

Once that exists, the implementation order is:

1. **`src/lib/types/fundraiser.ts`** — extend `Fundraiser` with `settings?: { theme?: FundraiserThemeSettings; [key: string]: unknown }`
2. **`src/styles/theme-safelist.ts`** — all gradient class combinations as string literals; add `@source "../src/styles/theme-safelist.ts"` to `globals.css`
3. **`src/components/theme/animation-layer.tsx`** — `'use client'` component for snow/confetti/hearts animations, conditionally rendered by the fundraiser layout
4. **`src/app/raise/[id]/layout.tsx`** — fetches the fundraiser server-side, calls `buildTheme(fundraiser.settings?.theme)`, applies the full theme (background, fonts, accent, mode, animation) to the wrapper div

The fundraiser layout follows the same structural pattern as StandardLayout: `ThemeProvider` wrapping a div with mode class, fixed background layer, and inline CSS variables for fonts and accent.

---

## Layout components

**`MainContent`** (`src/components/ui/main-content.tsx`) is used by StandardLayout and will be used by the fundraiser layout in Phase 2. It owns the `flex-1` main element and the `max-w-[960px] rounded-2xl backdrop-blur-[10px]` content wrapper — pure layout, no theme awareness.

**`PageContainer`** (`src/components/ui/page-container.tsx`) is not currently used. It was the original single-div wrapper before the theme system introduced a three-div structure (outer theme wrapper → fixed background layer → z-10 content layer). It could be adapted to accept a `theme` prop for Phase 2 if the pattern is worth extracting once both layouts exist, but that decision is deferred until then.
