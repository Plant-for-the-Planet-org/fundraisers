import type {
  ContributionModuleSettings,
  FundraiserSettings,
  RecurrencyType,
} from '@/lib/types/fundraiser';

import { DEFAULT_MIN_CENTS } from '@/lib/constants/donation';

/** What a fundraiser stores for its contribution box. */
export type StoredContribution = NonNullable<
  FundraiserSettings['modules']['contribution']
>;

/** The frequencies a host can offer, in the order donors see them. */
export const EDITABLE_FREQUENCIES = ['once', 'monthly', 'yearly'] as const;
export type EditableFrequency = (typeof EDITABLE_FREQUENCIES)[number];

/** What donors see when a host has chosen nothing: the platform's own amounts. The editor starts from these. */
export const PLATFORM_PRESETS = [10, 20, 50, 100] as const;
export const PLATFORM_DEFAULT_PRESET = 20;
/** The smallest custom amount the platform takes, in whole currency units. A host may ask for more, never less. */
export const PLATFORM_MIN_UNITS = DEFAULT_MIN_CENTS / 100;

export const MAX_PRESETS = 4;
export const MAX_AMOUNT_UNITS = 100_000;

/** The choices in a form that is easy to edit and to check, before they are stored as options. */
export interface ContributionEditor {
  presets: number[];
  defaultAmount: number;
  allowCustom: boolean;
  customMin: number;
  frequencies: EditableFrequency[];
  defaultFrequency: EditableFrequency;
  allowDedication: boolean;
}

export const DEFAULT_CONTRIBUTION: StoredContribution = {
  options: [],
  allow_dedication: true,
  allow_recurrency: true,
};

const isEditableFrequency = (value: unknown): value is EditableFrequency =>
  EDITABLE_FREQUENCIES.includes(value as EditableFrequency);

/** Whole units, at least 1 and at most `MAX_AMOUNT_UNITS`; anything else is dropped. */
function cleanAmount(value: number): number | null {
  const whole = Math.round(value);
  return Number.isFinite(whole) && whole >= 1 && whole <= MAX_AMOUNT_UNITS
    ? whole
    : null;
}

/**
 * Makes any choices consistent: amounts are whole, unique, sorted and at most four, the default is one of them,
 * the custom minimum is no lower than the platform's, and at least one frequency is on, with the default among them.
 */
export function normalizeContributionEditor(
  editor: ContributionEditor
): ContributionEditor {
  const presets = [
    ...new Set(
      editor.presets.map(cleanAmount).filter((n): n is number => n !== null)
    ),
  ]
    .sort((a, b) => a - b)
    .slice(0, MAX_PRESETS);
  const safePresets = presets.length > 0 ? presets : [PLATFORM_DEFAULT_PRESET];
  const frequencies = EDITABLE_FREQUENCIES.filter(f =>
    editor.frequencies.includes(f)
  );
  const safeFrequencies: EditableFrequency[] =
    frequencies.length > 0 ? frequencies : ['once'];
  return {
    presets: safePresets,
    defaultAmount: safePresets.includes(editor.defaultAmount)
      ? editor.defaultAmount
      : safePresets[Math.min(1, safePresets.length - 1)],
    allowCustom: editor.allowCustom,
    customMin: Math.min(
      MAX_AMOUNT_UNITS,
      Math.max(PLATFORM_MIN_UNITS, Math.round(editor.customMin) || 0)
    ),
    frequencies: safeFrequencies,
    defaultFrequency: safeFrequencies.includes(editor.defaultFrequency)
      ? editor.defaultFrequency
      : safeFrequencies[0],
    allowDedication: editor.allowDedication,
  };
}

/** The editor's starting point: the stored choices, or the platform's own where the host has chosen nothing. */
export function readContributionEditor(
  stored: StoredContribution | undefined
): ContributionEditor {
  const options = stored?.options ?? [];
  const units = options
    .map(option => option.unit)
    .filter((unit): unit is number => typeof unit === 'number');
  const custom = options.find(option => option.unit === undefined);
  const chosen = units.length > 0;
  const frequencies = (stored?.recurrency_options ?? []).filter(
    isEditableFrequency
  );
  const allowRecurrency = stored?.allow_recurrency ?? true;
  return normalizeContributionEditor({
    presets: chosen ? units : [...PLATFORM_PRESETS],
    defaultAmount: chosen
      ? (options.find(option => option.default && option.unit !== undefined)
          ?.unit ?? units[0])
      : PLATFORM_DEFAULT_PRESET,
    allowCustom: chosen ? Boolean(custom) : true,
    customMin: custom?.min ?? PLATFORM_MIN_UNITS,
    frequencies: allowRecurrency
      ? frequencies.length > 0
        ? frequencies
        : [...EDITABLE_FREQUENCIES]
      : ['once'],
    defaultFrequency:
      (stored?.default_recurrency as EditableFrequency) ?? 'once',
    allowDedication: stored?.allow_dedication ?? true,
  });
}

/** Whether the editor still says what the platform would anyway, so nothing needs storing. */
export function isPlatformDefault(editor: ContributionEditor): boolean {
  const base = readContributionEditor(undefined);
  return (
    editor.presets.join() === base.presets.join() &&
    editor.defaultAmount === base.defaultAmount &&
    editor.allowCustom === base.allowCustom &&
    editor.customMin === base.customMin &&
    editor.frequencies.join() === base.frequencies.join() &&
    editor.defaultFrequency === base.defaultFrequency
  );
}

/** The choices as they are stored. Left at the platform's own, they store no options at all, so a host who never opens the menu changes nothing. */
export function writeContributionEditor(
  editor: ContributionEditor
): StoredContribution {
  const clean = normalizeContributionEditor(editor);
  if (isPlatformDefault(clean)) {
    return {
      options: [],
      allow_dedication: clean.allowDedication,
      allow_recurrency: true,
    };
  }
  return {
    options: [
      ...clean.presets.map(unit => ({
        unit,
        label: null,
        sub_label: null,
        ...(unit === clean.defaultAmount && { default: true }),
      })),
      ...(clean.allowCustom
        ? [{ label: null, sub_label: null, min: clean.customMin }]
        : []),
    ],
    allow_dedication: clean.allowDedication,
    allow_recurrency: clean.frequencies.some(f => f !== 'once'),
    recurrency_options: clean.frequencies,
    default_recurrency: clean.defaultFrequency,
  };
}

/**
 * What the donation form needs, from what a fundraiser stores. Amounts become cents; `undefined` where the host chose nothing, so the platform's own apply.
 * `platformFrequencies` limits the host's choice to what the platform supports.
 */
export function storedToDonationSettings(
  stored: StoredContribution | undefined,
  platformFrequencies?: RecurrencyType[]
): ContributionModuleSettings {
  const options = stored?.options ?? [];
  const hasAmounts = options.some(option => option.unit !== undefined);
  const wanted = stored?.recurrency_options?.filter(isEditableFrequency);
  const frequencies = wanted
    ? wanted.filter(
        f => !platformFrequencies || platformFrequencies.includes(f)
      )
    : undefined;
  return {
    allow_dedication: stored?.allow_dedication,
    ...(hasAmounts && {
      options: options.map(option => ({
        amount_cent:
          option.unit !== undefined ? option.unit * 100 : ('custom' as const),
        label: option.label ?? null,
        sub_label: option.sub_label ?? null,
        ...(option.default && { default: true }),
        ...(option.unit === undefined &&
          option.min !== undefined && { min: option.min * 100 }),
      })),
    }),
    ...(frequencies &&
      frequencies.length > 0 && { recurrency_options: frequencies }),
    ...(stored?.default_recurrency && {
      default_recurrency: stored.default_recurrency,
    }),
    ...(stored?.allow_recurrency === false && { allow_recurrency: false }),
  };
}
