import type { SingleCurrencyTotalRaised } from '@/lib/utils/fundraiser';

import { useLocale, useTranslations } from 'next-intl';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';

interface MultiCurrencyRaisedDisplayProps {
  totalRaisedEntries: SingleCurrencyTotalRaised[];
}

export function MultiCurrencyRaisedDisplay({
  totalRaisedEntries,
}: MultiCurrencyRaisedDisplayProps) {
  const t = useTranslations('Fundraisers.form.goalPreview');
  const locale = useLocale();

  return (
    <div className='flex flex-col gap-1'>
      {totalRaisedEntries.map(({ currency, amount }) => (
        <div key={currency} className='text-foreground text-lg font-bold'>
          {t('raised', {
            amount: formatCurrencyFromDecimal(amount, currency, locale),
          })}
        </div>
      ))}
    </div>
  );
}
