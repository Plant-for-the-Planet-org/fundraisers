'use client';

import type { SentInvitationGift } from '@planet-sdk/common';

import { useTranslations } from 'next-intl';
import { Gift } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useDonationForm } from './donation-form-context';

export function GiftSummary() {
  const { donationData } = useDonationForm();

  if (!donationData.dedicated || !donationData.gift) return null;

  return <GiftSummaryInner gift={donationData.gift} />;
}

function GiftSummaryInner({ gift }: { gift: SentInvitationGift }) {
  const t = useTranslations('Donate.gift');

  const recipientEmailNoticeKey = gift.message
    ? 'emailNotice'
    : 'emailNoticeNoMessage';

  return (
    <Card className='gift-summary border border-card'>
      <CardContent>
        <div className='relative space-y-3'>
          <Gift
            className='absolute right-0 top-0 h-5 w-5 text-red-500 shrink-0'
            aria-hidden='true'
          />

          <h3 className='font-semibold leading-tight text-foreground wrap-anywhere pr-8'>
            {t('dedicatedTo', { recipientName: gift.recipientName })}
          </h3>

          {gift.message !== undefined && (
            <blockquote className='border-l-2 border-muted pl-3 text-muted-foreground text-sm wrap-anywhere'>
              &ldquo;{gift.message}&rdquo;
            </blockquote>
          )}

          <p className='text-muted-foreground text-sm wrap-anywhere'>
            {gift.recipientEmail !== undefined
              ? t.rich(recipientEmailNoticeKey, {
                  recipientEmail: gift.recipientEmail,
                  highlight: chunks => (
                    <span className='font-semibold text-foreground'>
                      {chunks}
                    </span>
                  ),
                })
              : t('emailNoticeNoEmail')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
