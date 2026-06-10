'use client';

import type { SentInvitationGift } from '@planet-sdk/common';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { DonationData } from './donate-overlay';
import type { DonationFormValues } from './donation-form-context';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, Gift } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { useDonationForm } from './donation-form-context';

/**
 * Summary card shown on the payment page when the donation is dedicated as a
 * gift. Renders only when a gift is present (`dedicated` + `gift`).
 */
export function GiftSummary() {
  const { donationData, fundraiser } = useDonationForm();

  if (!donationData.dedicated || !donationData.gift) return null;

  return (
    <GiftSummaryInner
      gift={donationData.gift}
      donationData={donationData}
      fundraiser={fundraiser}
    />
  );
}

/**
 * Resolves how the donor is named in the preview, from auth profile then live
 * form input. `donorName` is the full name used in the donated-amount line;
 * `senderName` is the first name (or company name) used to attribute the
 * message.
 *
 * The "anonymous" preference is intentionally ignored here: it only hides the
 * donor from the public fundraiser page, not from the named recipient of a
 * personal gift.
 */
function useDonorIdentity(): { donorName: string; senderName: string } {
  const t = useTranslations('Donate.gift');
  const { watch } = useFormContext<DonationFormValues>();
  const [isCompany, formCompany, formFirst, formLast] = watch([
    'isCompany',
    'companyName',
    'firstname',
    'lastname',
  ]);

  const profileType = useAuthStore(s => s.user?.profile?.type);
  const profileName = useAuthStore(s => s.user?.profile?.name);
  const profileFirst = useAuthStore(s => s.user?.profile?.firstname);
  const profileLast = useAuthStore(s => s.user?.profile?.lastname);

  const companyName = formCompany?.trim();
  const firstName = (formFirst || profileFirst || '').trim();
  const lastName = (formLast || profileLast || '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  const fallback = t('emailPreview.donorFallback');

  // Form checkbox takes precedence, then profile org/company type.
  if (isCompany && companyName) {
    return { donorName: companyName, senderName: companyName };
  }
  const isCompanyProfile =
    (profileType === 'organization' || profileType === 'company') &&
    !!profileName;
  if (isCompanyProfile) {
    return { donorName: profileName, senderName: profileName };
  }
  return {
    donorName: fullName || fallback,
    senderName: firstName || fallback,
  };
}

/**
 * When the gift has a recipient email, shows a `To:` line that expands into a
 * preview of the dedication email the recipient will receive (the message
 * attribution and quote are omitted when no message was written). Keep this
 * copy in sync with the actual email the backend sends. When there is no
 * recipient email, shows a notice that the certificate link goes to the
 * donor's own confirmation email instead.
 */
function GiftSummaryInner({
  gift,
  donationData,
  fundraiser,
}: {
  gift: SentInvitationGift;
  donationData: DonationData;
  fundraiser: Fundraiser;
}) {
  const t = useTranslations('Donate.gift');
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);

  const { donorName, senderName } = useDonorIdentity();
  const amount = formatCurrency(
    donationData.amountCents,
    donationData.currency,
    locale
  );

  const hasMessage = gift.message !== undefined;

  return (
    <Card className='gift-summary border border-card py-4'>
      <CardContent className='px-4'>
        <div className='relative space-y-2.5'>
          <Gift
            className='absolute right-0 top-0 h-4 w-4 text-muted-foreground shrink-0'
            aria-hidden='true'
          />

          <h3 className='dedication-title font-semibold leading-tight text-foreground wrap-break-word pr-8'>
            {t('dedicatedTo', { recipientName: gift.recipientName })}
          </h3>

          {gift.recipientEmail !== undefined ? (
            <div className='space-y-2 text-sm'>
              <button
                type='button'
                onClick={() => setExpanded(value => !value)}
                aria-expanded={expanded}
                className='flex w-full items-start gap-2 text-left'
              >
                <ChevronDown
                  className={`mt-px h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${
                    expanded ? 'rotate-180' : ''
                  }`}
                  aria-hidden='true'
                />
                <span className='recipient flex-1 wrap-break-word text-xs text-muted-foreground'>
                  {t.rich('sentTo', {
                    recipientName: gift.recipientName,
                    recipientEmail: gift.recipientEmail,
                    recipient: chunks => (
                      <span className='text-foreground'>{chunks}</span>
                    ),
                  })}
                </span>
              </button>

              {expanded && (
                // pl-[1.375rem] aligns the body under the `To:` text, past the
                // hanging chevron (icon w-3.5 + gap-2).
                <div className='email-preview space-y-1.5 border-t border-muted pt-1.5 text-xs text-muted-foreground leading-snug wrap-break-word'>
                  <p className='sender border-b border-muted pb-1.5 pl-[1.375rem]'>
                    {t.rich('sentFrom', {
                      sender: chunks => (
                        <span className='text-foreground'>{chunks}</span>
                      ),
                    })}
                  </p>
                  <div className='space-y-1.5 pl-[1.375rem]'>
                    <p>
                      {t('emailPreview.greeting', {
                        recipientName: gift.recipientName,
                      })}
                    </p>
                    <p>
                      {t('emailPreview.intro', {
                        donor: donorName,
                        amount,
                        fundraiser: fundraiser.title,
                      })}{' '}
                      {t('emailPreview.certificate')}
                    </p>
                    {hasMessage && (
                      <>
                        <p>
                          {t('emailPreview.messageFrom', {
                            sender: senderName,
                          })}
                        </p>
                        <blockquote className='border-l-2 border-muted pl-2 text-foreground whitespace-pre-line'>
                          {gift.message}
                        </blockquote>
                      </>
                    )}
                    <p className='whitespace-pre-line'>
                      {t('emailPreview.signature')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className='text-muted-foreground text-sm wrap-break-word'>
              {t('emailNoticeNoEmail')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
