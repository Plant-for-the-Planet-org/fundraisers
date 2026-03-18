import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { useTranslations } from 'next-intl';

interface GoalProgressDisplayProps {
  raisedAmount: number;
  goalAmount: number;
  currency: string;
  progressPercentage: number;
  daysLeft: number;
}

export function GoalProgressDisplay({
  raisedAmount,
  goalAmount,
  currency,
  progressPercentage,
  daysLeft,
}: GoalProgressDisplayProps) {
  const t = useTranslations('Fundraisers.create.goalPreview');

  return (
    <div className='goal-progress-display flex flex-col'>
      <div className='text-foreground text-lg font-bold'>
        {t('raised', {
          amount: formatCurrencyFromDecimal(raisedAmount, currency),
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

      <div className='mt-2 flex items-center justify-between text-sm text-muted-foreground'>
        <div>
          {t('goalLine', {
            amount: formatCurrencyFromDecimal(goalAmount, currency),
          })}
        </div>
        <div>{t('daysLeft', { days: daysLeft })}</div>
      </div>
    </div>
  );
}
