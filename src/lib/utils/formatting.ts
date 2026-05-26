const COMPACT_SCALES = [
  { threshold: 1_000_000_000_000, divisor: 1_000_000_000_000, suffix: 'T' },
  { threshold: 1_000_000_000, divisor: 1_000_000_000, suffix: 'B' },
  { threshold: 1_000_000, divisor: 1_000_000, suffix: 'M' },
  { threshold: 1_000, divisor: 1_000, suffix: 'K' },
] as const;

/**
 * Format a number with locale-aware decimal rules.
 *
 * - Rounds to 2 decimal places first.
 * - German: always 2 decimals unless both are zero.
 * - English (and others): up to 2 decimals, trailing zeros dropped.
 */
function formatLocalizedNumber(value: number, locale: string): string {
  const rounded = Math.round(value * 100) / 100;
  const isWhole = rounded % 1 === 0;
  const isGerman = locale.startsWith('de');

  if (isGerman) {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: isWhole ? 0 : 2,
      maximumFractionDigits: isWhole ? 0 : 2,
    }).format(rounded);
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded);
}

/** Format a number in compact notation (e.g. 1200 → "1.2 K"). */
function formatCompactNumber(value: number, locale: string): string {
  const abs = Math.abs(value);

  for (const { threshold, divisor, suffix } of COMPACT_SCALES) {
    if (abs >= threshold) {
      return `${formatLocalizedNumber(value / divisor, locale)} ${suffix}`;
    }
  }

  return formatLocalizedNumber(value, locale);
}

export { formatCompactNumber, formatLocalizedNumber };
