/** Format a number in compact notation (e.g. 1200 → "1.2K"). */
function formatCompactNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export { formatCompactNumber };
