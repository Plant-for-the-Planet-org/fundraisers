import type { ReactNode } from 'react';

import { useLocale, useTranslations } from 'next-intl';
import { getCountry } from '@/lib/utils/country';

interface SecurityNoticeProps {
  organizationName: string;
  countryCode: string;
  isTaxDeductible: boolean;
}

export function SecurityNotice({
  organizationName,
  countryCode,
  isTaxDeductible,
}: SecurityNoticeProps) {
  const t = useTranslations('Fundraisers.securityNotice');
  const locale = useLocale();

  const countryName = getCountry(countryCode, locale);

  const highlightedText = {
    organization: organizationName,
    country: countryName,
    b: (chunks: ReactNode) => <strong>{chunks}</strong>,
  };

  return (
    <div className='security-notice text-center'>
      <p className='text-foreground text-sm'>
        {isTaxDeductible
          ? t.rich('withTaxDeduction', highlightedText)
          : t.rich('withoutTaxDeduction', highlightedText)}
      </p>
    </div>
  );
}
