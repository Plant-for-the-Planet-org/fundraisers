import type { PaymentOptions } from '@/lib/types/payment-options';

import { describe, expect, it } from 'vitest';
import { mapPaymentOptionsToContributionSettings } from './contribution-utils';

const frequency = (minQuantity = 2) => ({
  minQuantity,
  options: [
    { quantity: 10, caption: null, isDefault: false },
    { quantity: 20, caption: null, isDefault: true },
    { quantity: null, caption: null, isDefault: false },
  ],
});

const platform = (supported = true) =>
  ({
    recurrency: { supported },
    frequencies: {
      once: frequency(),
      monthly: frequency(),
      yearly: frequency(),
    },
  }) as unknown as PaymentOptions;

describe('mapPaymentOptionsToContributionSettings', () => {
  it('uses the platform amounts and frequencies when the host chose nothing', () => {
    const settings = mapPaymentOptionsToContributionSettings(platform(), {
      options: [],
      allow_dedication: true,
      allow_recurrency: true,
    });
    expect(settings.options).toEqual([
      { amount_cent: 1000, label: null, sub_label: null, default: false },
      { amount_cent: 2000, label: null, sub_label: null, default: true },
      {
        amount_cent: 'custom',
        label: null,
        sub_label: null,
        default: false,
        min: 200,
      },
    ]);
    expect(settings.recurrency_options).toEqual(['once', 'monthly', 'yearly']);
    expect(settings.default_recurrency).toBeUndefined();
  });

  it("uses the host's amounts, preselected amount and custom minimum", () => {
    const settings = mapPaymentOptionsToContributionSettings(platform(), {
      options: [{ unit: 5 }, { unit: 15, default: true }, { min: 4 }],
      allow_dedication: true,
      allow_recurrency: true,
    });
    expect(settings.options).toEqual([
      { amount_cent: 500, label: null, sub_label: null },
      { amount_cent: 1500, label: null, sub_label: null, default: true },
      { amount_cent: 'custom', label: null, sub_label: null, min: 400 },
    ]);
  });

  it("offers the host's frequencies, only those the platform supports, with their first choice", () => {
    const settings = mapPaymentOptionsToContributionSettings(platform(), {
      options: [],
      allow_dedication: true,
      allow_recurrency: true,
      recurrency_options: ['once', 'yearly'],
      default_recurrency: 'yearly',
    });
    expect(settings.recurrency_options).toEqual(['once', 'yearly']);
    expect(settings.default_recurrency).toBe('yearly');
  });

  it('turns recurrence off when the host did, or the platform cannot', () => {
    expect(
      mapPaymentOptionsToContributionSettings(platform(), {
        options: [],
        allow_dedication: true,
        allow_recurrency: false,
      }).allow_recurrency
    ).toBe(false);
    expect(
      mapPaymentOptionsToContributionSettings(platform(false), {
        options: [],
        allow_dedication: true,
        allow_recurrency: true,
      }).allow_recurrency
    ).toBe(false);
  });

  it('keeps the dedication choice', () => {
    expect(
      mapPaymentOptionsToContributionSettings(platform(), {
        options: [],
        allow_dedication: false,
        allow_recurrency: true,
      }).allow_dedication
    ).toBe(false);
  });
});
