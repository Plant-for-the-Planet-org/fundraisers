# Animation Overlay - Implementation & Configuration Guide

## Overview

Custom canvas-based particle animation system for the fundraiser theme selector. Zero external dependencies. Renders 4 animation types (snow, confetti, hearts, particles) on a `<canvas>` overlay using `requestAnimationFrame`.

Branch: `feature/animation-package` (extends `feature/theme-selector` / PR #119)

---

## Architecture

```
ThemeShell (theme-shell.tsx)
  |-- ImageLayer
  |-- GradientLayer
  |-- PatternLayer
  |-- LogoLayer
  |-- AnimationOverlay (z-[5])   <-- NEW
  |-- Content (z-10)
```

### Files Created

| File                                         | Purpose                                                               |
| -------------------------------------------- | --------------------------------------------------------------------- |
| `src/components/theme/animation-configs.ts`  | Config objects per animation type: count, speed, size, colors, draw() |
| `src/components/theme/animation-overlay.tsx` | Canvas renderer component with rAF loop                               |

### Files Modified

| File                                   | Change                                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/components/theme/theme-shell.tsx` | Added `next/dynamic` import + `<AnimationOverlay>` between decoration layers and content |

### Files NOT Modified (already existed)

- `src/lib/theme/types.ts` - `AnimationType` union already defined
- `src/lib/theme/backgrounds.ts` - `isValidAnimation()` already exists
- `src/lib/theme/build-theme.ts` - animation field already handled
- `src/components/fundraisers/theme-settings/background-tab.tsx` - AnimationRow UI already works
- `package.json` - no new deps

---

## Design Decisions

### Why custom canvas (not a library)?

- **Zero bundle impact** - no new packages (tsparticles = 40-60KB gzipped)
- **GPU composited** - single canvas layer, no DOM bloat (Framer Motion = DOM-based)
- **Full visual control** - each animation type has custom draw()
- **Matches codebase patterns** - ThemeShell already builds layers from scratch (SVG data URIs, inline styles)
- CSS-only rejected: can't achieve natural random drift/rotation

### StrictMode compatibility

React StrictMode runs effects twice in dev. Original approach used a shared `useRef` for rAF state, causing a race condition where two animation loops ran simultaneously - one drawing, the other clearing. Fix: local variables scoped to each effect run + `let alive = true` flag checked at loop top.

### Canvas DPR handling

Used `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` instead of `ctx.scale(dpr, dpr)` to prevent transform accumulation on resize.

---

## Performance

- 25-40 particles per type on single canvas = negligible CPU
- `will-change: transform` for GPU compositing hint
- rAF paused when `document.hidden` (tab not visible)
- `next/dynamic` with `ssr: false` - canvas never renders on server
- AnimationOverlay not loaded at all when `animation === 'none'`
- Particle count reduced 40% on mobile (`width < 768`)
- `prefers-reduced-motion` respected (particles shown static, no update)
- Debounced resize handler (200ms)

---

## Animation Types

### Snow (crystal snowflakes)

- **Shape**: 6-arm crystal with branches + center dot, stroke-based
- **Direction**: Falls downward with sinusoidal horizontal sway
- **Colors**: White, light-blue (`#ffffff`, `#e0f2fe`, `#bae6fd`)
- **Alternative**: Round circles available as comments (lines 93-96)

### Confetti

- **Shape**: Rotated colored rectangles
- **Direction**: Falls downward with horizontal drift + rotation
- **Colors**: 6-color palette (rose, blue, yellow, green, purple, orange)

### Hearts

- **Shape**: Bezier curve heart, elongated (height = width x 1.6)
- **Direction**: Floats upward with sinusoidal sway
- **Colors**: Pink, rose, red shades

### Particles (stars)

- **Shape**: 4-point curved star using `quadraticCurveTo` insets
- **Direction**: Random slow drift in all directions
- **Effect**: Twinkle (opacity oscillates via `sin(time)`) + shadowBlur glow
- **Colors**: Theme-mode aware
  - Light mode: gold, amber, white
  - Dark mode: white, silver, slate

---

## Configuration Reference

All tunable params in `src/components/theme/animation-configs.ts`.

### Snow - lines 43-98

| Param           | Line  | Default       | What it controls                 |
| --------------- | ----- | ------------- | -------------------------------- |
| `count`         | 44    | `40`          | Number of snowflakes             |
| `speedRange`    | 45    | `[0.3, 0.8]`  | Fall speed (px/frame)            |
| `sizeRange`     | 46    | `[4, 8]`      | Crystal radius in px             |
| `driftRange`    | 47    | `[-0.3, 0.3]` | Horizontal drift per frame       |
| `opacityRange`  | 48    | `[0.4, 0.8]`  | Transparency range               |
| `colors`        | 49    | white/blue    | Array of hex colors              |
| `shadowBlur`    | 68    | `3`           | Glow intensity around crystal    |
| `lineWidth`     | 69    | `1.5`         | Crystal arm thickness            |
| `arms`          | 71    | `6`           | Number of crystal arms           |
| Branch geometry | 82-85 | `0.25`/`0.5`  | Branch length/spread on each arm |
| Center dot      | 89    | `s * 0.15`    | Radius of center circle          |
| Sway frequency  | 55    | `0.001`       | How fast sway oscillates         |
| Sway amplitude  | 55    | `0.5`         | How wide sway goes               |

### Confetti - lines 109-140

| Param             | Line    | Default       | What it controls                     |
| ----------------- | ------- | ------------- | ------------------------------------ |
| `count`           | 110     | `35`          | Number of confetti pieces            |
| `speedRange`      | 111     | `[0.5, 1.2]`  | Fall speed                           |
| `sizeRange`       | 112     | `[3, 6]`      | Rectangle base size                  |
| `driftRange`      | 113     | `[-0.4, 0.4]` | Horizontal drift                     |
| `opacityRange`    | 114     | `[0.7, 1]`    | Transparency                         |
| `CONFETTI_COLORS` | 100-107 | 6-color array | Color palette (modify here)          |
| Rotation speed    | 122     | `0.03`        | Spin rate per frame (radians)        |
| Shape ratio       | 137     | `0.8 x 2`     | Width/height multipliers on fillRect |

### Hearts - lines 142-175

| Param          | Line    | Default       | What it controls                   |
| -------------- | ------- | ------------- | ---------------------------------- |
| `count`        | 143     | `25`          | Number of hearts                   |
| `speedRange`   | 144     | `[0.2, 0.6]`  | Float-up speed                     |
| `sizeRange`    | 145     | `[6, 12]`     | Heart width (half-width)           |
| `driftRange`   | 146     | `[-0.2, 0.2]` | Base horizontal drift              |
| `opacityRange` | 147     | `[0.3, 0.6]`  | Transparency                       |
| `colors`       | 148     | pink/rose/red | Heart color palette                |
| Sway frequency | 154     | `0.0008`      | Sinusoidal sway oscillation speed  |
| Sway amplitude | 154     | `0.4`         | Sway width                         |
| Height ratio   | 166     | `s * 1.6`     | Heart elongation (bigger = taller) |
| Bezier curves  | 168-172 | -             | Control points for heart shape     |

### Particles (stars) - lines 183-246

| Param             | Line    | Default          | What it controls                           |
| ----------------- | ------- | ---------------- | ------------------------------------------ |
| `count`           | 185     | `30`             | Number of star particles                   |
| `speedRange`      | 186     | `[0.1, 0.4]`     | Vertical drift speed                       |
| `sizeRange`       | 187     | `[3, 6]`         | Star outer radius                          |
| `driftRange`      | 188     | `[-0.2, 0.2]`    | Horizontal drift                           |
| `opacityRange`    | 189     | `[0.4, 0.85]`    | Base transparency range                    |
| Dark mode colors  | 179     | white/silver     | `getParticleColors()` dark branch          |
| Light mode colors | 180     | gold/amber/white | `getParticleColors()` light branch         |
| `shadowBlur`      | 210     | `4`              | Glow radius around star                    |
| `points`          | 212     | `4`              | Number of star points                      |
| `inner`           | 213     | `s * 0.3`        | Inset depth (smaller = deeper star indent) |
| Curve tightness   | 226     | `0.35`           | `cpR` multiplier for curve shape           |
| Twinkle speed     | 200     | `0.002`          | Opacity oscillation frequency              |
| Twinkle amplitude | 200     | `0.2`            | Opacity oscillation range                  |
| Drift override    | 193-194 | `[-0.2, 0.2]`    | Random bidirectional drift in init         |

---

## Common Modifications

### Make any animation more/less dense

Change `count`. Mobile auto-reduces to `count * 0.6`.

### Make particles bigger/smaller

Change `sizeRange`. First number = minimum, second = maximum.

### Make animation faster/slower

Change `speedRange`. Values are px/frame at 60fps.

### Change colors

Modify the `colors` array. Use hex strings. For particles, edit `getParticleColors()` at line 177.

### Switch snow to round circles

Uncomment lines 93-96, comment out lines 72-91 (crystal drawing code).

### Make hearts more/less elongated

Change `s * 1.6` on line 166. Higher = taller hearts. `s * 1.0` = squat, `s * 2.0` = very tall.

### Make star particles more prominent

- Increase `sizeRange` (e.g., `[4, 8]`)
- Increase `opacityRange` (e.g., `[0.6, 1.0]`)
- Increase `shadowBlur` (e.g., `6` or `8`)
- Decrease `inner` ratio (e.g., `s * 0.2` for deeper star points)

---

## Verification Checklist

1. Start dev server (`npm run dev`)
2. Navigate to fundraiser create/edit
3. Open theme settings sidebar -> Background tab -> Animation row
4. Select each animation type, verify visual rendering
5. Toggle light/dark mode - verify colors adapt (especially particles)
6. Resize browser - verify canvas resizes correctly
7. Switch tabs and back - verify no CPU spike when hidden
8. Test `prefers-reduced-motion` (System Settings -> Accessibility -> Reduce Motion)
9. Check mobile viewport (< 768px) - particle count should reduce ~40%
10. Set animation to "none" - verify canvas removed from DOM
