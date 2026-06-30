// Compaction only kicks in at a million and up. Thousands stay fully written
// out (e.g. "96,120", not "96.12 K") — full counts read clearer and the space
// saving below 1M is not worth the loss of precision. Do not re-add a `K` scale.
const COMPACT_SCALES = [
  { threshold: 1_000_000_000_000, divisor: 1_000_000_000_000, suffix: 'T' },
  { threshold: 1_000_000_000, divisor: 1_000_000_000, suffix: 'B' },
  { threshold: 1_000_000, divisor: 1_000_000, suffix: 'M' },
] as const;

// In compact display, drop the cents once the value reaches this amount — they
// are just noise on larger figures. Smaller values keep up to 2 decimals where
// the cents still matter (e.g. a 3.50 donation). Only affects fractional inputs
// (currency); counts are already whole.
const COMPACT_WHOLE_NUMBER_THRESHOLD = 100;

const GERMAN_COMPACT_SUFFIXES: Record<string, string> = {
  K: 'Tsd.',
  M: 'Mio.',
  B: 'Mrd.',
  T: 'Bio.',
};

function normalizeLocale(locale: string): string {
  return typeof locale === 'string' && locale.length > 0 ? locale : 'en';
}

function normalizeNumber(value: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getCompactSuffix(locale: string, suffix: string): string {
  return normalizeLocale(locale).startsWith('de')
    ? (GERMAN_COMPACT_SUFFIXES[suffix] ?? suffix)
    : suffix;
}

/**
 * Format a number with locale-aware decimals.
 *
 * One rule for every locale: 2 decimals unless the rounded value is whole,
 * in which case no decimals are shown.
 * - `3.2`  → `3.20` (en) / `3,20` (de)
 * - `3.67` → `3.67` / `3,67`
 * - `3`    → `3`
 *
 * Math.round is used only for the isWhole check; Intl.NumberFormat handles the
 * actual rounding via maximumFractionDigits.
 */
function formatLocalizedNumber(value: number, locale: string): string {
  const safeLocale = normalizeLocale(locale);
  const numericValue = normalizeNumber(value);
  const isWhole = (Math.round(numericValue * 100) / 100) % 1 === 0;

  return new Intl.NumberFormat(safeLocale, {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

/**
 * Format a number in compact notation with a localized suffix, but only from a
 * million up — smaller values are written out in full with grouping.
 * - `96120`   → `96,120` (en) / `96.120` (de)
 * - `1200000` → `1.20 M` / `1,20 Mio.`
 */
function formatCompactNumber(value: number, locale: string): string {
  const numericValue = normalizeNumber(value);
  const abs = Math.abs(numericValue);

  for (let i = 0; i < COMPACT_SCALES.length; i++) {
    const { threshold } = COMPACT_SCALES[i];
    if (abs < threshold) continue;

    let { divisor, suffix } = COMPACT_SCALES[i];
    let scaled = numericValue / divisor;

    // Rounding the mantissa to 2 decimals can push it to >= 1000
    // (e.g. 999_999 / 1000 = 999.999 → "1,000 K"). Promote to the
    // next-larger scale so it renders "1 M" instead.
    if (i > 0 && Math.round(Math.abs(scaled) * 100) / 100 >= 1000) {
      ({ divisor, suffix } = COMPACT_SCALES[i - 1]);
      scaled = numericValue / divisor;
    }

    return `${formatLocalizedNumber(scaled, locale)} ${getCompactSuffix(locale, suffix)}`;
  }

  // Below the smallest compact scale, write the number out in full — as a whole
  // number once it is large enough that trailing cents are noise, otherwise with
  // up to 2 decimals.
  if (Math.abs(numericValue) >= COMPACT_WHOLE_NUMBER_THRESHOLD) {
    return new Intl.NumberFormat(normalizeLocale(locale), {
      maximumFractionDigits: 0,
    }).format(numericValue);
  }

  return formatLocalizedNumber(numericValue, locale);
}

export { formatCompactNumber, formatLocalizedNumber };
