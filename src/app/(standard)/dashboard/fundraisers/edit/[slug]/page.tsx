'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { use } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AuthGuard } from '@/components/auth/auth-guard';
import { EditFundraiserFormProvider } from '@/components/fundraisers/edit-fundraiser-form-context';
import { FundraiserFormBody } from '@/components/fundraisers/fundraiser-form-body';
import { UpdateFundraiserButton } from '@/components/fundraisers/update-fundraiser-button';
import { useFundraiserForEdit } from '@/components/fundraisers/use-fundraiser-for-edit';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';

function EditFundraiserContent({ fundraiser }: { fundraiser: Fundraiser }) {
  return (
    <EditFundraiserFormProvider fundraiser={fundraiser}>
      <FundraiserFormBody
        mode='edit'
        submitButton={
          <UpdateFundraiserButton
            fundraiserId={fundraiser.id}
            existingSettings={fundraiser.settings}
          />
        }
        totalRaised={fundraiser.totalRaised[fundraiser.currency] ?? 0}
        endDate={fundraiser.endDate}
        fundraiserId={fundraiser.id}
        hosts={fundraiser.hosts}
      />
    </EditFundraiserFormProvider>
  );
}

function StatusMessage({
  title,
  description,
  backLabel,
}: {
  title: string;
  description: string;
  backLabel: string;
}) {
  return (
    <div className='flex flex-col items-center justify-center gap-4 min-h-[50vh] text-center'>
      <h1 className='text-2xl font-semibold'>{title}</h1>
      <p className='text-muted-foreground'>{description}</p>
      <Button asChild variant='outline'>
        <Link href='/dashboard'>{backLabel}</Link>
      </Button>
    </div>
  );
}

function EditFundraiserBody({ slug }: { slug: string }) {
  const t = useTranslations('Fundraisers.edit');
  const state = useFundraiserForEdit(slug);

  if (state.status === 'idle' || state.status === 'loading') {
    return <Loader text={t('loading')} />;
  }

  if (state.status === 'not-found') {
    return (
      <StatusMessage
        title={t('notFoundTitle')}
        description={t('notFoundDescription')}
        backLabel={t('backToDashboard')}
      />
    );
  }

  if (state.status === 'unauthorized') {
    return (
      <StatusMessage
        title={t('unauthorizedTitle')}
        description={t('unauthorizedDescription')}
        backLabel={t('backToDashboard')}
      />
    );
  }

  if (state.status === 'error' || !state.fundraiser) {
    return (
      <StatusMessage
        title={t('errorTitle')}
        description={state.errorMessage ?? t('errorDescription')}
        backLabel={t('backToDashboard')}
      />
    );
  }

  return <EditFundraiserContent fundraiser={state.fundraiser} />;
}

export default function EditFundraiserPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return (
    <AuthGuard>
      <EditFundraiserBody slug={slug} />
    </AuthGuard>
  );
}
