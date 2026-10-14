'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUnsavedChangesWarning } from '@/lib/hooks/use-unsaved-changes-warning';
import {
  fundraiserFormSchema,
  fundraiserToFormValues,
} from '@/components/fundraisers/fundraiser-form-schema';
import { UpdateFundraiserButton } from '@/components/fundraisers/update-fundraiser-button';
import { Card } from '@/components/ui/card';
import { StageSection } from '@/modules/stage';

/**
 * Stage Mode's settings on their own page: the same switch and slides as in the editor, saved with one button.
 * It holds the whole fundraiser form behind the scenes, so a save sends only what changed, and only Stage Mode can change here.
 */
export function StageEditor({
  fundraiser,
  onSaved,
}: {
  fundraiser: Fundraiser;
  onSaved: () => void;
}) {
  const defaultValues = useMemo(
    () => fundraiserToFormValues(fundraiser),
    [fundraiser]
  );
  const methods = useForm<FundraiserFormValues>({
    resolver: zodResolver(fundraiserFormSchema),
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    methods.register('image');
    methods.register('currency');
    methods.register('projectAllocations');
  }, [methods]);

  useUnsavedChangesWarning(methods.formState.isDirty);

  return (
    <FormProvider {...methods}>
      <Card className='gap-5 border-border/60 px-6 py-5 shadow-xs'>
        <StageSection />
        <div className='flex justify-end'>
          <UpdateFundraiserButton
            fundraiserId={fundraiser.id}
            existingSettings={fundraiser.settings}
            currentStatus={fundraiser.status}
            onSaved={onSaved}
          />
        </div>
      </Card>
    </FormProvider>
  );
}
