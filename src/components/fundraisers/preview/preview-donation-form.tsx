'use client';

import type { ContributionModuleSettings } from '@/lib/types/fundraiser';

import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/currency';
import { DonationForm } from '../donation-form';

/**
 * Donation form for preview mode — mirrors `ContributionSettings`: the Donate
 * button only toasts, never opens the real Stripe overlay. Lives in its own
 * client component so `FundraiserView` (a server component on the public page)
 * can render it without passing a client callback across the boundary.
 */
export function PreviewDonationForm({
  currency,
  contributionSettings,
}: {
  currency: string;
  contributionSettings?: ContributionModuleSettings;
}) {
  const t = useTranslations('Fundraisers.form.contributionSettings');
  const locale = useLocale();

  return (
    <DonationForm
      currency={currency}
      contributionSettings={contributionSettings}
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
  );
}
