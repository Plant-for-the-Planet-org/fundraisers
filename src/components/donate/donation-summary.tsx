'use client';

import type { DonationFormValues } from './donation-form-context';

import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils/currency';
import { getDonationProcessingFeeInfo } from '@/lib/utils/donation-payment-fees';
import { getImageUrl } from '@/lib/utils/images';
import { cn } from '@/lib/utils/index';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useDonationForm } from './donation-form-context';

export function DonationSummary() {
  const { fundraiser, donationData, paymentOptions } = useDonationForm();
  const { watch } = useFormContext<DonationFormValues>();
  const willAbsorbFee = watch('willAbsorbFee');
  const makeMonthly = watch('makeMonthly');
  const selectedPaymentMethod = useWatch({
    name: 'selectedPaymentMethod',
  });
  const t = useTranslations('Fundraisers');

  const fundraiserImageUrl = getImageUrl(
    'fundraiser',
    'small',
    fundraiser.image
  );

  const renderFundraiserImage = () => {
    if (fundraiserImageUrl) {
      return (
        <img
          className='w-full h-full object-cover'
          src={fundraiserImageUrl}
          alt={t('coverImageAlt', { title: fundraiser.title })}
        />
      );
    }
    return (
      <div className='w-full h-full flex items-center justify-center text-muted-foreground'>
        {fundraiser.title.charAt(0).toUpperCase()}
      </div>
    );
  };

  // There should be at least one public host.
  // TODO: As API is updated this overwrite should be removed.
  const hostsWithAtLeastOnePublic = fundraiser.hosts.map((host, index) =>
    index === 0
      ? {
          ...host,
          isPublic: true,
          displayName: host.displayName ?? host.user?.name,
        }
      : host
  );

  const publicHosts = hostsWithAtLeastOnePublic
    .filter(h => h.isPublic)
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));

  const joinedNames = publicHosts
    .map(h => h.displayName)
    .filter(Boolean)
    .join(' and ');

  const hostText = joinedNames
    ? t('hostedBy', { hostName: joinedNames })
    : t('hostedByAnonymous');

  const renderHostAvatars = () => {
    if (publicHosts.length === 0) {
      return (
        <Avatar className='w-6 h-6'>
          <AvatarFallback className='bg-neutral text-neutral-foreground' />
        </Avatar>
      );
    }
    return publicHosts.map((host, index) => {
      const avatarUrl = getImageUrl('profile', 'thumb', host.user?.avatar);
      return (
        <Avatar
          key={host.id}
          className={cn('w-6 h-6 border-2 border-card', index > 0 && '-ml-1')}
        >
          {avatarUrl && <AvatarImage src={avatarUrl} alt='' loading='lazy' />}
          <AvatarFallback className='bg-muted text-muted-foreground text-xs'>
            {host.displayName?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      );
    });
  };

  const isMonthly = donationData.frequency === 'monthly' || makeMonthly;
  const isYearly = donationData.frequency === 'yearly';
  const { hasProcessingFee, processingFeeCents } = useMemo(() => {
    return getDonationProcessingFeeInfo({
      paymentOptions,
      donationAmountCents: donationData.amountCents,
      donationCurrency: donationData.currency,
      workspaceCountry: fundraiser.workspace?.country,
      selectedPaymentMethod,
    });
  }, [
    donationData.amountCents,
    donationData.currency,
    fundraiser.workspace?.country,
    paymentOptions,
    selectedPaymentMethod,
  ]);

  const totalCents =
    donationData.amountCents +
    (willAbsorbFee && hasProcessingFee ? processingFeeCents : 0);
  const totalLabel = isMonthly
    ? t('donate.summary.totalMonthly')
    : isYearly
      ? t('donate.summary.totalYearly')
      : t('donate.summary.total');

  const renderBreakdown = () => (
    <dl
      aria-label={t('donate.summary.breakdown')}
      className='border-t border-border'
    >
      <div className='py-4'>
        {fundraiser.projectAllocations.map((allocation, index) => (
          <div
            key={index}
            className='flex justify-between items-baseline gap-2'
          >
            <dt className='text-muted-foreground text-sm'>
              {allocation.project.name}
            </dt>
            <dd className='text-foreground text-sm'>
              {formatCurrency(
                Math.round(
                  (allocation.percentage / 100) * donationData.amountCents
                ),
                donationData.currency
              )}
            </dd>
          </div>
        ))}
        {willAbsorbFee && hasProcessingFee && (
          <div className='flex justify-between items-baseline gap-2'>
            <dt className='text-muted-foreground text-sm'>
              {t('donate.summary.processingFee')}
            </dt>
            <dd className='text-foreground text-sm font-medium'>
              {formatCurrency(processingFeeCents, donationData.currency)}
            </dd>
          </div>
        )}
      </div>

      <div className='flex justify-between items-center gap-2 pt-4 border-t border-border'>
        <dt className='font-semibold text-foreground'>{totalLabel}</dt>
        <dd className='font-semibold text-lg text-foreground'>
          {formatCurrency(totalCents, donationData.currency)}
        </dd>
      </div>
    </dl>
  );

  return (
    <Card className='donation-summary border border-card'>
      <CardContent>
        <div className='space-y-6'>
          {/* Fundraiser header */}
          <div className='flex gap-4'>
            <div className='w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted'>
              {renderFundraiserImage()}
            </div>
            <div className='flex-1 space-y-2 min-w-0'>
              <h3 className='font-semibold leading-tight text-foreground wrap-anywhere'>
                {fundraiser.title}
              </h3>
              <div className='flex items-center gap-2'>
                <div className='flex items-center' aria-hidden='true'>
                  {renderHostAvatars()}
                </div>
                <p className='text-muted-foreground text-sm'>{hostText}</p>
              </div>
            </div>
          </div>

          {/* Breakdown + total */}
          {renderBreakdown()}
        </div>
      </CardContent>
    </Card>
  );
}
