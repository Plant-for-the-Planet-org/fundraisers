'use client';

import { useWatch } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/currency';
import { DonationForm } from './donation-form';
import { SectionHeader } from './typography';

export function ContributionSettings() {
  const t = useTranslations('Fundraisers.form.contributionSettings');
  const locale = useLocale();
  const currency = useWatch({ name: 'currency' }) as string;

  return (
    <div className='contribution-settings flex flex-col gap-3'>
      <SectionHeader>{t('sectionHeading')}</SectionHeader>
      <DonationForm
        currency={currency}
        onDonate={(amount, isDedicated, frequency) => {
          toast.message(t('preview.title'), {
            description: t('preview.description', {
              amount: formatCurrency(amount, currency, locale),
              frequency: t('preview.frequencyLabel', { frequency }),
              isDedicated: String(isDedicated),
            }),
          });
        }}
      />
    </div>
  );
}
