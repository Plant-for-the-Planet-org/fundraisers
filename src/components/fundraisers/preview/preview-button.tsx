'use client';

import type {
  FundraiserHost,
  FundraiserSettings,
} from '@/lib/types/fundraiser';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateFundraiserButton } from '../create-fundraiser-button';
import { UpdateFundraiserButton } from '../update-fundraiser-button';
import { PreviewDialog } from './preview-dialog';

interface PreviewButtonProps {
  mode: 'create' | 'edit';
  /** Required in edit mode to wire the dialog's Save button. */
  fundraiserId?: string;
  existingSettings?: FundraiserSettings | null;
  /** Real hosts (edit mode) shown in the preview's "Hosted by" section. */
  hosts?: FundraiserHost[];
}

export function PreviewButton({
  mode,
  fundraiserId,
  existingSettings,
  hosts,
}: PreviewButtonProps) {
  const t = useTranslations('Fundraisers');
  const {
    trigger,
    formState: { isValid },
  } = useFormContext<FundraiserFormValues>();
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = async () => {
    if (await trigger()) setIsOpen(true);
  };

  const saveButton =
    mode === 'edit' && fundraiserId ? (
      <UpdateFundraiserButton
        fundraiserId={fundraiserId}
        existingSettings={existingSettings ?? null}
        label={t('preview.saveUpdate')}
      />
    ) : (
      <CreateFundraiserButton label={t('preview.saveCreate')} />
    );

  return (
    <>
      <Button
        type='button'
        variant='outline'
        disabled={!isValid}
        onClick={handleClick}
      >
        <Eye />
        {t('preview.button')}
      </Button>
      {isOpen && (
        <PreviewDialog
          onClose={() => setIsOpen(false)}
          mode={mode}
          existingHosts={hosts}
          saveButton={saveButton}
        />
      )}
    </>
  );
}
