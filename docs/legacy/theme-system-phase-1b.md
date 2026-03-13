# Theme System — Phase 1b: Client-Side Theme Updates

Fixes route-based theme switching during client navigation and adds live preview on the create/edit fundraiser flow.

---

## Problem

Phase 1 correctly resolves the theme on the server and renders it flash-free. However, `(standard)/layout.tsx` is a **shared layout** — Next.js App Router freezes it after the first render. Client-side navigation between routes (e.g. `/explore` → `/fundraisers/create`) never re-runs the layout's server code, so `headers()` is never re-read and the theme never changes.

Additionally, the create/edit fundraiser page needs a live theme selector: the user picks a theme and the entire page background/fonts/accent should update immediately.

---

## Root Cause

```
StandardLayout (server, shared)
  └─ reads headers() once on first render → theme frozen
     └─ ThemeProvider (client, pure context bridge)
          └─ value never updates after hydration
```

---

## Solution

### New component: `ThemeShell`

A `'use client'` component that owns all theme rendering. Replaces the server layout's themed div and `ThemeProvider`.

1. Reads `usePathname()` to get the current route
2. Reads `selectedTheme` from a Zustand store (user pick, or `null`)
3. Computes `activeTheme = selectedTheme ?? getThemeForPath(pathname)`
4. Renders the outer theme div (background, fonts, accent, mode class)
5. Syncs `activeTheme.mode` to `document.documentElement` via `useEffect` so body-level CSS variables and `dark:` Tailwind utilities work correctly throughout the document
6. Clears `selectedTheme` whenever `pathname` changes (navigating away resets to route default)

### New Zustand store: `useThemeStore`

```ts
interface ThemeOverrideState {
  selectedTheme: Theme | null;
  setSelectedTheme: (theme: Theme | null) => void;
}
```

`ThemeShell` reads it. The create page's `ThemeSettings` component calls `setSelectedTheme`. Both are client components with direct store access — no React context needed.

### `ThemeProvider` removed

`ThemeProvider` and `useTheme()` were removed. Components that need the active theme read from `useThemeStore` + `usePathname()` directly and compute `activeTheme` the same way `ThemeShell` does.

### Updated `(standard)/layout.tsx`

Simplified to a minimal server component — no more `await headers()` or theme logic. Renders `<ThemeShell>` wrapping `<Header>`, `<MainContent>`, `<Footer>` as RSC children.

### New component: `ThemeSettings`

`'use client'` component in the create fundraiser sidebar. Shows a theme dropdown (featured themes only, filtered via `theme.featured`) and accent color dots. On selection, calls `setSelectedTheme`. Reads `useThemeStore` + `usePathname()` to reflect the active theme.

---

## Data flow after this change

**Initial page load (SSR) — `/explore`:**
```
1. Server renders ThemeShell as a client component
2. usePathname() = '/explore' (available during SSR in App Router)
3. selectedTheme = null (store is empty)
4. activeTheme = getThemeForPath('/explore') = stratospheric
5. Correct theme baked into HTML — no flash
```

**Client navigation → `/fundraisers/create`:**
```
1. usePathname() updates to '/fundraisers/create'
2. ThemeShell useEffect clears selectedTheme (pathname changed)
3. activeTheme = getThemeForPath('/fundraisers/create') = spring
4. Outer div class/style/background updates → theme changes
5. useEffect syncs mode to <html> → CSS variables update document-wide
```

**User picks a theme on `/fundraisers/create`:**
```
1. ThemeSettings calls setSelectedTheme(THEMES.birthday)
2. ThemeShell re-renders: selectedTheme = THEMES.birthday
3. activeTheme = birthday (overrides route default)
4. Live preview updates — background, fonts, accent, mode all change
```

**User changes accent only:**
```
1. ThemeSettings calls setSelectedTheme({ ...activeTheme, accent: 'pink' })
2. ThemeShell updates --accent-color CSS variable
3. Accent dots and any accent-styled UI update immediately
```

---

## Files created / modified

| File | Change |
| ---- | ------ |
| `src/components/theme/theme-shell.tsx` | **New.** Client component — `usePathname` + Zustand + themed div + `<html>` mode sync |
| `src/stores/theme-store.ts` | **New.** Zustand store with `selectedTheme` / `setSelectedTheme` |
| `src/components/fundraisers/theme-settings.tsx` | **New.** Theme dropdown + accent dots for the create sidebar |
| `src/app/(standard)/layout.tsx` | **Simplified.** Removed `headers()` / theme logic; renders `<ThemeShell>` |
| `src/app/layout.tsx` (root) | **No change.** Still reads `x-pathname` once for `<html>` mode class on initial SSR load |
| `src/proxy.ts` | **No change.** Already correctly sets `x-pathname` on request headers |
| `src/components/theme/theme-provider.tsx` | **Deleted.** No longer needed — Zustand store is the shared state layer |

---

## The `theme.mode` class: where it lives now

| Location | Element | When it updates |
| -------- | ------- | --------------- |
| `src/app/layout.tsx` | `<html>` | Server-rendered once; never changes after hydration |
| `ThemeShell` div | outermost theme div | Updates reactively on every `activeTheme` change |
| `ThemeShell` useEffect | `<html>` (via `document.documentElement`) | Syncs on every `activeTheme.mode` change |

The `useEffect` is the key addition in Phase 1b. Without it, `body { color: hsl(var(--foreground)) }` always resolved to the root-level `--foreground` value (light mode), because `body` is an ancestor of the `ThemeShell` div — CSS custom property cascade goes downward, not upward. Syncing the mode to `<html>` ensures the entire document (body text, scrollbar, selection colours) reflects the active theme mode.

---

## Phase 2 — per-fundraiser themes

With `ThemeProvider` removed, Phase 2 uses a different injection pattern. The fundraiser view layout (server component) fetches the fundraiser's theme from the DB, builds a `Theme` via `buildTheme(fundraiser.settings?.theme)`, and passes it to `ThemeShell` as an `initialTheme` prop:

```tsx
// src/app/(fundraiser)/raise/[id]/layout.tsx  (Phase 2, not yet built)
const fundraiser = await getCachedFundraiser(id);
const theme = buildTheme(fundraiser.settings?.theme);

return (
  <ThemeShell initialTheme={theme}>
    {children}
  </ThemeShell>
);
```

`ThemeShell` will need an `initialTheme?: Theme` prop added:

```ts
activeTheme = selectedTheme ?? initialTheme ?? getThemeForPath(pathname)
```

On SSR, `selectedTheme` is null and `initialTheme` is the DB theme → correct theme baked into the HTML, no flash. The store override still layers on top if the user edits the theme on the view page.

The fundraiser view routes will live under a separate route group (e.g. `(fundraiser)`) with their own layout, so they don't inherit the `(standard)` layout's `ThemeShell`.
