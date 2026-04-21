'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';
import type { SelectedProject } from '@/lib/types/project-selection';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getDefaultCauseId } from '@/lib/utils/project-selection';
import { AuthGuard } from '@/components/auth/auth-guard';
import { EditFundraiserFormProvider } from '@/components/fundraisers/edit-fundraiser-form-context';
import { FundraiserFormBody } from '@/components/fundraisers/fundraiser-form-body';
import { UpdateFundraiserButton } from '@/components/fundraisers/update-fundraiser-button';
import { useFundraiserForEdit } from '@/components/fundraisers/use-fundraiser-for-edit';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';

function extractInitialExtraProjects(
  fundraiser: Fundraiser
): SelectedProject[] {
  const workspaceCountry = fundraiser.workspace?.country ?? 'DE';
  const defaultCauseId = getDefaultCauseId(workspaceCountry);

  return fundraiser.projectAllocations
    .filter(allocation => allocation.project.id !== defaultCauseId)
    .map(allocation => ({
      id: allocation.project.id,
      name: allocation.project.name,
      description: allocation.project.description,
      image: allocation.project.image,
    }));
}

function EditFundraiserContent({ fundraiser }: { fundraiser: Fundraiser }) {
  const initialExtraProjects = useMemo(
    () => extractInitialExtraProjects(fundraiser),
    [fundraiser]
  );

  return (
    <EditFundraiserFormProvider fundraiser={fundraiser}>
      <FundraiserFormBody
        mode='edit'
        submitButton={<UpdateFundraiserButton fundraiserId={fundraiser.id} />}
        initialExtraProjects={initialExtraProjects}
        totalRaised={fundraiser.totalRaised}
      />
    </EditFundraiserFormProvider>
  );
}

function EditFundraiserBody({ id }: { id: string }) {
  const t = useTranslations('Fundraisers.edit');
  const state = useFundraiserForEdit(id);

  if (state.status === 'idle' || state.status === 'loading') {
    return <Loader text={t('loading')} />;
  }

  if (state.status === 'not-found') {
    return (
      <div className='flex flex-col items-center justify-center gap-4 min-h-[50vh] text-center'>
        <h1 className='text-2xl font-semibold'>{t('notFoundTitle')}</h1>
        <p className='text-muted-foreground'>{t('notFoundDescription')}</p>
        <Button asChild variant='outline'>
          <Link href='/dashboard'>{t('backToDashboard')}</Link>
        </Button>
      </div>
    );
  }

  if (state.status === 'unauthorized') {
    return (
      <div className='flex flex-col items-center justify-center gap-4 min-h-[50vh] text-center'>
        <h1 className='text-2xl font-semibold'>{t('unauthorizedTitle')}</h1>
        <p className='text-muted-foreground'>{t('unauthorizedDescription')}</p>
        <Button asChild variant='outline'>
          <Link href='/dashboard'>{t('backToDashboard')}</Link>
        </Button>
      </div>
    );
  }

  if (state.status === 'error' || !state.fundraiser) {
    return (
      <div className='flex flex-col items-center justify-center gap-4 min-h-[50vh] text-center'>
        <h1 className='text-2xl font-semibold'>{t('notFoundTitle')}</h1>
        <p className='text-muted-foreground'>
          {state.errorMessage ?? t('notFoundDescription')}
        </p>
        <Button asChild variant='outline'>
          <Link href='/dashboard'>{t('backToDashboard')}</Link>
        </Button>
      </div>
    );
  }

  return <EditFundraiserContent fundraiser={state.fundraiser} />;
}

export default function EditFundraiserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <EditFundraiserBody id={id} />
    </AuthGuard>
  );
}
