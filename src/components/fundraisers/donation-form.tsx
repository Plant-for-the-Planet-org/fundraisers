'use client';

import type { SentInvitationGift } from '@planet-sdk/common';
import type {
  DonationGiftErrorCode,
  DonationGiftErrors,
  DonationGiftValues,
} from '@/lib/donation/gift-validation';
import type { DonationFrequency } from '@/lib/types/donation';
import type {
  ContributionModuleSettings,
  RecurrencyType,
} from '@/lib/types/fundraiser';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  GIFT_MESSAGE_MAX_LENGTH,
  RECIPIENT_EMAIL_MAX_LENGTH,
  RECIPIENT_NAME_MAX_LENGTH,
  validateDonationGift,
} from '@/lib/donation/gift-validation';
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
import { DonationAmounts } from './donation-amounts';
import { DonationFrequencyDropdown } from './donation-frequency-dropdown';
import { DonationGiftSection } from './donation-gift-section';

interface DonationFormProps {
  contributionSettings?: ContributionModuleSettings;
  currency?: string;
  onDonate: (
    amountCents: number,
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

export function DonationForm({
  contributionSettings,
  currency = 'EUR',
  onDonate,
}: DonationFormProps) {
  const t = useTranslations('Fundraisers.form.contributionSettings');
  const locale = useLocale();

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

  const [giftValues, setGiftValues] = useState<DonationGiftValues>({
    recipientName: '',
    recipientEmail: '',
    message: '',
  });
  const [giftErrors, setGiftErrors] = useState<DonationGiftErrors>({});

  const getDonateButtonText = () => {
    const amount = customAmount || selectedAmount;
    const amountText = settings.show_totals_on_fundraiser
      ? `${formatCurrency(amount, currency, locale)} • `
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

  const giftErrorMessages: Record<DonationGiftErrorCode, string> = {
    'recipientName.required': t('gift.errors.recipientName.required'),
    'recipientName.tooLong': t('gift.errors.recipientName.tooLong'),
    'recipientEmail.invalid': t('gift.errors.recipientEmail.invalid'),
    'recipientEmail.tooLong': t('gift.errors.recipientEmail.tooLong'),
    'recipientEmail.requiredWithMessage': t(
      'gift.errors.recipientEmail.requiredWithMessage'
    ),
    'message.tooLong': t('gift.errors.message.tooLong'),
  };

  const handleGiftFieldChange = (
    field: keyof DonationGiftValues,
    value: string
  ) => {
    setGiftValues(prev => ({ ...prev, [field]: value }));

    if (field === 'recipientName') {
      const tooLong = value.trim().length > RECIPIENT_NAME_MAX_LENGTH;
      setGiftErrors(prev => ({
        ...prev,
        recipientName: tooLong
          ? giftErrorMessages['recipientName.tooLong']
          : undefined,
      }));
      return;
    }

    if (field === 'message') {
      const tooLong = value.trim().length > GIFT_MESSAGE_MAX_LENGTH;
      setGiftErrors(prev => ({
        ...prev,
        message: tooLong ? giftErrorMessages['message.tooLong'] : undefined,
        ...(prev.recipientEmail ===
        giftErrorMessages['recipientEmail.requiredWithMessage']
          ? { recipientEmail: undefined }
          : {}),
      }));
      return;
    }

    if (field === 'recipientEmail') {
      const tooLong = value.trim().length > RECIPIENT_EMAIL_MAX_LENGTH;
      setGiftErrors(prev => ({
        ...prev,
        recipientEmail: tooLong
          ? giftErrorMessages['recipientEmail.tooLong']
          : undefined,
      }));
      return;
    }
  };

  const handleDonate = () => {
    if (isDedicated) {
      const validationResult = validateDonationGift(giftValues);

      if (!validationResult.success) {
        const { errorCodes } = validationResult;
        const errors: DonationGiftErrors = {
          ...(errorCodes.recipientName && {
            recipientName: giftErrorMessages[errorCodes.recipientName],
          }),
          ...(errorCodes.recipientEmail && {
            recipientEmail: giftErrorMessages[errorCodes.recipientEmail],
          }),
          ...(errorCodes.message && {
            message: giftErrorMessages[errorCodes.message],
          }),
        };

        setGiftErrors(errors);
        return;
      }

      const {
        recipientName: validatedRecipientName,
        recipientEmail: validatedRecipientEmail,
        message: validatedMessage,
      } = validationResult.data;

      const gift: SentInvitationGift = {
        type: 'invitation',
        recipientName: validatedRecipientName,
        ...(validatedRecipientEmail && {
          recipientEmail: validatedRecipientEmail,
        }),
        ...(validatedMessage && { message: validatedMessage }),
      };

      setGiftErrors({});
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
          <DonationGiftSection
            isDedicated={isDedicated}
            values={giftValues}
            errors={giftErrors}
            onToggleDedicated={handleDedicationToggle}
            onFieldChange={handleGiftFieldChange}
          />
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
