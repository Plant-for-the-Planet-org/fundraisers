'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { FundraiserDetailContext } from './fundraiser-detail-context';
import { FundraiserDetailHeader } from './fundraiser-detail-header';
import { FundraiserDetailTabs } from './fundraiser-detail-tabs';
import { useHostedFundraiser } from './use-hosted-fundraiser';

function StatusMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const t = useTranslations('Fundraisers.edit');

  return (
    <div className='flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center'>
      <h1 className='text-2xl font-semibold'>{title}</h1>
      <p className='text-muted-foreground'>{description}</p>
      <Button asChild variant='outline'>
        <Link href='/dashboard/fundraisers'>{t('backToDashboard')}</Link>
      </Button>
    </div>
  );
}

function FundraiserDetailBody({
  slug,
  insightsEnabled,
  children,
}: {
  slug: string;
  insightsEnabled: boolean;
  children: ReactNode;
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

  return (
    <FundraiserDetailContext.Provider
      value={{ fundraiser: state.fundraiser, canEdit: state.canEdit }}
    >
      <section className='space-y-6'>
        <FundraiserDetailHeader
          fundraiser={state.fundraiser}
          canEdit={state.canEdit}
        />
        <FundraiserDetailTabs slug={slug} insightsEnabled={insightsEnabled} />
        {children}
      </section>
    </FundraiserDetailContext.Provider>
  );
}

export function FundraiserDetailShell({
  slug,
  insightsEnabled,
  children,
}: {
  slug: string;
  insightsEnabled: boolean;
  children: ReactNode;
}) {
  return (
    <AuthGuard>
      <FundraiserDetailBody slug={slug} insightsEnabled={insightsEnabled}>
        {children}
      </FundraiserDetailBody>
    </AuthGuard>
  );
}
