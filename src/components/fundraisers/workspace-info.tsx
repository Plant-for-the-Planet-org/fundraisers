'use client';

import type { CreateFundraiserFormValues } from './create-fundraiser-form-context';

import { useWatch } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { getTaxDeductibilityInfo } from '@/lib/utils/country-currency';

export function WorkspaceInfo() {
  const locale = useLocale();
  const t = useTranslations('Fundraisers.create.countryEntity.info');

  const country = useWatch<CreateFundraiserFormValues, 'country'>({
    name: 'country',
  });
  const { isDeductible, countryName } = getTaxDeductibilityInfo(
    country,
    locale
  );

  // TODO: If this info banner pattern appears elsewhere, replace with shadcn <Alert> + <AlertDescription>
  // (npx shadcn@latest add alert) to avoid duplication.
  return (
    <div className='workspace-info flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800'>
      <Info className='w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0' />
      <div className='text-xs text-foreground'>
        <p>{t('general')}</p>
        <p className='mt-1'>
          {isDeductible
            ? `✓ ${t('taxReceiptEligible', { country: countryName })}`
            : t('notTaxReceiptEligible', { country: countryName })}
        </p>
      </div>
    </div>
  );
}
