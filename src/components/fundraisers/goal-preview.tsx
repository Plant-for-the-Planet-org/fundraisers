'use client';

import type { CreateFundraiserFormValues } from './create-fundraiser-form-context';

import { useTranslations } from 'next-intl';
import { useWatch } from 'react-hook-form';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';

export function GoalPreview() {
  const t = useTranslations('Fundraisers.create.goalPreview');
  const goalAmount = useWatch<CreateFundraiserFormValues, 'goalAmount'>({
    name: 'goalAmount',
  });
  const currency = useWatch<CreateFundraiserFormValues, 'currency'>({
    name: 'currency',
  });

  const safeGoalAmount =
    typeof goalAmount === 'number' && Number.isFinite(goalAmount)
      ? goalAmount
      : 0;
  const previewCurrency = currency ?? 'USD';
  const progress = 40;
  const raisedAmount = Math.round((safeGoalAmount * progress) / 100);

  return (
    <div className='flex flex-col'>
      <div className='text-zinc-800 dark:text-gray-100 text-lg font-bold'>
        {t('raised', {
          amount: formatCurrencyFromDecimal(raisedAmount, previewCurrency),
        })}
      </div>

      <div className='mt-2'>
        <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden'>
          <div
            className='h-full bg-green-600'
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className='mt-2 flex items-center justify-between text-sm text-zinc-800 dark:text-gray-300'>
        <div>
          {t('goalLine', {
            amount: formatCurrencyFromDecimal(
              safeGoalAmount,
              previewCurrency
            ),
          })}
        </div>
        <div>{t('daysLeft', { days: 42 })}</div>
      </div>
    </div>
  );
}
