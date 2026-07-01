'use client';

import type { FundraiserSettings } from '@/lib/types/fundraiser';

import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpdateFundraiserSubmit } from './preview/use-update-fundraiser-submit';

interface UpdateFundraiserButtonProps {
  fundraiserId: string;
  existingSettings: FundraiserSettings | null;
  /** Overrides the default "Update fundraiser" label (e.g. dialog Save button). */
  label?: string;
}

export function UpdateFundraiserButton({
  fundraiserId,
  existingSettings,
  label,
}: UpdateFundraiserButtonProps) {
  const t = useTranslations('Fundraisers.edit.formSubmission');
  const { submit, isSubmitting, isDirty } = useUpdateFundraiserSubmit({
    fundraiserId,
    existingSettings,
  });

  return (
    <Button
      className='bg-blue-500 text-white rounded-lg font-semibold'
      disabled={isSubmitting || !isDirty}
      onClick={submit}
      type='button'
    >
      {isSubmitting && <Loader2 className='animate-spin' />}
      {isSubmitting ? t('buttonProcessing') : (label ?? t('buttonSubmit'))}
    </Button>
  );
}
