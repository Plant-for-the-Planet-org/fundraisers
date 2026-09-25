import { describe, expect, it } from 'vitest';
import { formatCurrency, formatCurrencyFromDecimal } from './currency';

// Intl keeps the number and the symbol together with a no-break space.
const NBSP = '\u00a0';

describe('formatCurrencyFromDecimal', () => {
  describe('symbol display', () => {
    it.each([
      ['EUR', 'en', '€1,234.50'],
      ['USD', 'en', '$1,234.50'],
      ['GBP', 'en', '£1,234.50'],
      ['CHF', 'en', `CHF${NBSP}1,234.50`],
      ['SEK', 'en', `kr${NBSP}1,234.50`],
      ['EUR', 'de', `1.234,50${NBSP}€`],
      ['USD', 'de', `1.234,50${NBSP}$`],
      ['GBP', 'de', `1.234,50${NBSP}£`],
      ['CHF', 'de', `1.234,50${NBSP}CHF`],
      ['SEK', 'de', `1.234,50${NBSP}kr`],
    ])('formats %s in %s', (currency, locale, expected) => {
      expect(formatCurrencyFromDecimal(1234.5, currency, locale)).toBe(
        expected
      );
    });

    it('drops the decimals on whole amounts', () => {
      expect(formatCurrencyFromDecimal(50, 'EUR', 'en')).toBe('€50');
      expect(formatCurrencyFromDecimal(50, 'EUR', 'de')).toBe(`50${NBSP}€`);
    });

    it('uses the app symbol, not the Intl one', () => {
      expect(formatCurrencyFromDecimal(50, 'CAD', 'en')).toBe('C$50');
      expect(formatCurrencyFromDecimal(50, 'CAD', 'de')).toBe(`50${NBSP}C$`);
    });

    it('accepts a lowercase currency code', () => {
      expect(formatCurrencyFromDecimal(50, 'eur', 'de')).toBe(`50${NBSP}€`);
    });
  });

  describe('currency with no symbol', () => {
    it('falls back to the code, placed by the locale', () => {
      expect(formatCurrencyFromDecimal(50, 'KES', 'en')).toBe(`KES${NBSP}50`);
      expect(formatCurrencyFromDecimal(50, 'KES', 'de')).toBe(`50${NBSP}KES`);
    });
  });

  describe('code display', () => {
    it.each([
      ['EUR', 'en', `EUR${NBSP}50`],
      ['CHF', 'en', `CHF${NBSP}50`],
      ['EUR', 'de', `50${NBSP}EUR`],
      ['CHF', 'de', `50${NBSP}CHF`],
    ])('formats %s in %s', (currency, locale, expected) => {
      expect(
        formatCurrencyFromDecimal(50, currency, locale, {
          currencyDisplay: 'code',
        })
      ).toBe(expected);
    });
  });

  describe('compact mode', () => {
    it('places the symbol after the compact suffix in German', () => {
      expect(
        formatCurrencyFromDecimal(1_200_000, 'EUR', 'en', { compact: true })
      ).toBe('€1.20 M');
      expect(
        formatCurrencyFromDecimal(1_200_000, 'EUR', 'de', { compact: true })
      ).toBe(`1,20 Mio.${NBSP}€`);
    });

    it('writes amounts below a million in full', () => {
      expect(
        formatCurrencyFromDecimal(19_030, 'EUR', 'de', { compact: true })
      ).toBe(`19.030${NBSP}€`);
    });
  });

  describe('zero and negative amounts', () => {
    it('formats zero', () => {
      expect(formatCurrencyFromDecimal(0, 'EUR', 'en')).toBe('€0');
      expect(formatCurrencyFromDecimal(0, 'EUR', 'de')).toBe(`0${NBSP}€`);
    });

    it('puts the minus sign where the locale puts it', () => {
      expect(formatCurrencyFromDecimal(-50, 'EUR', 'en')).toBe('-€50');
      expect(formatCurrencyFromDecimal(-50, 'CHF', 'en')).toBe(`-CHF${NBSP}50`);
      expect(formatCurrencyFromDecimal(-50, 'EUR', 'de')).toBe(`-50${NBSP}€`);
    });
  });

  describe('no currency', () => {
    it.each([null, undefined, ''])('shows the bare amount for %j', currency => {
      expect(formatCurrencyFromDecimal(1234.5, currency, 'en')).toBe(
        '1,234.50'
      );
      expect(formatCurrencyFromDecimal(1234.5, currency, 'de')).toBe(
        '1.234,50'
      );
    });
  });
});

describe('formatCurrency', () => {
  it('converts cents and places the symbol by locale', () => {
    expect(formatCurrency(5000, 'EUR', 'en')).toBe('€50');
    expect(formatCurrency(123450, 'USD', 'en')).toBe('$1,234.50');
    expect(formatCurrency(1_903_000, 'EUR', 'de')).toBe(`19.030${NBSP}€`);
    expect(formatCurrency(5000, 'SEK', 'de')).toBe(`50${NBSP}kr`);
  });

  it('handles compact mode, zero, negatives and no currency', () => {
    expect(formatCurrency(120_000_000, 'EUR', 'de', { compact: true })).toBe(
      `1,20 Mio.${NBSP}€`
    );
    expect(formatCurrency(0, 'GBP', 'de')).toBe(`0${NBSP}£`);
    expect(formatCurrency(-5000, 'GBP', 'en')).toBe('-£50');
    expect(formatCurrency(5000, null, 'de')).toBe('50');
  });
});
