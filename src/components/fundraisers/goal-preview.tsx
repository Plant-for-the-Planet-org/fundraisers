'use client';

import type { CreateFundraiserFormValues } from './create-fundraiser-form-context';

import { useTranslations } from 'next-intl';
import { useWatch } from 'react-hook-form';
import type { Fundraiser } from '@/lib/types/fundraiser';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';

interface GoalPreviewProps {
  mode?: 'read' | 'write';
  fundraiser?: Fundraiser;
}

function getDaysLeft(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  return Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
}

export function GoalPreview({ mode = 'read', fundraiser }: GoalPreviewProps) {
  if (mode === 'read') {
    return <GoalPreviewRead fundraiser={fundraiser} />;
  }

  return <GoalPreviewWrite />;
}

function GoalPreviewRead({ fundraiser }: { fundraiser?: Fundraiser }) {
  const t = useTranslations('Fundraisers.create.goalPreview');
  const tFundraisers = useTranslations('Fundraisers');

  if (!fundraiser) {
    return null;
  }

  const progressPercent =
    fundraiser.goalAmount > 0
      ? Math.min(100, (fundraiser.totalRaised / fundraiser.goalAmount) * 100)
      : 0;
  const daysLeft = getDaysLeft(fundraiser.endDate);

  return (
    <>
      <div className='flex flex-col'>
        <div className='text-zinc-800 dark:text-gray-100 text-lg font-bold'>
          {t('raised', {
            amount: formatCurrencyFromDecimal(
              fundraiser.totalRaised,
              fundraiser.currency
            ),
          })}
        </div>

        <div className='mt-2'>
          <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden'>
            <div
              className='h-full bg-green-600'
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className='mt-2 flex items-center justify-between text-sm text-zinc-800 dark:text-gray-300'>
          <div>
            {t('goalLine', {
              amount: formatCurrencyFromDecimal(
                fundraiser.goalAmount,
                fundraiser.currency
              ),
            })}
          </div>
          <div>{t('daysLeft', { days: daysLeft })}</div>
        </div>
      </div>

      <div className='text-zinc-800 dark:text-gray-100 text-sm font-semibold leading-tight'>
        {tFundraisers('donationCount', {
          count: fundraiser.donationCount,
          formattedCount: fundraiser.donationCount.toLocaleString(),
        })}
      </div>
    </>
  );
}

function GoalPreviewWrite() {
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
