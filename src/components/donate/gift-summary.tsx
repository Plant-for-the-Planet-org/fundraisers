'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { useDonationForm } from './donation-form-context';

export function GiftSummary() {
  const { donationData } = useDonationForm();

  if (!donationData.dedicated || !donationData.gift) return null;

  return <GiftSummaryInner />;
}

function GiftSummaryInner() {
  const { donationData } = useDonationForm();
  const t = useTranslations('Donate.gift');
  const gift = donationData.gift!;

  const emailNoticeKey = gift.message ? 'emailNotice' : 'emailNoticeNoMessage';

  return (
    <Card className='gift-summary border border-card'>
      <CardContent>
        <div className='space-y-3'>
          <p className='font-semibold text-foreground'>
            {t('dedicatedTo', { recipientName: gift.recipientName })}
          </p>

          {gift.message && (
            <blockquote className='border-l-2 border-muted pl-3 text-muted-foreground text-sm'>
              &ldquo;{gift.message}&rdquo;
            </blockquote>
          )}

          {gift.recipientEmail && (
            <p className='text-muted-foreground text-sm'>
              {t(emailNoticeKey, { recipientEmail: gift.recipientEmail })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
