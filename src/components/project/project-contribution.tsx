'use client';

import type { ProjectPaymentOptions } from '@/lib/types/payment-options';

import { mapPaymentOptionsToContributionSettings } from '@/lib/utils/contribution-utils';
import { DonationForm } from '@/components/fundraisers/donation-form';

interface ProjectContributionProps {
  paymentOptions: ProjectPaymentOptions;
}

/**
 * Contribution card for the project page.
 *
 * Renders the existing `DonationForm` as-is, fed by the project's payment
 * options through `mapPaymentOptionsToContributionSettings` — the same mapper
 * `DonationSection` uses for fundraisers.
 *
 * The donation flow (overlay, payment, currency switch) is out of scope here,
 * so `onDonate` is intentionally inert; wiring it up is a later phase.
 *
 * This is a client component because `DonationForm` is one and `onDonate` is a
 * function, which cannot cross the server/client boundary as a prop.
 */
export function ProjectContribution({
  paymentOptions,
}: ProjectContributionProps) {
  const contributionSettings =
    mapPaymentOptionsToContributionSettings(paymentOptions);

  return (
    <DonationForm
      currency={paymentOptions.currency}
      contributionSettings={contributionSettings}
      frequencies={paymentOptions.frequencies}
      onDonate={() => {
        // Donation flow is out of scope for the layout work.
      }}
    />
  );
}
