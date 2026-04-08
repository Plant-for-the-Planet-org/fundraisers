'use client';
import type { BankAccountDetails } from '@/lib/types/payment';

import { useTranslations } from 'next-intl';
import { CopyFieldRow } from './copy-field-row';

interface TransferDetailsListProps {
  account: BankAccountDetails;
  formattedAmount: string;
  donationId: string | null;
  uid: string | null;
}

interface FieldDef {
  label: string;
  value: string | undefined | null;
}

export function TransferDetailsList({
  account,
  formattedAmount,
  donationId,
  uid,
}: TransferDetailsListProps) {
  const t = useTranslations('Donate.thankYou.transfer');

  const bankFields: FieldDef[] = [
    { label: t('amount'), value: formattedAmount },
    { label: t('reference'), value: uid },
    { label: t('beneficiary'), value: account.beneficiary },
    { label: t('iban'), value: account.iban },
    { label: t('bic'), value: account.bic },
    { label: t('bank'), value: account.bankName },
  ];

  const visibleBank = bankFields.filter(
    (f): f is FieldDef & { value: string } => !!f.value
  );

  if (visibleBank.length === 0) {
    return (
      <div className='space-y-2'>
        <p className='text-sm text-gray-500'>
          {t.rich('error', {
            link: chunks => (
              <a
                href='mailto:support@plant-for-the-planet.org'
                className='underline'
              >
                {chunks}
              </a>
            ),
          })}
        </p>
        {donationId !== null && (
          <p className='text-center text-xs text-gray-400'>
            {t('transactionId', { id: donationId })}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <FieldGroup heading={t('heading')}>
        {visibleBank.map(f => (
          <CopyFieldRow key={f.label} label={f.label} value={f.value} />
        ))}
      </FieldGroup>
      {donationId !== null && (
        <p className='text-center text-xs text-gray-400'>
          {t('transactionId', { id: donationId })}
        </p>
      )}
    </div>
  );
}

function FieldGroup({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className='mb-2.5 text-xs font-semibold tracking-wide text-gray-500'>
        {heading}
      </p>
      <div className='rounded-xl border border-gray-100 bg-white px-4'>
        {children}
      </div>
    </div>
  );
}
