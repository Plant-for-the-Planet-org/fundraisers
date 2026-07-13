# Layered Theme Model — POC Implementation Plan

## Context

Fundraiser themes have usability problems in two places:

- **Editor (create/update):** the theme settings panel renders its controls directly on top of the live themed background. Controls use semantic tokens (`border-border`, `bg-muted/*`, `text-muted-foreground`) tuned for a flat white/near-black card, so on mid-tone gradients, photos, or saturated solids the control shapes, active markers, and secondary text become barely visible.
- **Viewing (public page):** elements use opaque tokens that only swap between light/dark. For many background colors and modes, text and element edges do not stand out.

The product team wants to test a **layered theming model**:

1. **Base layer** — mode-driven solid: black (dark) / white (light), 100% opacity.
2. **Color selection** (solid or gradient) tints the **background** at low opacity (~10–20%) and paints the **CTA** at 100%.
3. **Most page elements** = base color at low opacity (translucent frosted surfaces); text stays on the foreground color.
4. **Callout elements** (exception) = reverse-of-base color at low opacity, so they pop.
5. Logos — staggered/offset tiling. **(Deferred from this POC.)**
6. Patterns — monochrome, with the color layer above tinting them.
7. Images — fixed opacity plus a color overlay above, like patterns.

Intended outcome: prove the layered model end to end (editor + page) so text/controls stay legible across colors and modes, using assets we already have. Final pattern/image assets come from Ganga later.

## Decisions

- **Token approach:** additive surface tokens, **not** redefining global shadcn tokens. Redefining `--card`/`--muted`/`--popover` would ripple across ~35 files, break Radix menus that portal outside `ThemeShell`, and clash with the `hsl(var(--x))` wrapper.
- **CTA gradient:** when all gradient stops agree on readable text color, paint the **full gradient** with an auto-picked text color. When stops disagree (light↔dark gradient), **fall back to a solid** derived from the dominant stop so one text color stays legible.
- **POC scope:** core layered look + editor contrast fix + monochrome pattern tint + image color overlay. **Staggered logo tiling deferred.**
- **Tint opacity:** fixed constant (`0.14`) for the POC, tunable in code; a per-theme control is deferred.

## What already exists (reused)

- `src/lib/theme/color-utils.ts` — `hexToRgb`, `getRelativeLuminance`, `getReadableMode` (WCAG threshold 0.179), `getReadableModeForStops`, `isValidHexColor`. Reused for CTA text color and the swatch-contrast helper.
- `src/components/theme/theme-shell.tsx` — already paints `fixed inset-0` layers (gradient → image → pattern → logo → animation → content) and sets `--accent-color` on the wrapper.
- `src/components/fundraisers/theme-settings/background-base-selector.tsx` — `CustomColorButton` already does a luminance-aware icon flip; generalized into `color-utils.ts`.
- `src/lib/theme/backgrounds.ts` — `BG_LIBRARY`, `svgThumb`, `resolveBgAsset`, `DEFAULT_PATTERN_TILE`.

## Steps

Each step is one atomic commit. Ordered so tokens/helpers land before their consumers. Each should type-check/build on its own.

### Step 1 — docs (this file)

Add this plan for the team to reference.

### Step 2 — Surface + base/reverse tokens (`src/app/globals.css`)

Add mode-driven channels to `:root`, `.light`, **and** `.dark` (`.light` backs the forced-light donation overlay boundary):

```css
/* :root and .light */
--base-rgb: 255 255 255;   --reverse-rgb: 0 0 0;
/* .dark */
--base-rgb: 0 0 0;         --reverse-rgb: 255 255 255;
```

Map surface/callout utilities in `@theme` (complete colors, no `hsl()` wrapper):

```css
--color-surface-1: rgb(var(--base-rgb) / 0.06);
--color-surface-2: rgb(var(--base-rgb) / 0.10);
--color-surface-3: rgb(var(--base-rgb) / 0.16);
--color-surface-border: rgb(var(--base-rgb) / 0.14);
--color-callout: rgb(var(--reverse-rgb) / 0.10);
--color-callout-border: rgb(var(--reverse-rgb) / 0.20);
```

Generates `bg-surface-1/2/3`, `bg-callout`, `border-surface-border`, `border-callout-border`. Additive; no visible change on its own.

### Step 3 — Layered base + tint background (`theme-shell.tsx`)

New back→front order: **base solid (new, always, `rgb(var(--base-rgb))` at 100%)** → color tint → image → pattern → logo → animation → blur → content. The user solid/custom-gradient wash renders on a layer at `TINT_OPACITY` (`0.14`) over the base. Preset Tailwind gradient classes keep their authored opacity (back-compat). Opacity is applied on the layer element, not the color.

### Step 4 — Bind CTA to color selection (`theme-shell.tsx` + `donation-form.tsx`)

Set `--cta-bg`/`--cta-foreground` on the ThemeShell wrapper from the color selection:

- solid → `--cta-bg: <hex>`, foreground from `getReadableMode(hex)`.
- gradient, stops agree → `--cta-bg: linear-gradient(...)`, foreground from `getReadableModeForStops`.
- gradient, stops disagree → `--cta-bg` = solid dominant stop, foreground from that stop.

CTA button uses `backgroundImage: var(--cta-bg)` / `color: var(--cta-foreground)`; keep `--accent-color` as fallback so progress fill and SVG-fill consumers keep working.

### Step 5 — Translucent surfaces on page elements

- `donation-form.tsx`: Card → `border border-surface-border bg-surface-2`; header → `bg-surface-3`.
- `goal-progress-display.tsx`: track → `bg-surface-1`; fill stays `bg-accent-color`.
- `closed-for-contribution.tsx`: `bg-transparent` Card → `border border-callout-border bg-callout`.

### Step 6 — Editor panel opaque surface (`theme-settings/index.tsx`)

Give the panel root its own surface so token-based controls resolve against a stable surface, not the live background:

```tsx
<div className='theme-settings flex flex-col gap-3 rounded-xl border bg-popover text-popover-foreground p-4 shadow-sm'>
```

`bg-popover` so the inline color Popover shares one surface color — no seam.

### Step 7 — Swatch-contrast helper (`color-utils.ts` + `background-base-selector.tsx`)

Generalize the `CustomColorButton` pattern:

```ts
export function getSwatchContrast(solid: string | null, stops?: string[] | null):
  { iconClass: string; mode: ThemeMode | null }
export const swatchSelectedStyle: React.CSSProperties  // accent-var border + color-mix halo
```

Adopt in `background-base-selector.tsx` (replaces inline `contrastMode`/`iconColor`/`selectedStyle`). Keep pure/SSR-safe.

### Step 8 — Browse-grid non-blank swatch (`theme-browse-grid.tsx`)

`swatchVisual(bg)` mirrors ThemeShell wash resolution: gradient class → custom-gradient inline → solid hex → decoration thumbnail → `bg-muted` last resort. Fixes blank swatches for solid/image themes.

### Step 9 — Cap decoration opacity slider (`primitives.tsx`)

Lower the practical `max` for pattern/image (e.g. `0.6`) so a tinted decoration can't dominate and invert the effective surface luminance. Keeps mode-derived-from-base-wash correct by construction.

### Step 10 — Monochrome pattern + color tint (`backgrounds.ts` + `theme-shell.tsx`)

Convert one pattern (`dots`) to a monochrome mask. Extend `BackgroundAsset` with optional `maskSrc?: string` (falls back to `src`, so migration is incremental). Add `svgMask(kind)` emitting white shapes on a transparent field. `PatternLayer`: when `maskSrc` exists, paint `backgroundColor: var(--accent-color)` clipped by `mask-image`/`-webkit-mask-image` (repeat, tile size, `opacity`); gaps stay transparent. Opaque path stays as fallback.

### Step 11 — Image color overlay (`theme-shell.tsx` `ImageLayer`)

Add a layer directly above the image: `backgroundColor: var(--accent-color)`, `mixBlendMode: multiply`, `opacity: Math.min(opacity, 0.55)` (reuses the decoration opacity slider, capped). Demonstrated with `bg-planet-botanical`.

## Task checklist

- [ ] 1. This plan doc
- [ ] 2. Surface + base/reverse tokens
- [ ] 3. Layered base + tint background
- [ ] 4. CTA color-selection binding + gradient/solid fallback
- [ ] 5. Translucent surfaces on page elements
- [ ] 6. Editor panel opaque surface
- [ ] 7. Swatch-contrast helper
- [ ] 8. Browse-grid non-blank swatch
- [ ] 9. Decoration opacity cap
- [ ] 10. Monochrome pattern (`dots`) + color tint
- [ ] 11. Image color overlay
- [ ] 12. type-check + lint + build clean; hand to reviewer

## Back-compat notes

- `themes.ts` presets untouched — their gradient classes render at authored opacity, so presets look unchanged. (Presets not yet migrated to the base+tint model — acceptable for POC.)
- Only the user `background_color` / `custom_gradient` branch changes behavior (100% fill → base + low-opacity tint). A previously-stored **dark custom solid** now reads as a subtle tint rather than a full fill — the one visible behavior change to flag to the product team.
- No DB/schema migration. Surface tokens are additive; `buildTheme`/`buildBg` validate the same fields.

## Verification

Do **not** start a dev server. Rely on `npm run type-check`, `npm run lint`, and `npm run build`. Then hand to the reviewer to check the UI across: light/dark mode; a saturated solid, a same-side gradient, and a light↔dark gradient (CTA legibility + solid fallback); the `dots` pattern and botanical image; editor panel readability on each; donation form, goal progress, and the closed-for-contribution callout.

## Deferred (not in this POC)

- Staggered/offset logo tiling (concept item 5) — breaks out separately.
- Surface treatment for the other sidebar cards (ImageSelector, GoalSettings, DonorsPreview, Hosts).
- Migrating the remaining patterns to monochrome; migrating presets to base+tint.
- Per-theme background-tint-opacity control, dedicated pattern/image tint color field, separate overlay-opacity slider.
- Full-stack luminance-aware mode derivation.
