import { describe, expect, it } from 'vitest';
import {
  MAX_PRESETS,
  normalizeContributionEditor,
  PLATFORM_MIN_UNITS,
  readContributionEditor,
  storedToDonationSettings,
  writeContributionEditor,
} from './contribution-editor';

const platform = () => readContributionEditor(undefined);

describe('readContributionEditor', () => {
  it('starts from the platform amounts when the host has chosen nothing', () => {
    expect(platform()).toMatchObject({
      presets: [10, 20, 50, 100],
      defaultAmount: 20,
      allowCustom: true,
      customMin: PLATFORM_MIN_UNITS,
      frequencies: ['once', 'monthly', 'yearly'],
      defaultFrequency: 'once',
      allowDedication: true,
    });
  });

  it('reads back what was stored', () => {
    const editor = readContributionEditor({
      options: [{ unit: 5 }, { unit: 25, default: true }, { min: 3 }],
      allow_dedication: false,
      allow_recurrency: true,
      recurrency_options: ['once', 'monthly'],
      default_recurrency: 'monthly',
    });
    expect(editor).toMatchObject({
      presets: [5, 25],
      defaultAmount: 25,
      allowCustom: true,
      customMin: 3,
      frequencies: ['once', 'monthly'],
      defaultFrequency: 'monthly',
      allowDedication: false,
    });
  });

  it('turns every frequency but one-time off when recurrence is not allowed', () => {
    expect(
      readContributionEditor({
        options: [],
        allow_dedication: true,
        allow_recurrency: false,
      }).frequencies
    ).toEqual(['once']);
  });
});

describe('normalizeContributionEditor', () => {
  it('keeps amounts whole, unique, sorted and at most four', () => {
    const editor = normalizeContributionEditor({
      ...platform(),
      presets: [50, 10.4, 10, 0, -3, 7, 99, 200],
      defaultAmount: 10,
    });
    expect(editor.presets).toEqual([7, 10, 50, 99]);
    expect(editor.presets.length).toBeLessThanOrEqual(MAX_PRESETS);
  });

  it('moves the default onto an amount that exists', () => {
    expect(
      normalizeContributionEditor({
        ...platform(),
        presets: [5, 15],
        defaultAmount: 20,
      }).defaultAmount
    ).toBe(15);
  });

  it('never lets the custom minimum fall under the platform minimum', () => {
    expect(
      normalizeContributionEditor({ ...platform(), customMin: 1 }).customMin
    ).toBe(PLATFORM_MIN_UNITS);
  });

  it('keeps at least one frequency, with the default among them', () => {
    const editor = normalizeContributionEditor({
      ...platform(),
      frequencies: [],
      defaultFrequency: 'yearly',
    });
    expect(editor.frequencies).toEqual(['once']);
    expect(editor.defaultFrequency).toBe('once');
  });

  it('falls back to one amount when none is left', () => {
    expect(
      normalizeContributionEditor({ ...platform(), presets: [0] }).presets
    ).toEqual([20]);
  });
});

describe('writeContributionEditor', () => {
  it('stores no options at all while the choices are the platform own', () => {
    expect(writeContributionEditor(platform()).options).toEqual([]);
  });

  it('stores amounts in whole units, with the default and the custom minimum', () => {
    const stored = writeContributionEditor({
      ...platform(),
      presets: [5, 25, 75],
      defaultAmount: 25,
      customMin: 5,
      frequencies: ['once', 'yearly'],
      defaultFrequency: 'yearly',
    });
    expect(stored.options).toEqual([
      { unit: 5, label: null, sub_label: null },
      { unit: 25, label: null, sub_label: null, default: true },
      { unit: 75, label: null, sub_label: null },
      { label: null, sub_label: null, min: 5 },
    ]);
    expect(stored.recurrency_options).toEqual(['once', 'yearly']);
    expect(stored.default_recurrency).toBe('yearly');
    expect(stored.allow_recurrency).toBe(true);
  });

  it('leaves out the custom option when custom amounts are off', () => {
    const stored = writeContributionEditor({
      ...platform(),
      presets: [5, 25],
      allowCustom: false,
    });
    expect(stored.options.some(option => option.unit === undefined)).toBe(
      false
    );
  });

  it('turns recurrence off when only one-time is left', () => {
    expect(
      writeContributionEditor({
        ...platform(),
        presets: [5, 25],
        frequencies: ['once'],
      }).allow_recurrency
    ).toBe(false);
  });

  it('round-trips through the reader', () => {
    const editor = normalizeContributionEditor({
      ...platform(),
      presets: [5, 25, 75],
      defaultAmount: 75,
      customMin: 4,
      frequencies: ['once', 'monthly'],
      defaultFrequency: 'monthly',
      allowDedication: false,
    });
    expect(readContributionEditor(writeContributionEditor(editor))).toEqual(
      editor
    );
  });
});

describe('storedToDonationSettings', () => {
  it('changes nothing when the host stored no amounts', () => {
    expect(
      storedToDonationSettings({
        options: [],
        allow_dedication: true,
        allow_recurrency: true,
      })
    ).toEqual({ allow_dedication: true });
  });

  it('turns stored units into cents, with the default and the custom minimum', () => {
    const settings = storedToDonationSettings({
      options: [{ unit: 5 }, { unit: 25, default: true }, { min: 4 }],
      allow_dedication: true,
      allow_recurrency: true,
    });
    expect(settings.options).toEqual([
      { amount_cent: 500, label: null, sub_label: null },
      { amount_cent: 2500, label: null, sub_label: null, default: true },
      { amount_cent: 'custom', label: null, sub_label: null, min: 400 },
    ]);
  });

  it('offers only the frequencies the platform supports', () => {
    const settings = storedToDonationSettings(
      {
        options: [],
        allow_dedication: true,
        allow_recurrency: true,
        recurrency_options: ['once', 'monthly', 'yearly'],
        default_recurrency: 'monthly',
      },
      ['once', 'yearly']
    );
    expect(settings.recurrency_options).toEqual(['once', 'yearly']);
    expect(settings.default_recurrency).toBe('monthly');
  });
});
