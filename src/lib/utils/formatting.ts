function getLocalizedAbbreviatedCount(count: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(count);
}

export { getLocalizedAbbreviatedCount };
