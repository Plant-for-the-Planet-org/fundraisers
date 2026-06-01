'use client';
import type { BankAccountDetails } from '@/lib/types/payment';

import { useTranslations } from 'next-intl';
import { Info, QrCode } from 'lucide-react';
import { buildEpcPayload, isEpcEligible } from '@/lib/utils/epc-qr';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CopyFieldRow } from './copy-field-row';
import { EpcQrCode } from './epc-qr-code';

interface BankTransferDetailsProps {
  account: BankAccountDetails;
  formattedAmount: string;
  amount: number;
  currency: string;
  uid: string | null;
}

interface FieldDef {
  label: string;
  value: string | undefined | null;
  emphasize?: boolean;
}

export function BankTransferDetails({
  account,
  formattedAmount,
  amount,
  currency,
  uid,
}: BankTransferDetailsProps) {
  const t = useTranslations('Donate.thankYou.transfer');

  const topRow: FieldDef[] = [
    { label: t('amount'), value: formattedAmount },
    { label: t('reference'), value: uid, emphasize: true },
  ];
  const stackedFields: FieldDef[] = [
    { label: t('beneficiary'), value: account.beneficiary },
    { label: t('iban'), value: account.iban },
    { label: t('bank'), value: account.bankName },
    { label: t('bic'), value: account.bic },
  ];

  const visibleTop = topRow.filter(
    (f): f is FieldDef & { value: string } => !!f.value
  );
  const visibleStacked = stackedFields.filter(
    (f): f is FieldDef & { value: string } => !!f.value
  );

  if (visibleTop.length === 0 && visibleStacked.length === 0) {
    return (
      <p className='text-sm text-muted-foreground'>
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
    );
  }

  const epcEligible =
    account.beneficiary && isEpcEligible(currency, account.iban, amount);
  const epcPayload = epcEligible
    ? buildEpcPayload({
        beneficiary: account.beneficiary,
        iban: account.iban,
        bic: account.bic,
        amount,
        currency,
        reference: uid,
      })
    : null;

  const fieldList = (
    <div className='rounded-xl border border-border bg-card'>
      {visibleTop.length > 0 && (
        <div className='grid grid-cols-2 divide-x divide-border border-b border-border px-1'>
          {visibleTop.map(f => (
            <div key={f.label} className='px-3 [&>div]:border-b-0'>
              <CopyFieldRow
                label={f.label}
                value={f.value}
                emphasize={f.emphasize}
              />
            </div>
          ))}
        </div>
      )}
      <div className='px-4'>
        {visibleStacked.map(f => (
          <CopyFieldRow
            key={f.label}
            label={f.label}
            value={f.value}
            emphasize={false}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className='space-y-4'>
      {epcPayload ? (
        <Tabs defaultValue='details' className='gap-3'>
          <TabsList className='w-full'>
            <TabsTrigger value='details'>{t('detailsTab')}</TabsTrigger>
            <TabsTrigger value='qr'>{t('qrTab')}</TabsTrigger>
          </TabsList>
          <TabsContent value='details'>{fieldList}</TabsContent>
          <TabsContent value='qr'>
            <div className='rounded-xl border border-border bg-card px-4 py-6'>
              <div className='flex flex-col items-center gap-4'>
                <div className='inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-primary uppercase'>
                  <QrCode className='size-3.5' />
                  {t('qrBadge')}
                </div>
                <EpcQrCode
                  payload={epcPayload}
                  alt={t('qrAlt')}
                  fallback={t('qrFallback')}
                />
                <p className='max-w-xs text-center text-sm font-semibold text-foreground'>
                  {t('qrHint')}
                </p>
                <div className='flex w-full items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2'>
                  <Info className='mt-0.5 size-3.5 shrink-0 text-primary' />
                  <p className='text-[11px] leading-relaxed text-muted-foreground'>
                    {t('qrCameraWarning')}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div>
          <p className='mb-2.5 text-xs font-semibold tracking-wide text-muted-foreground'>
            {t('heading')}
          </p>
          {fieldList}
        </div>
      )}
    </div>
  );
}
