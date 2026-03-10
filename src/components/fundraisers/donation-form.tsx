'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DonationAmounts } from './donation-amounts';
import { DonationFrequencyDropdown } from './donation-frequency-dropdown';
import { formatCurrency } from '@/lib/utils/currency';
import {
  getContributionSettings,
  getAvailableRecurrencyOptions,
  getPresetAmounts,
  getCustomOption,
  getDefaultSelectedAmount,
} from '@/lib/utils/contribution-utils';
import type {
  ContributionModuleSettings,
  RecurrencyType,
} from '@/lib/types/fundraiser';

interface DonationFormProps {
  contributionSettings?: ContributionModuleSettings;
  currency?: string;
  onDonate: (amount: number, isDedicated: boolean, frequency: string) => void;
}

const recurrencyToValue = (recurrency: RecurrencyType): string => {
  switch (recurrency) {
    case 'one_time':
      return 'one-time';
    case 'monthly':
      return 'monthly';
    case 'quarterly':
      return 'quarterly';
    case 'annual':
      return 'yearly';
    default:
      return 'one-time';
  }
};

export function DonationForm({
  contributionSettings,
  currency = 'EUR',
  onDonate,
}: DonationFormProps) {
  const t = useTranslations('Fundraisers.create.contributionSettings');

  const settings = getContributionSettings(contributionSettings);
  const availableRecurrencyOptions =
    getAvailableRecurrencyOptions(contributionSettings);

  const presetAmounts = getPresetAmounts(settings.options);
  const customOption = getCustomOption(settings.options);
  const defaultAmount = getDefaultSelectedAmount(settings.options);

  const getFrequencyLabel = (value: string) => {
    switch (value) {
      case 'monthly':
        return t('frequency.monthly');
      case 'quarterly':
        return t('frequency.quarterly');
      case 'yearly':
        return t('frequency.yearly');
      default:
        return t('frequency.oneTime');
    }
  };

  const recurrencyToUI = (recurrency: RecurrencyType) => {
    const value = recurrencyToValue(recurrency);
    return { value, label: getFrequencyLabel(value) };
  };

  const frequencyOptions = availableRecurrencyOptions.map(recurrencyToUI);

  const [selectedAmount, setSelectedAmount] = useState<number>(defaultAmount);
  const [customAmount, setCustomAmount] = useState<number | undefined>();
  const [selectedFrequency, setSelectedFrequency] = useState(
    recurrencyToUI(availableRecurrencyOptions[0] ?? 'one_time')
  );
  const [isDedicated, setIsDedicated] = useState(false);

  const getDonateButtonText = () => {
    const amount = customAmount || selectedAmount;
    const amountText = settings.show_totals_on_fundraiser
      ? `${formatCurrency(amount, currency)} • `
      : '';

    switch (selectedFrequency.value) {
      case 'monthly':
        return `${amountText}${t('donateMonthly')}`;
      case 'quarterly':
        return `${amountText}${t('donateQuarterly')}`;
      case 'yearly':
        return `${amountText}${t('donateYearly')}`;
      default:
        return `${amountText}${t('donateNow')}`;
    }
  };

  return (
    <Card className='donation-form border-2 border-card shadow py-0 gap-0 rounded-2xl'>
      <CardHeader className='px-4 py-2.5 mx-1 mt-1 bg-muted rounded-tl-lg rounded-tr-lg flex flex-row justify-between items-center gap-0 space-y-0'>
        <div className='text-muted-foreground text-sm font-semibold'>
          {t('cardHeader')}
        </div>
        {settings.allow_recurrency && frequencyOptions.length > 1 && (
          <DonationFrequencyDropdown
            options={frequencyOptions}
            selectedOption={selectedFrequency}
            onOptionChange={setSelectedFrequency}
          />
        )}
      </CardHeader>

      <CardContent className='p-4 rounded-bl-2xl rounded-br-2xl flex flex-col gap-4'>
        <DonationAmounts
          amounts={presetAmounts}
          currency={currency}
          onAmountSelect={amount => {
            setSelectedAmount(amount);
            setCustomAmount(undefined);
          }}
          selectedAmount={selectedAmount}
          customAmount={customAmount}
          onCustomAmountChange={setCustomAmount}
          customOption={customOption}
        />

        {settings.allow_dedication && (
          <div className='flex items-start gap-2.5'>
            <div className='w-6 h-6 flex justify-start items-start gap-3'>
              <button
                type='button'
                onClick={() => setIsDedicated(!isDedicated)}
                className='flex-1 self-stretch relative'
              >
                <div
                  className={`w-5 h-5 left-px top-px absolute rounded shadow-sm border flex items-center justify-center transition-all ${
                    isDedicated
                      ? 'bg-foreground border-foreground'
                      : 'bg-background border-input'
                  }`}
                >
                  {isDedicated && <Check className='w-4 h-4 text-background' />}
                </div>
              </button>
            </div>
            <div className='flex-1 flex flex-col gap-1'>
              <div className='text-foreground text-sm font-semibold'>
                {t('giftTitle')}
              </div>
              <div className='text-muted-foreground text-sm font-normal'>
                {t('giftSubtitle')}
              </div>
            </div>
          </div>
        )}

        <Button
          className='h-9 w-full font-medium text-base hover:brightness-90'
          style={{ backgroundColor: 'var(--accent-color)' }}
          onClick={() =>
            onDonate(
              customAmount || selectedAmount,
              isDedicated,
              selectedFrequency.value
            )
          }
        >
          {getDonateButtonText()}
        </Button>
      </CardContent>
    </Card>
  );
}
