# Layered Theme Model — POC

## Context

Fundraiser themes had usability problems in two places:

- **Editor (create/update):** the theme settings panel rendered its controls directly on the live themed background. Controls used semantic tokens (`border-border`, `bg-muted/*`, `text-muted-foreground`) tuned for a flat white/near-black card, so on mid-tone gradients, photos, or saturated solids the control shapes, active markers, and secondary text became barely visible.
- **Viewing (public page):** elements used opaque tokens that only swap between light/dark. For many background colours and modes, text and element edges did not stand out.

The product team wanted to test a **layered theming model**: a mode base layer, the picked colour as a low-opacity tint (and the single accent), most surfaces as the base colour at low opacity, callouts as the reverse colour, and monochrome patterns/images tinted by the accent.

This POC proves that model end to end (editor + page) so text and controls stay legible across colours and modes. Final curated assets come from design later.

## What this delivers

A background is now built as **layers** instead of one opaque fill, and **one accent colour** drives every themed element. Surfaces are the mode base colour at a low opacity (frosted), callouts are the reverse colour, and patterns are monochrome stencils tinted by the accent. The editor panel sits on its own scrim so its controls stay readable on any background.

## How it works (current implementation)

### Render stack — `src/components/theme/theme-shell.tsx`

Back to front:

1. **Base** — the mode colour (white in light, black in dark) at 100%: `rgb(var(--base-rgb))`.
2. **Colour tint** — the picked background *over* the base. A preset Tailwind gradient class keeps its authored opacity; a custom gradient or solid colour renders on a layer at a low fixed opacity (`TINT_OPACITY = 0.14`). So the page reads as a subtle tint of the base, not a full fill.
3. **Image** — the image plus a colour `multiply` overlay (capped). The overlay colour follows the **Image colour** setting (see Decoration tint below): the background colour (default), the accent, or none.
4. **Pattern** — masked stencil, painted with the accent (default) or the background colour per the **Pattern colour** setting.
5. **Logo → animation → content.**

The wrapper sets `--accent-color`, `--theme-bg-color` (the chosen background colour at full strength, for decoration tints), and `--cta-foreground` (the CTA text colour, auto-picked for contrast).

### Surface tokens — `src/app/globals.css`

- `--base-rgb` / `--reverse-rgb` flip per mode in `:root`, `.light`, and `.dark` (`.light` is needed because it backs the forced-light donation overlay).
- `@theme` exposes `--color-base` and `--color-reverse` as complete colours.
- Every surface is written as that colour at an opacity: `bg-base/20`, `bg-reverse/10`, `border-base/14`. One number controls each surface.
- **Frosted surfaces** = base at low opacity (donation card + body, inputs, progress track). **Callouts** = reverse at low opacity (workspace info, closed-for-contribution) so they pop. Text keeps `text-foreground`, which already inverts by mode.

### One accent colour

- The accent drives the **CTA button and the nav "Planting" logo** (both read `--accent-color`; the logo already did, since the header is inside `ThemeShell`). The **goal progress bar** is meant to use the accent too (`bg-accent-color`) but currently renders the default green instead — see Known issues. Image and pattern decorations are tinted by the **background colour** by default instead, so the accent stays a highlight and does not recolour a full-page image (see Decoration tint).
- Picking a background **seeds** the accent: a solid uses its hex, a custom gradient uses its dominant stop (`getDominantStopColor`). A preset accent chip overrides until the next background change.
- The CTA is the **solid accent** with auto-picked text colour (`getReadableMode`).
- The accent now accepts a raw hex, not only the named palette. No data change: the field was already `z.string()`, so this widens accepted values (named accents still work).

### Decoration tint (image + pattern)

The background colour, not the accent, tints decorations. Persisted optional bg fields carry the choice (added the same way as `image_mode`/`animation`: TS type + `DEFAULT_BG` + validators + `buildBg` + the zod schema — the field must be in zod because `FundraiserFormValues` is `z.infer` and zod strips unknown keys):

- `image_tint`: `none` (no overlay — the image shows at its opacity and the wash shows through), `background` (default), `accent`, or `custom` (a saved `image_color` hex).
- `pattern_tint`: `accent` (default), `background`, or `custom` (a saved `pattern_color` hex).

`ThemeShell` exposes `--theme-bg-color = solidColor ?? getDominantStopColor(cg.stops) ?? accentColor`. The fallback to the accent means a preset-gradient wash with no extractable hex renders as before until a solid/custom colour is picked. The editor uses one shared control (`DecorationColorControl`): a palette pill on the Pattern/Image header opens the solid picker (`SolidPicker`, extracted to its own file), whose preset row is Accent / Background / Current (plus None for images) in place of the generic quick picks — dragging or typing a colour switches to the `custom` tint. Labels come from the `en`/`de` translation files.

### Curated patterns (masked stencils) — `backgrounds.ts` + `AssetGrid`

- Four curated patterns: **Dots, Grid, Trees, Woodgrain**. Each is **one SVG stencil** (white shapes on a transparent field).
- `masked: true` means: paint a colour (the accent or the background, per `pattern_tint`) and clip it through the stencil, so the shapes take that colour and the gaps show the background through. `fullBleed` covers the viewport once; others tile at `tileSize`.
- The picker thumbnail draws through the **same** stencil (`foreground` shapes on a `muted` cell) so it reads in light and dark, zoomed so a few motifs show (`THUMB_MASK_SIZE`, with a per-asset `thumbMaskSize` override, e.g. Woodgrain).
- One curated image (**Forest**). The picker is limited to a curated allow-list (`PICKABLE_BG_IDS`); legacy placeholder assets stay in the library as resources but are hidden.
- Assets optimised before commit: Trees SVG via SVGO (~2.3 MB → ~0.9 MB, visually identical), Forest PNG → JPEG (~3.4 MB → ~0.6 MB).

### Editor legibility — `theme-settings/*`

- The panel sits on a **quiet frosted box** (`bg-base/10 dark:bg-white/10`, rounded, padded, no border), chosen from a temporary original/quiet/none comparison (now removed). Background-colour swatches were shrunk (`h-9` → `h-8`) so the row stays on one line inside the box.
- Accent selection is available in **both** the Theme tab and the Background tab (shared `AccentDotRow`); the Background tab adds a dot for the current background colour so the accent can snap back to it. It is one value (`settings.theme.accent`), two displays.
- A reusable swatch-contrast helper (`getSwatchContrast` / `swatchSelectedStyle` in `color-utils.ts`) flips the swatch icon and halo by luminance.
- The browse grid renders a real preview for every theme (gradient, solid, or decoration) instead of a blank cell.
- The decoration opacity slider allows full opacity (`DECORATION_MAX_OPACITY = 1`). Mode is a deliberate toggle rather than derived from the wash, so a strong decoration no longer risks flipping the effective contrast.

### Defaults

- New backgrounds default decoration opacity to **20%** (was 50%). Existing saved values are left alone.
- The background-colour wash opacity is user-adjustable (`background_opacity`, default **14%**) via a slider in the colour section, shown only for a user solid/custom gradient — presets keep their authored alpha. Existing fundraisers fall back to 14%.
- `image_tint` defaults to `background`, `pattern_tint` to `accent`; `image_color`/`pattern_color` default to `null` (used only when the tint is `custom`).
- The **Plant-for-the-Planet** preset overrides `image_tint` to `none`, so its botanical illustration shows in its own colours.

## Key files

- `src/app/globals.css` — base/reverse channels + `@theme` colours.
- `src/components/theme/theme-shell.tsx` — layer stack, `--accent-color` / `--cta-foreground`, masked `PatternLayer`, image overlay.
- `src/lib/theme/backgrounds.ts` — `BackgroundAsset` (`masked` / `thumb?` / `thumbMaskSize?` / `fullBleed?`), curated library, `DEFAULT_BG`.
- `src/lib/theme/{color-utils,accent-utils,build-theme}.ts` — accent-as-hex, dominant stop, swatch contrast.
- `src/components/fundraisers/theme-settings/*` — panel scrim, background tab, `AssetGrid` thumbnails, browse grid.
- `src/components/fundraisers/{donation-form,goal-progress-display,closed-for-contribution,workspace-info}.tsx` — surfaces + CTA.

## Decisions, and paths we tried then dropped

The final shape is quite different from the first plan. What changed and why:

- **Redefining global shadcn tokens (`--card`/`--muted`/`--popover`) — rejected up front.** It would ripple across ~35 files, break Radix menus that portal outside `ThemeShell`, and clash with the `hsl(var(--x))` wrapper. We added new tokens instead.
- **Fixed surface ramp (`--color-surface-1/2/3` + callout tokens) — built, then replaced.** Every design request was phrased as "base (or reverse) colour at N%", so the ramp became `--color-base` / `--color-reverse` plus Tailwind opacity modifiers (`bg-base/30`). One number per surface, matching how the look is specified.
- **Gradient CTA — built, then removed.** An earlier version painted the full gradient on the CTA (with a solid fallback when a light↔dark gradient had no single readable text colour). When the accent was unified, the CTA became the **solid accent**, so that logic (and `--cta-bg`) was dropped.
- **Mode derived from the picked colour — dropped.** In the layered model the colour is only a tint over the mode base, so light/dark is a deliberate toggle, not inferred from the colour.
- **Separate mask file per pattern (`maskSrc`) — introduced, then replaced.** Once patterns became single stencils, a `masked` boolean on `src` does the job; the redundant `maskSrc` field was removed.
- **Two files per pattern (artwork thumbnail + mask) — collapsed to one.** The thumbnail now renders through the same stencil, so each pattern is a single file.
- **A plain-vs-masked comparison entry (`bg-sample-3-plain`) — temporary, removed** once masking was confirmed as the approach.
- **Fully opaque editor panel (`bg-popover`) — softened** to a base-colour scrim with a border.
- **A "surface" Tabs variant — built then reverted, deferred.** Tabs are a shared primitive and several sit on opaque surfaces; bundle-selection is a custom segmented control. Needs its own pass.
- **Higher woodgrain thumbnail zoom — tried, reversed.** Zooming *in* collapsed it to a few plain lines and cut out the knots, so it reads better at a lower zoom. This is why the per-asset `thumbMaskSize` override exists.
- **Accent tinting every decoration — reversed.** Round 2 pointed the image overlay and pattern paint at the accent. That meant changing the accent recoloured a full-cover image (very visible on the Plant-for-the-Planet theme). Now the background colour tints decorations and the accent is reserved for the CTA, progress, and nav logo, with the per-decoration overrides above.

## Back-compat

- No DB/schema migration. Surface tokens are additive; `buildTheme`/`buildBg` validate the same fields. The accent widened from named-only to named-or-hex (named accents unchanged).
- Presets are unchanged: their gradient classes render at authored opacity, and the two presets that carry a decoration set its opacity explicitly, so the new 20% default does not touch them.
- One visible behaviour change to flag: a previously-stored **dark custom solid** now reads as a subtle tint rather than a full fill.

## Verification

Per project convention, no dev server. `npm run type-check`, `npm run lint`, and `npm run build` are clean. Reviewer checks in-browser:

- light and dark mode;
- a saturated solid, a same-side gradient, and a light↔dark gradient (CTA text stays legible);
- the four patterns (accent tint, background through the gaps) and the Forest image;
- editor panel readability on each of the above;
- donation form, goal progress, and the closed-for-contribution callout on the public page.

## Known issues (not fixed in this PR)

- **Goal progress bar does not pick up the accent colour.** The fill uses `bg-accent-color` (→ `var(--accent-color)`), which is correct in code, but in the live view it falls back to the `:root` default green instead of the theme accent. Likely a cascade/scope issue where that element does not resolve the themed `--accent-color`. Left as a follow-up so it is not forgotten; not fixed here.

## Open decisions (settle with design, then clean up)

The tint controls are **exploratory** — they exist so the design team can compare looks. Once a direction is chosen, some of this changes:

- **Keep the controls, or bake a default?** If the answer is a single fixed behaviour (e.g. "images always follow the background"), remove the controls and keep just the default value; the persisted fields can stay (harmless) or be dropped. If per-fundraiser choice stays, the controls remain.
- ~~i18n.~~ Resolved: the editor labels now use `en`/`de` translation keys (`labelBackgroundOpacity`, `labelPatternColor`, `labelImageColor`, `tintAccent`/`tintBackground`/`tintCurrent`, reusing `labelBackgroundColor` and `baseNone`). German values are provisional pending a Lingohub pass.
- **Which options survive.** If images should never be accent-tinted, drop the `accent` option from `image_tint`. If patterns are always the accent, drop `pattern_tint` entirely.
- **Default per theme.** `image_tint` defaults to `background` globally and `none` on the planet preset. Design may want other presets to override too (e.g. photo backgrounds set to `none`).
- **`--theme-bg-color` fallback.** When the wash is a preset gradient class (no extractable hex) the tint falls back to the accent. If that is wrong for a chosen look, change the fallback (e.g. a neutral, or no overlay).
- **B&W images.** With `background`/`accent` tint they pick up colour; only `none` keeps them greyscale. If greyscale is the intent, set those assets' default to `none` or add a per-asset "no tint" flag.
- ~~Planet image opacity vs the editor cap.~~ Resolved: the decoration slider now allows full opacity (`DECORATION_MAX_OPACITY = 1`), so the planet preset's `opacity: 1` is reachable and nudging the slider no longer forces a drop.

### Dark-mode surfaces: a `surface` token (cleanup, if this ships)

Frosted surfaces are written as `bg-base/N`, which is white/N in light but **black/N in dark** (nearly invisible on the dark base). The fix in place (option 1, done) is a per-element `dark:bg-white/N` override on each surface: donation card, header, body, amount rows, theme panel, rich-text editor (container + toolbar), goal input, workspace selector. Controls were brought along too: the switch uses a lighter unchecked track (`dark:...bg-reverse/15`) and a light thumb (`dark:bg-foreground`), and the selected amount border uses `dark:border-foreground` so it beats shadcn's `dark:border-input` (a plain `border-foreground` loses to that variant on a `Button`). Callouts (`bg-reverse/N`, e.g. workspace-info) already go white in dark, so they only needed small opacity nudges.

The cleaner long-term shape (option 2, **not done** — this whole POC may still be abandoned, so it is a cleanup task only if we continue) is a dedicated **`surface` token that is white-frost in both modes with per-mode opacity baked in** (e.g. `--surface`, `--surface-emphasis`, `--surface-field` defined in `:root`/`.light`/`.dark` and mapped in `@theme`), so each surface is one class (`bg-surface`) that is correct in both modes and new surfaces get it for free. It reintroduces a small named ramp (which round 1 removed) but pinned to white rather than `--base-rgb`. Migration = swap the `bg-base/N dark:bg-white/N` pairs above for `bg-surface*` across ~6-8 files.

## Deferred (not in this POC)

- Staggered/offset logo tiling (original concept item 5).
- A "surface" Tabs variant (built then reverted; needs its own pass).
- Surface treatment for the other sidebar cards (ImageSelector, GoalSettings, DonorsPreview, Hosts).
- Migrating the remaining legacy patterns and the presets to the base+tint model. (The background-opacity slider is scoped to the user solid/custom-gradient wash and hidden for presets, which keep their authored alpha until migrated.)
- A separate decoration overlay-opacity slider, distinct from the layer opacity. (Background-colour wash opacity and custom pattern/image tint colours are now implemented, not deferred.)
- Full-stack luminance-aware mode derivation.
