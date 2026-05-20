/**
 * Theme CSS custom property fallback colors used when the variable cannot
 * be read (server render, missing token, etc.). Hex values approximate the
 * light-mode values declared in `globals.css` so first paint stays readable
 * before hydration resolves the actual computed value.
 */
const THEME_HSL_FALLBACKS = {
  '--foreground': '#030712',
  '--muted-foreground': '#6b7280',
  '--destructive': '#dc2626',
} as const;

export type ThemeColorVar = keyof typeof THEME_HSL_FALLBACKS;

/**
 * Resolve a theme CSS custom property (e.g. `--foreground`) to a concrete
 * `hsl(...)` color string at runtime.
 *
 * The values in `globals.css` are stored as raw HSL components
 * (e.g. `224 71.4% 4.1%`) so Tailwind can compose them with opacity
 * modifiers. Stripe Elements (and other iframe-sandboxed contexts) do not
 * accept `var(--foo)` references — they must be resolved to a standalone
 * CSS color string on the host page first.
 *
 * Falls back to the matching entry in `THEME_HSL_FALLBACKS` when called
 * server-side or when the property is missing.
 */
export function readThemeHslColor(varName: ThemeColorVar): string {
  const fallback = THEME_HSL_FALLBACKS[varName];

  if (typeof window === 'undefined') return fallback;

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();

  return raw ? `hsl(${raw})` : fallback;
}
