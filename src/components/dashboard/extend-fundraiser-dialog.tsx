'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';
import type { ExtendFundraiserValues } from './extend-fundraiser-schema';

import { useEffect, useMemo } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { extendFundraiser } from '@/lib/api/fundraiser-service';
import { getEndDateBounds } from '@/lib/constants/fundraiser-creation';
import {
  addDaysToDateInput,
  daysBetweenDateInputs,
  toDateInputValue,
} from '@/lib/utils/date';
import { useAuthStore } from '@/stores/auth-store';
import { EndDateInput } from '@/components/fundraisers/end-date-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createExtendFundraiserSchema } from './extend-fundraiser-schema';

interface ExtendFundraiserDialogProps {
  fundraiser: Fundraiser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFundraiserUpdated: (updatedFundraiser: Fundraiser) => void;
}

export function ExtendFundraiserDialog({
  fundraiser,
  open,
  onOpenChange,
  onFundraiserUpdated,
}: ExtendFundraiserDialogProps) {
  const t = useTranslations('Dashboard.extendDialog');
  const tActions = useTranslations('Dashboard.actions');
  const accessToken = useAuthStore(state => state.accessToken);

  const currentEndDate = toDateInputValue(fundraiser.endDate);

  // Extending a completed fundraiser reactivates it with a new future end date.
  const isReactivating = fundraiser.status === 'completed';

  // Use an empty value when reactivating so the previous end date isn't shown.
  const baseEndDate = isReactivating ? '' : currentEndDate;

  // The new end date must be after the current end date, but never earlier than
  // tomorrow. for an ended fundraiser the current end date is in the past, so
  // the global minimum wins.
  const bounds = useMemo(() => {
    const globalBounds = getEndDateBounds();
    const afterCurrent = currentEndDate
      ? addDaysToDateInput(currentEndDate, 1)
      : globalBounds.min;
    return {
      min: afterCurrent > globalBounds.min ? afterCurrent : globalBounds.min,
      max: globalBounds.max,
    };
  }, [currentEndDate]);

  const methods = useForm<ExtendFundraiserValues>({
    resolver: zodResolver(createExtendFundraiserSchema(bounds)),
    // Pre-fill with the current end date (same normalization as the edit form);
    // blank when reactivating an ended fundraiser.
    defaultValues: { endDate: baseEndDate },
    // Validate on every change so the error clears and `isValid` (and therefore
    // the Save button) updates the instant a valid new date is picked or typed.
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isValid },
  } = methods;

  // Sync the field with the seed value whenever the modal opens.
  useEffect(() => {
    if (open) {
      reset({ endDate: baseEndDate });
    }
  }, [open, baseEndDate, reset]);

  // Disable save until a different valid end date is selected.
  const selectedEndDate = useWatch({ control, name: 'endDate' }) ?? '';
  const isUnchanged = selectedEndDate === baseEndDate;
  const isSaveDisabled = isSubmitting || isUnchanged || !isValid;

  // Show how many days are being added when a valid later date is selected.
  // Not meaningful when reactivating (the old end date is in the past).
  const daysAdded = daysBetweenDateInputs(baseEndDate, selectedEndDate);
  const helperText =
    !isReactivating && isValid && daysAdded > 0
      ? t('daysAdded', { count: daysAdded })
      : undefined;

  const onSubmit = handleSubmit(async values => {
    if (!accessToken) return;

    try {
      const updated = await extendFundraiser(
        fundraiser.id,
        values.endDate,
        accessToken,
        { reactivate: isReactivating }
      );
      toast.success(tActions('extendSuccess'));
      onFundraiserUpdated(updated);
      onOpenChange(false);
    } catch (error) {
      // Keep the modal open so the user can retry.
      console.error('[ExtendFundraiserDialog] extend failed:', error);
      toast.error(tActions('mutationError'));
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        // Don't allow closing mid-request; the button shows a spinner.
        if (isSubmitting) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className='sm:max-w-md' showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={onSubmit} noValidate className='space-y-6'>
            <EndDateInput
              bounds={bounds}
              // Use tomorrow as the minimum date when reactivating.
              currentEndDate={isReactivating ? undefined : currentEndDate}
              helperText={helperText}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type='button' variant='outline' disabled={isSubmitting}>
                  {t('cancel')}
                </Button>
              </DialogClose>
              <Button type='submit' disabled={isSaveDisabled}>
                {isSubmitting && (
                  <Loader2 className='animate-spin' aria-hidden='true' />
                )}
                {t('confirm')}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
