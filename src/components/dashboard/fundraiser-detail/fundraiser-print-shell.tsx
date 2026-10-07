'use client';

import type { InsightsRange } from '@/lib/types/fundraiser-insights';

import { useTranslations } from 'next-intl';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Loader } from '@/components/ui/loader';
import { StatusMessage } from './fundraiser-detail-shell';
import { InsightsReport } from './insights-report/insights-report';
import { useHostedFundraiser } from './use-hosted-fundraiser';

function FundraiserPrintBody({
  slug,
  range,
}: {
  slug: string;
  range: InsightsRange;
}) {
  const t = useTranslations('Dashboard.fundraiser');
  const tEdit = useTranslations('Fundraisers.edit');
  const state = useHostedFundraiser(slug);

  if (state.status === 'loading') {
    return <Loader text={tEdit('loading')} />;
  }
  if (state.status === 'not-found') {
    return (
      <StatusMessage
        title={tEdit('notFoundTitle')}
        description={tEdit('notFoundDescription')}
      />
    );
  }
  if (state.status === 'unauthorized') {
    return (
      <StatusMessage
        title={t('unauthorizedTitle')}
        description={t('unauthorizedDescription')}
      />
    );
  }
  if (state.status === 'error') {
    return (
      <StatusMessage
        title={tEdit('errorTitle')}
        description={tEdit('errorDescription')}
      />
    );
  }

  return <InsightsReport fundraiser={state.fundraiser} range={range} />;
}

/** The print page has no dashboard menu, so it checks sign-in and hosting itself, the same way the fundraiser pages do. */
export function FundraiserPrintShell({
  slug,
  range,
}: {
  slug: string;
  range: InsightsRange;
}) {
  return (
    <AuthGuard>
      <FundraiserPrintBody slug={slug} range={range} />
    </AuthGuard>
  );
}
