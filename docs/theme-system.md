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

**Phase 1 is complete.** Delivered:

- **All theme types and utilities** — `types.ts`, `themes.ts` (14 predefined themes), `font-utils.ts`, `accent-utils.ts`, `build-theme.ts`, `route-themes.ts` — the full theme library with no external dependencies
- **Flash-free theme rendering on static routes** — the server root layout resolves the theme from the route map and applies the mode class to `<html>` before the HTML leaves the server; no client-side effect fires on initial load
- **Class-based dark mode** — replaced `@media (prefers-color-scheme: dark)` with `@variant dark (&:is(.dark *))` in `globals.css`; mode is controlled by the theme system, not the OS
- **5 fonts loaded** — Open Sans, Inter, Poppins, Playfair Display, and Roboto are loaded in the root layout and available document-wide via CSS variables
- **Route → theme config** — changing a route's theme requires editing only `route-themes.ts`; layout code is untouched
- **Theme infrastructure ready for Phase 2** — `buildTheme` and all utilities are in place; only the fundraiser data service and its layout are missing

**Phase 1b is complete.** Delivered:

- **`ThemeShell`** — client component that owns all theme rendering; reads `usePathname()` + Zustand store, updates the theme reactively on client navigation and user selection
- **`useThemeStore`** — Zustand store for user-selected theme overrides on the create/edit flow
- **Live theme selector** — `ThemeSettings` component in the create fundraiser sidebar: featured theme dropdown + accent color picker
- **Dark mode switching** — `ThemeShell` syncs `activeTheme.mode` to `<html>` via `useEffect`, so body-level CSS variables and `dark:` utilities work correctly when the user switches to a dark theme

**Phase 2 is deferred.** Per-fundraiser themes from the DB are not yet wired up. The fundraiser page (`raise/[id]`) doesn't exist yet.

---

## File Structure

```
src/
  proxy.ts                          ← stamps x-pathname header on every request
  stores/
    theme-store.ts                  ← Zustand store: selectedTheme override for create/edit flow
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
    layout.tsx                      ← root layout: font loading, html lang + mode class (SSR only)
    (standard)/
      layout.tsx                    ← minimal server component; renders ThemeShell
  components/
    theme/
      theme-shell.tsx               ← 'use client'; owns theme div + mode sync; reads store + pathname
    fundraisers/
      theme-settings.tsx            ← 'use client'; theme dropdown + accent picker for create sidebar
```

---

## How the theme renders without flash

`ThemeShell` is a `'use client'` component, but `usePathname()` is available during the SSR pass in the App Router, and the Zustand store starts empty — so `activeTheme = selectedTheme ?? getThemeForPath(pathname)` resolves correctly on the server. Before any JavaScript runs, the browser has:

1. The correct `dark`/`light` class on `<html>` (set by the root layout from `x-pathname`) → activates `.dark` CSS variable block for body-level rules
2. The correct `dark`/`light` class on the `ThemeShell` div → Tailwind `dark:` utilities work for all content
3. The correct gradient/background class on a fixed `<div>` → renders as the visual background
4. The correct font CSS variables and `--accent-color` set via inline `style` → body font and accent immediately correct

No flash, no layout shift. After hydration, `ThemeShell` has the same `activeTheme` the server used — React reconciles with no DOM changes.

**Client-side navigation** (Next.js `<Link>`) updates the theme reactively: `ThemeShell` reads `usePathname()`, which changes on navigation. It recomputes `activeTheme = getThemeForPath(newPathname)` and updates the div's classes, inline styles, and CSS variables in one React re-render. The `transition-colors duration-300` on the background layer makes the change smooth.

---

## Data flow — step by step

**SSR — initial request `/explore`:**

```
1. Browser requests /explore
2. proxy.ts runs → sets response header: x-pathname: /explore
3. Root layout (RSC):
     - reads x-pathname → '/explore'
     - calls getThemeForPath('/explore') → THEMES.stratospheric
     - renders <html lang="en" className="light">  ← mode class on <html> for body-level CSS vars
     - renders <body> with all 5 font CSS variables as className
4. StandardLayout (RSC):
     - renders <ThemeShell> wrapping Header / MainContent / Footer
5. ThemeShell (client component, SSR pass):
     - usePathname() = '/explore'
     - selectedTheme = null  (Zustand store starts empty)
     - activeTheme = getThemeForPath('/explore') = stratospheric
     - renders:
         <div class="theme-stratospheric light relative min-h-screen flex flex-col"
              data-theme="stratospheric"
              style="font-family: var(--font-poppins-var)...;
                     --theme-title-font: var(--font-poppins-var)...;
                     --accent-color: #0ea5e9">
           <div class="fixed inset-0 bg-gradient-to-br ..."/>
           <div class="relative z-10 ...">
             <Header />
             <MainContent>...</MainContent>
             <Footer />
           </div>
         </div>
6. React hydrates — ThemeShell already has the correct activeTheme; no re-render needed
```

**Client navigation → `/fundraisers/create`:**

```
1. usePathname() updates to '/fundraisers/create'
2. ThemeShell pathname-change useEffect clears selectedTheme → null
3. activeTheme = getThemeForPath('/fundraisers/create') = spring
4. ThemeShell div class / style / background updates → theme changes live
5. Mode useEffect syncs activeTheme.mode to <html> → CSS variables update document-wide
```

**User picks a theme on `/fundraisers/create`:**

```
1. ThemeSettings calls setSelectedTheme(THEMES['dark-ocean'])
2. useThemeStore updates → ThemeShell re-renders
3. activeTheme = dark-ocean (overrides route default spring)
4. ThemeShell div updates → live preview: background, fonts, accent, mode all change
5. Mode useEffect fires → document.documentElement switches to 'dark'
```

---

## The `theme.mode` class: where it lives and why

`theme.mode` (`"light"` or `"dark"`) appears in three places:

| Location                                           | Element                            | When it updates                                          |
| -------------------------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| [layout.tsx:62](../src/app/layout.tsx#L62) (root)  | `<html>`                           | Server-rendered once; never changes after hydration      |
| `ThemeShell` div                                   | outermost theme div                | Updates reactively on every `activeTheme` change         |
| `ThemeShell` `useEffect`                           | `<html>` via `document.documentElement` | Syncs on every `activeTheme.mode` change            |

**Why both the div and `<html>` need the mode class:**

CSS custom properties cascade _downward_ from the element they're declared on. `body` is a child of `<html>` but a _parent_ of the `ThemeShell` div — placing `.dark` only on the div cannot affect `body { color: hsl(var(--foreground)) }`, because `body` is an ancestor of the div, not a descendant. Without syncing to `<html>`, switching to a dark theme would update all content _inside_ `ThemeShell` but leave the body's text color, background, and scrollbar in light-mode values.

The `ThemeShell` `useEffect` solves this by calling `document.documentElement.classList.remove('light', 'dark')` and then `.add(activeTheme.mode)` whenever the active theme's mode changes.

> **Phase 2 note:** When fundraiser pages arrive with their own `ThemeShell` (or an equivalent), the same `useEffect` pattern handles the case where a fundraiser's mode differs from the route default. The `<html>` mode class is always kept in sync with the innermost active theme.

---

## Modules

### `src/lib/theme/types.ts`

Defines all TypeScript types. Nothing imported from outside the `theme/` directory.

- `AccentColor` — 21 Tailwind color names valid as accent colors
- `FontId` — 5 supported font identifiers
- `AnimationType` — `none | snow | confetti | hearts | particles`
- `ThemeMode` — `light | dark`
- `ThemeCategory` — `atmospheric | celebration | nature | minimal | business | system | seasonal | corporate | simple | dark`
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
  '/fundraisers/create': 'spring',
};
```

`getThemeForPath(pathname: string): Theme` — exact match first, then longest-prefix match, then falls back to the `/` entry. To change a page's theme, edit only this file.

---

### `src/proxy.ts`

Next.js 16 proxy (what Next.js 15 called Middleware). Stamps every request with `x-pathname: <current-path>` so server components can read the current URL via `await headers()` — Next.js layouts don't receive the pathname as a prop.

Only the **root layout** reads `x-pathname` (to set the initial `<html>` mode class for SSR). `ThemeShell` uses `usePathname()` directly — no header reads needed on the client. Standard layout no longer reads `x-pathname` at all.

Adding this header makes all routes dynamic (no static caching). For a fundraiser app serving live data, this is expected.

---

### `src/app/globals.css`

Key responsibilities:

- **`@variant dark (&:is(.dark *))`** — class-based dark mode. Tailwind's `dark:` utilities activate when any ancestor has `class="dark"`. OS preference is intentionally ignored; mode is controlled entirely by the theme system (`ThemeShell`).
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

A minimal server component. No theme logic — just renders `ThemeShell` wrapping the page structure:

```tsx
export default function StandardLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeShell>
      <Header />
      <MainContent>{children}</MainContent>
      <Footer />
    </ThemeShell>
  );
}
```

All theme rendering is delegated to `ThemeShell`. `Header`, `MainContent`, and `Footer` are RSC children passed through as opaque React nodes — they are server components and never re-render when the theme changes.

---

### `src/components/theme/theme-shell.tsx`

`'use client'` component that owns all theme rendering. Runs on both server (SSR pass) and client.

```
<div class="theme-{activeTheme.id} {activeTheme.mode} relative min-h-screen flex flex-col"
     data-theme="{activeTheme.id}"
     style="font-family: ...; --theme-title-font: ...; --accent-color: ...">
  <div class="fixed inset-0 {activeTheme.background} transition-colors duration-300" />
  <div class="relative z-10 flex flex-col min-h-screen">
    {children}
  </div>
</div>
```

- `theme-{id}` class and `data-theme="{id}"` attribute identify the active theme for CSS/JS targeting.
- `font-family` inline style overrides the `body` font for the entire themed subtree.
- `--theme-title-font` cascades to all `h1–h6` descendants.
- `--accent-color` is a CSS variable for non-Tailwind contexts (SVG, canvas).
- The fixed background layer covers the viewport behind all content.
- Two `useEffect`s run after mount: one clears `selectedTheme` when the pathname changes; the other syncs `activeTheme.mode` to `document.documentElement`.

---

### `src/stores/theme-store.ts`

Zustand store with a single slice:

```ts
interface ThemeOverrideState {
  selectedTheme: Theme | null;
  setSelectedTheme: (theme: Theme | null) => void;
}
```

`ThemeShell` reads `selectedTheme` and calls `setSelectedTheme(null)` on route change. `ThemeSettings` calls `setSelectedTheme(theme)` when the user picks a theme or accent. Both are client components with direct store access — no React context or prop drilling needed.

---

### `src/components/fundraisers/theme-settings.tsx`

`'use client'` component rendered in the create fundraiser sidebar. Gives the user a live theme preview while building their fundraiser:

- **Theme dropdown** — lists only `featured` themes (filtered via `theme.featured`). Selecting one calls `setSelectedTheme(theme)`.
- **Accent color picker** — renders the active theme's `colorOptions` as coloured dots. Clicking one calls `setSelectedTheme({ ...activeTheme, accent })`, preserving all other theme properties.
- Reads `useThemeStore()` + `usePathname()` to compute `activeTheme = selectedTheme ?? getThemeForPath(pathname)`, mirroring the same logic as `ThemeShell` so the displayed selection always matches what the user sees.

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

## Abandoned approach: ThemeProvider as the client-side theme bridge

The Phase 1b plan initially kept `ThemeProvider` (a React context bridge) alongside the new Zustand store. The idea was: `ThemeShell` wraps children in `<ThemeProvider theme={activeTheme}>`, and client components call `useTheme()` to read the current theme without importing the store.

This was dropped because it introduced pointless duplication. `ThemeShell` (the producer) and `ThemeSettings` (the consumer) are both client components — they can both import `useThemeStore` directly. There is no server/client boundary between them that would require a context bridge. Two sources of truth for the same value is a bug waiting to happen.

The conclusion: if all components that need to read a value are client components, use a Zustand store. `ThemeProvider` / `useTheme()` were deleted.

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

Fundraiser view routes live under a separate route group (e.g. `(fundraiser)`) with their own layout, so they don't inherit the `(standard)` layout's `ThemeShell`.

The server layout fetches the fundraiser, calls `buildTheme`, and passes the result to `ThemeShell` as an `initialTheme` prop:

```tsx
// src/app/(fundraiser)/raise/[id]/layout.tsx
const fundraiser = await getCachedFundraiser(id);
const theme = buildTheme(fundraiser.settings?.theme);

return (
  <ThemeShell initialTheme={theme}>
    {children}
  </ThemeShell>
);
```

`ThemeShell` needs one additional prop and one change to its `activeTheme` computation:

```ts
// Props
initialTheme?: Theme

// activeTheme resolution
activeTheme = selectedTheme ?? initialTheme ?? getThemeForPath(pathname)
```

On SSR, `selectedTheme` is null and `initialTheme` is the DB theme → correct theme baked into HTML, no flash. The Zustand store override layers on top if the user edits the theme on the view page (e.g. for a live preview in an edit mode).

Once that exists, the full implementation order is:

1. **`src/lib/types/fundraiser.ts`** — extend `Fundraiser` with `settings?: { theme?: FundraiserThemeSettings; [key: string]: unknown }`
2. **`src/components/theme/theme-shell.tsx`** — add `initialTheme?: Theme` prop; update `activeTheme` resolution
3. **`src/styles/theme-safelist.ts`** — all gradient class combinations as string literals; add `@source "../src/styles/theme-safelist.ts"` to `globals.css`
4. **`src/components/theme/animation-layer.tsx`** — `'use client'` component for snow/confetti/hearts animations, conditionally rendered by the fundraiser layout
5. **`src/app/(fundraiser)/raise/[id]/layout.tsx`** — fetches the fundraiser server-side, calls `buildTheme(fundraiser.settings?.theme)`, passes result to `ThemeShell` as `initialTheme`

---

## Layout components

**`MainContent`** (`src/components/ui/main-content.tsx`) is used by StandardLayout and will be used by the fundraiser layout in Phase 2. It owns the `flex-1` main element and the `max-w-[960px] rounded-2xl backdrop-blur-[10px]` content wrapper — pure layout, no theme awareness.

**`PageContainer`** (`src/components/ui/page-container.tsx`) is not currently used. It was the original single-div wrapper before the theme system introduced a three-div structure (outer theme wrapper → fixed background layer → z-10 content layer). It could be adapted to accept a `theme` prop for Phase 2 if the pattern is worth extracting once both layouts exist, but that decision is deferred until then.
