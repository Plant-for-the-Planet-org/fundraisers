'use client';

import type { SentInvitationGift } from '@planet-sdk/common';
import type { DonationFrequency } from '@/lib/types/donation';
import type {
  ContributionModuleSettings,
  RecurrencyType,
} from '@/lib/types/fundraiser';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import {
  getAvailableRecurrencyOptions,
  getContributionSettings,
  getCustomOption,
  getDefaultSelectedAmount,
  getPresetAmounts,
} from '@/lib/utils/contribution-utils';
import { formatCurrency } from '@/lib/utils/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DonationAmounts } from './donation-amounts';
import { DonationFrequencyDropdown } from './donation-frequency-dropdown';

interface DonationFormProps {
  contributionSettings?: ContributionModuleSettings;
  currency?: string;
  onDonate: (
    amount: number,
    isDedicated: boolean,
    frequency: DonationFrequency,
    gift?: SentInvitationGift
  ) => void;
}

const recurrencyToValue = (recurrency: RecurrencyType): DonationFrequency => {
  switch (recurrency) {
    case 'once':
      return 'once';
    case 'monthly':
      return 'monthly';
    // case 'quarterly': // reserved for future use, update DonationFrequency type if enabled
    case 'yearly':
      return 'yearly';
    default:
      return 'once';
  }
};

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
    recurrencyToUI(availableRecurrencyOptions[0] ?? 'once')
  );
  const [isDedicated, setIsDedicated] = useState(false);

  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [giftErrors, setGiftErrors] = useState<{
    recipientName?: string;
    recipientEmail?: string;
  }>({});

  const getDonateButtonText = () => {
    const amount = customAmount || selectedAmount;
    const amountText = settings.show_totals_on_fundraiser
      ? `${formatCurrency(amount, currency)} • `
      : '';

    switch (selectedFrequency.value) {
      case 'monthly':
        return `${amountText}${t('donateMonthly')}`;
      // case 'quarterly': // reserved for future use
      case 'yearly':
        return `${amountText}${t('donateYearly')}`;
      default:
        return `${amountText}${t('donateNow')}`;
    }
  };

  const handleDedicationToggle = () => {
    setIsDedicated(!isDedicated);
    setGiftErrors({});
  };

  const handleDonate = () => {
    if (isDedicated) {
      const errors: typeof giftErrors = {};
      if (!recipientName.trim()) {
        errors.recipientName = t('gift.errors.recipientName.required');
      }
      if (recipientEmail && !isValidEmail(recipientEmail)) {
        errors.recipientEmail = t('gift.errors.recipientEmail.invalid');
      } else if (message && !recipientEmail) {
        errors.recipientEmail = t(
          'gift.errors.recipientEmail.requiredWithMessage'
        );
      }
      if (Object.keys(errors).length > 0) {
        setGiftErrors(errors);
        return;
      }

      const gift: SentInvitationGift = {
        type: 'invitation',
        recipientName: recipientName.trim(),
        ...(recipientEmail.trim() && { recipientEmail: recipientEmail.trim() }),
        ...(message.trim() && { message: message.trim() }),
      };
      onDonate(
        customAmount || selectedAmount,
        true,
        selectedFrequency.value,
        gift
      );
      return;
    }

    onDonate(customAmount || selectedAmount, false, selectedFrequency.value);
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
          <>
            <div className='flex items-start gap-2.5'>
              <div className='w-6 h-6 flex justify-start items-start gap-3'>
                <button
                  type='button'
                  onClick={handleDedicationToggle}
                  className='flex-1 self-stretch relative'
                >
                  <div
                    className={`w-5 h-5 left-px top-px absolute rounded shadow-sm border flex items-center justify-center transition-all ${
                      isDedicated
                        ? 'bg-foreground border-foreground'
                        : 'bg-background border-input'
                    }`}
                  >
                    {isDedicated && (
                      <Check className='w-4 h-4 text-background' />
                    )}
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

            {isDedicated && (
              <div className='flex flex-col gap-3'>
                <div className='flex flex-col gap-1'>
                  <label className='text-sm font-medium text-foreground'>
                    {t('gift.recipientName.label')}
                  </label>
                  <Input
                    type='text'
                    placeholder={t('gift.recipientName.placeholder')}
                    value={recipientName}
                    onChange={e => {
                      setRecipientName(e.target.value);
                      if (giftErrors.recipientName) {
                        setGiftErrors(prev => ({
                          ...prev,
                          recipientName: undefined,
                        }));
                      }
                    }}
                    className='border-gray-300 focus:border-gray-500 focus:ring-gray-500'
                    aria-invalid={!!giftErrors.recipientName}
                  />
                  {giftErrors.recipientName && (
                    <p className='text-sm text-destructive'>
                      {giftErrors.recipientName}
                    </p>
                  )}
                </div>

                <div className='flex flex-col gap-1'>
                  <label className='text-sm font-medium text-foreground'>
                    {t('gift.recipientEmail.label')}
                  </label>
                  <Input
                    type='email'
                    placeholder={t('gift.recipientEmail.placeholder')}
                    value={recipientEmail}
                    onChange={e => {
                      setRecipientEmail(e.target.value);
                      if (giftErrors.recipientEmail) {
                        setGiftErrors(prev => ({
                          ...prev,
                          recipientEmail: undefined,
                        }));
                      }
                    }}
                    className='border-gray-300 focus:border-gray-500 focus:ring-gray-500'
                    aria-invalid={!!giftErrors.recipientEmail}
                  />
                  {giftErrors.recipientEmail && (
                    <p className='text-sm text-destructive'>
                      {giftErrors.recipientEmail}
                    </p>
                  )}
                </div>

                <div className='flex flex-col gap-1'>
                  <label className='text-sm font-medium text-foreground'>
                    {t('gift.message.label')}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={t('gift.message.placeholder')}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className='border-input placeholder:text-muted-foreground flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none'
                  />
                </div>
              </div>
            )}
          </>
        )}

        <Button
          className='h-9 w-full font-medium text-base hover:brightness-90'
          style={{ backgroundColor: 'var(--accent-color)' }}
          onClick={handleDonate}
        >
          {getDonateButtonText()}
        </Button>
      </CardContent>
    </Card>
  );
}
