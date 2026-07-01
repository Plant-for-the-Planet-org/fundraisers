'use client';

import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateFundraiserSubmit } from './preview/use-create-fundraiser-submit';

interface CreateFundraiserButtonProps {
  /** Overrides the default "Create Fundraiser" label (e.g. dialog Save button). */
  label?: string;
}

export function CreateFundraiserButton({ label }: CreateFundraiserButtonProps) {
  const t = useTranslations('Fundraisers.create.formSubmission');
  const { submit, isSubmitting } = useCreateFundraiserSubmit();

  return (
    <Button
      className='bg-blue-500 text-white rounded-lg font-semibold'
      disabled={isSubmitting}
      onClick={submit}
      type='button'
    >
      {isSubmitting && <Loader2 className='animate-spin' />}
      {isSubmitting ? t('buttonProcessing') : (label ?? t('buttonSubmit'))}
    </Button>
  );
}
