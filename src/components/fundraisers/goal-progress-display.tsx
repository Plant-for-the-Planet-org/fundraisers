import { useLocale, useTranslations } from 'next-intl';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';

interface GoalProgressDisplayProps {
  raisedAmount: number;
  goalAmount: number;
  currency: string | null | undefined;
  progressPercentage: number;
  /** Omit (or pass undefined) to hide the days-left line, e.g. when the fundraiser is not active. */
  daysLeft?: number;
  /** When false, hides the goal amount line. Progress bar and total raised always render. */
  showGoal?: boolean;
}

export function GoalProgressDisplay({
  raisedAmount,
  goalAmount,
  currency,
  progressPercentage,
  daysLeft,
  showGoal = true,
}: GoalProgressDisplayProps) {
  const t = useTranslations('Fundraisers.form.goalPreview');
  const locale = useLocale();

  return (
    <div className='goal-progress-display flex flex-col'>
      <div className='text-foreground text-lg font-bold'>
        {t('raised', {
          amount: formatCurrencyFromDecimal(raisedAmount, currency, locale),
        })}
      </div>

      <div className='mt-2'>
        <div className='h-2 w-full rounded-full bg-muted overflow-hidden'>
          <div
            className='h-full bg-accent-color'
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {(showGoal || daysLeft !== undefined) && (
        <div className='mt-2 flex items-center justify-between text-sm text-muted-foreground'>
          {showGoal && (
            <div>
              {t('goalLine', {
                amount: formatCurrencyFromDecimal(goalAmount, currency, locale),
              })}
            </div>
          )}
          {daysLeft !== undefined && (
            <div>{t('daysLeft', { days: daysLeft })}</div>
          )}
        </div>
      )}
    </div>
  );
}
