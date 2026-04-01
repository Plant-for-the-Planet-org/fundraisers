import type {
  ContributionModuleSettings,
  ContributionOption,
  FundraiserSettings,
  RecurrencyType,
} from '@/lib/types/fundraiser';
import type {
  PaymentFrequency,
  PaymentOptions,
} from '@/lib/types/payment-options';

const DEFAULT_CONTRIBUTION_SETTINGS: Required<ContributionModuleSettings> = {
  recurrency_options: ['once', 'monthly', 'annual'],
  options: [
    { amount_cent: 1000, label: null, sub_label: null },
    { amount_cent: 2000, label: null, sub_label: null, default: true },
    { amount_cent: 5000, label: null, sub_label: null },
    { amount_cent: 10000, label: null, sub_label: null },
    { amount_cent: 'custom', label: null, sub_label: null, min: 200 },
  ],
  allow_dedication: true,
  allow_recurrency: true,
  show_totals_on_fundraiser: true,
};

export function getContributionSettings(
  moduleSettings?: ContributionModuleSettings
): Required<ContributionModuleSettings> {
  const hasValidOptions =
    Array.isArray(moduleSettings?.options) && moduleSettings.options.length > 0;

  return {
    recurrency_options: Array.isArray(moduleSettings?.recurrency_options)
      ? moduleSettings.recurrency_options
      : DEFAULT_CONTRIBUTION_SETTINGS.recurrency_options,
    options: hasValidOptions
      ? moduleSettings!.options!
      : DEFAULT_CONTRIBUTION_SETTINGS.options,
    allow_dedication:
      moduleSettings?.allow_dedication ??
      DEFAULT_CONTRIBUTION_SETTINGS.allow_dedication,
    allow_recurrency:
      moduleSettings?.allow_recurrency ??
      DEFAULT_CONTRIBUTION_SETTINGS.allow_recurrency,
    show_totals_on_fundraiser:
      moduleSettings?.show_totals_on_fundraiser ??
      DEFAULT_CONTRIBUTION_SETTINGS.show_totals_on_fundraiser,
  };
}

export function getAvailableRecurrencyOptions(
  moduleSettings?: ContributionModuleSettings
): RecurrencyType[] {
  const settings = getContributionSettings(moduleSettings);
  return settings.allow_recurrency ? settings.recurrency_options : ['once'];
}

export function getDefaultSelectedAmount(
  options: ContributionOption[]
): number {
  if (!Array.isArray(options)) return 1000;

  const defaultOption = options.find(
    option => typeof option.amount_cent === 'number' && option.default === true
  );
  if (defaultOption && typeof defaultOption.amount_cent === 'number') {
    return defaultOption.amount_cent;
  }

  const firstNumeric = options.find(
    option => typeof option.amount_cent === 'number'
  );
  return firstNumeric ? (firstNumeric.amount_cent as number) : 1000;
}

export function getPresetAmounts(options: ContributionOption[]): number[] {
  if (!Array.isArray(options)) return [];
  return options
    .filter(option => typeof option.amount_cent === 'number')
    .map(option => option.amount_cent as number);
}

export function getCustomOption(
  options: ContributionOption[]
): ContributionOption | null {
  if (!Array.isArray(options)) return null;
  return options.find(option => option.amount_cent === 'custom') ?? null;
}

export function mapContributionSettings(
  raw: FundraiserSettings['modules']['contribution']
): ContributionModuleSettings | undefined {
  if (!raw) return undefined;
  return {
    allow_dedication: raw.allow_dedication,
    allow_recurrency: raw.allow_recurrency,
    options: raw.options?.map(opt => ({
      amount_cent:
        opt.unit !== undefined ? opt.unit * 100 : ('custom' as const),
      label: opt.label ?? null,
      sub_label: opt.sub_label ?? null,
    })),
  };
}

function mapFrequencyOptions(
  frequency: PaymentFrequency
): ContributionOption[] {
  return frequency.options.map(opt => ({
    amount_cent: opt.quantity !== null ? opt.quantity * 100 : 'custom',
    label: opt.caption,
    sub_label: null,
    default: opt.isDefault,
    ...(opt.quantity === null && { min: frequency.minQuantity * 100 }),
  }));
}

const API_FREQUENCY_TO_RECURRENCY: Record<string, RecurrencyType> = {
  once: 'once',
  monthly: 'monthly',
  yearly: 'annual',
};

export function mapPaymentOptionsToContributionSettings(
  paymentOptions: PaymentOptions,
  fundraiserContribution?: FundraiserSettings['modules']['contribution']
): ContributionModuleSettings {
  const recurrencyOptions = (
    Object.keys(paymentOptions.frequencies) as Array<
      keyof typeof paymentOptions.frequencies
    >
  )
    .map(key => API_FREQUENCY_TO_RECURRENCY[key])
    .filter((r): r is RecurrencyType => r !== undefined);

  const baseFrequency =
    paymentOptions.frequencies.once ??
    paymentOptions.frequencies[
      Object.keys(
        paymentOptions.frequencies
      )[0] as keyof typeof paymentOptions.frequencies
    ];

  return {
    recurrency_options: recurrencyOptions,
    options: baseFrequency ? mapFrequencyOptions(baseFrequency) : undefined,
    allow_recurrency: paymentOptions.recurrency.supported,
    allow_dedication: fundraiserContribution?.allow_dedication,
    show_totals_on_fundraiser: undefined,
  };
}
