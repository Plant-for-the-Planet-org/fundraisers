'use client';

import { useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils/currency';
import { DonationForm } from './donation-form';
import { SectionHeader } from './typography';

export function ContributionSettings() {
  const t = useTranslations('Fundraisers.form.contributionSettings');
  const currency = useWatch({ name: 'currency' }) as string;

  return (
    <div className='contribution-settings flex flex-col gap-3'>
      <SectionHeader>{t('sectionHeading')}</SectionHeader>
      <DonationForm
        currency={currency}
        onDonate={(amount, isDedicated, frequency) => {
          alert(
            `Preview Mode\nWould donate ${formatCurrency(amount, currency)} ${frequency}${isDedicated ? ' (dedicated)' : ''}`
          );
        }}
      />
    </div>
  );
}
