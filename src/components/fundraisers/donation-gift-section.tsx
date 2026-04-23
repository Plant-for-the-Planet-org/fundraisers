'use client';

import type {
  DonationGiftErrors,
  DonationGiftValues,
} from '@/lib/donation/gift-validation';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DonationGiftSectionProps {
  isDedicated: boolean;
  values: DonationGiftValues;
  errors: DonationGiftErrors;
  onToggleDedicated: () => void;
  onFieldChange: (field: keyof DonationGiftValues, value: string) => void;
}

export function DonationGiftSection({
  isDedicated,
  values,
  errors,
  onToggleDedicated,
  onFieldChange,
}: DonationGiftSectionProps) {
  const t = useTranslations('Fundraisers.form.contributionSettings');

  return (
    <>
      <div className='flex items-start gap-2.5'>
        <div className='w-6 h-6 flex justify-start items-start gap-3'>
          <button
            type='button'
            onClick={onToggleDedicated}
            aria-label={t('giftTitle')}
            aria-pressed={isDedicated}
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

      {isDedicated && (
        <div className='flex flex-col gap-3'>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium text-foreground'>
              {t('gift.recipientName.label')}
            </label>
            <Input
              type='text'
              placeholder={t('gift.recipientName.placeholder')}
              value={values.recipientName}
              onChange={e => onFieldChange('recipientName', e.target.value)}
              className='border-gray-300 focus:border-gray-500 focus:ring-gray-500'
              aria-invalid={!!errors.recipientName}
            />
            {errors.recipientName && (
              <p className='text-sm text-destructive'>{errors.recipientName}</p>
            )}
          </div>

          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium text-foreground'>
              {t('gift.recipientEmail.label')}
            </label>
            <Input
              type='email'
              placeholder={t('gift.recipientEmail.placeholder')}
              value={values.recipientEmail}
              onChange={e => onFieldChange('recipientEmail', e.target.value)}
              className='border-gray-300 focus:border-gray-500 focus:ring-gray-500'
              aria-invalid={!!errors.recipientEmail}
            />
            {errors.recipientEmail && (
              <p className='text-sm text-destructive'>
                {errors.recipientEmail}
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
              value={values.message}
              onChange={e => onFieldChange('message', e.target.value)}
              className='border-input placeholder:text-muted-foreground flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none'
            />
          </div>
        </div>
      )}
    </>
  );
}
