const COMPACT_SCALES = [
  { threshold: 1_000_000_000_000, divisor: 1_000_000_000_000, suffix: 'T' },
  { threshold: 1_000_000_000, divisor: 1_000_000_000, suffix: 'B' },
  { threshold: 1_000_000, divisor: 1_000_000, suffix: 'M' },
  { threshold: 1_000, divisor: 1_000, suffix: 'K' },
] as const;

function normalizeLocale(locale: string): string {
  return typeof locale === 'string' && locale.length > 0 ? locale : 'en';
}

function normalizeNumber(value: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function roundToTwoDecimals(value: number): number {
  return Number(Math.round(Number(`${value}e2`)) + 'e-2');
}

function getCompactSuffix(locale: string, suffix: string): string {
  const safeLocale = normalizeLocale(locale);

  if (safeLocale.startsWith('de')) {
    const germanSuffixMap: Record<string, string> = {
      K: 'Tsd.',
      M: 'Mio.',
      B: 'Mrd.',
      T: 'Bio.',
    };

    return germanSuffixMap[suffix] ?? suffix;
  }

  return suffix;
}

/**
 * Format a number with locale-aware decimal rules.
 *
 * - Rounds to 2 decimal places first.
 * - German: always 2 decimals unless both are zero.
 * - English (and others): up to 2 decimals, trailing zeros dropped.
 */
function formatLocalizedNumber(value: number, locale: string): string {
  const safeLocale = normalizeLocale(locale);
  const numericValue = normalizeNumber(value);
  const rounded = roundToTwoDecimals(numericValue);
  const isWhole = rounded % 1 === 0;
  const isGerman = safeLocale.startsWith('de');

  if (isGerman) {
    return new Intl.NumberFormat(safeLocale, {
      minimumFractionDigits: isWhole ? 0 : 2,
      maximumFractionDigits: isWhole ? 0 : 2,
    }).format(rounded);
  }

  return new Intl.NumberFormat(safeLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded);
}

/** Format a number in compact notation (e.g. 1200 → "1.2 K"). */
function formatCompactNumber(value: number, locale: string): string {
  const numericValue = normalizeNumber(value);
  const abs = Math.abs(numericValue);

  for (const { threshold, divisor, suffix } of COMPACT_SCALES) {
    if (abs >= threshold) {
      const localizedSuffix = getCompactSuffix(locale, suffix);
      return `${formatLocalizedNumber(numericValue / divisor, locale)} ${localizedSuffix}`;
    }
  }

  return formatLocalizedNumber(numericValue, locale);
}

export { formatCompactNumber, formatLocalizedNumber };
