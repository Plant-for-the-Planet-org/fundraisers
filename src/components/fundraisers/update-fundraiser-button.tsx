'use client';

import type {
  Fundraiser,
  FundraiserSettings,
  FundraiserStatus,
} from '@/lib/types/fundraiser';
import type { SelectedImage } from '@/lib/types/image-selection';
import type { UpdateDirtyFields } from '@/lib/utils/fundraiser-data-builder';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useState } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  applyFundraiserTransition,
  updateFundraiser,
} from '@/lib/api/fundraiser-service';
import { unsplashClient } from '@/lib/api/unsplash-client';
import { transitionForStatusToggle } from '@/lib/utils/fundraiser';
import { buildUpdateFundraiserRequest } from '@/lib/utils/fundraiser-data-builder';
import { imageToBase64 } from '@/lib/utils/image-processor';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';

/**
 * The submitted values with the status switch put back where the server has it.
 *
 * The switch position comes from `canDonate`, the same way the form derives it on load. Taking it
 * from the response rather than from `values` keeps the switch honest when the status did not move
 * the way the host asked — a failed transition, or a completed fundraiser the switch cannot reopen.
 */
function baselineFor(
  values: FundraiserFormValues,
  saved: Fundraiser
): FundraiserFormValues {
  return { ...values, status: saved.canDonate ? 'active' : 'draft' };
}

interface UpdateFundraiserButtonProps {
  fundraiserId: string;
  existingSettings: FundraiserSettings | null;
  /** The saved status, needed to work out which transition the status switch is asking for. */
  currentStatus: FundraiserStatus;
}

export function UpdateFundraiserButton({
  fundraiserId,
  existingSettings,
  currentStatus,
}: UpdateFundraiserButtonProps) {
  // The prop is a snapshot from page load and the page does not refetch after a save, so the
  // saved status is tracked here and refreshed from every response. Reading the prop instead
  // would misread the second toggle in a session: after switching a live fundraiser off (now
  // `paused`), switching it back on would still map from `active` and ask for no transition.
  const [savedStatus, setSavedStatus] =
    useState<FundraiserStatus>(currentStatus);
  const t = useTranslations('Fundraisers.edit.formSubmission');
  const { control, handleSubmit, reset } =
    useFormContext<FundraiserFormValues>();
  const { isDirty, dirtyFields, defaultValues } = useFormState({
    control,
  });
  const accessToken = useAuthStore(state => state.accessToken);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: FundraiserFormValues) => {
    if (!accessToken || !isDirty) return;

    setIsSubmitting(true);

    try {
      const image = values.image as SelectedImage | null | undefined;
      const baselineImage = defaultValues?.image as
        | SelectedImage
        | null
        | undefined;
      const isImageDirty = Boolean(dirtyFields.image);
      const isSameAsBaseline = Boolean(
        image && baselineImage && image.url === baselineImage.url
      );

      let imageFile: string | undefined;
      if (image && isImageDirty && !isSameAsBaseline) {
        if (image.source === 'unsplash' && image.downloadLocation) {
          try {
            await unsplashClient.trackDownload(image.downloadLocation);
          } catch (downloadError) {
            console.warn('Failed to track Unsplash download:', downloadError);
          }
        }
        imageFile = await imageToBase64(image);
      }

      const request = buildUpdateFundraiserRequest(
        values,
        dirtyFields as UpdateDirtyFields,
        imageFile,
        existingSettings
      );

      // The status is not part of the update payload: it moves through the lifecycle state
      // machine. A switch that was touched but asks for nothing the fundraiser can do (a
      // completed one, say) simply applies no transition.
      const transition = dirtyFields.status
        ? transitionForStatusToggle(savedStatus, values.status)
        : null;

      if (Object.keys(request).length === 0 && !transition) return;

      let updated =
        Object.keys(request).length > 0
          ? await updateFundraiser(fundraiserId, request, accessToken)
          : null;

      if (updated) setSavedStatus(updated.status);

      if (transition) {
        // The transition is a second request, so it can fail on its own after the field edits
        // landed. Reporting that as a failed update would be wrong twice over: the host would not
        // know their edits were saved, and a retry would re-send them.
        try {
          updated = await applyFundraiserTransition(
            fundraiserId,
            transition,
            accessToken
          );
          setSavedStatus(updated.status);
        } catch (transitionError) {
          console.error('Failed to change fundraiser status:', transitionError);
          // Keep whatever the update saved, and put the switch back where the server has it.
          if (updated) reset(baselineFor(values, updated));
          toast.error(t('statusChangeFailedMessage'), {
            description: updated
              ? t('statusChangeFailedWithSavedChanges')
              : t('statusChangeFailedDescription'),
          });
          return;
        }
      }

      if (!updated) return;

      reset(baselineFor(values, updated));

      // The backend appends a suffix when the chosen link collides with an existing one, so the saved slug can differ from what was submitted.
      const slugWasAdjusted =
        Boolean(dirtyFields.slug) && updated.slug !== values.slug;
      toast.success(t('successMessage'), {
        description: slugWasAdjusted
          ? t('slugAdjusted', { slug: updated.slug })
          : undefined,
      });

      // The edit route is keyed by slug. If the slug changed, move to the new
      // URL so a refresh or back-navigation still resolves.
      if (updated.slug && updated.slug !== defaultValues?.slug) {
        router.replace(`/dashboard/fundraisers/edit/${updated.slug}`);
      }

      return updated;
    } catch (err) {
      console.error('Failed to update fundraiser:', err);
      toast.error(t('errorMessage'), { description: t('errorDescription') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      className='bg-blue-500 text-white rounded-lg font-semibold'
      disabled={isSubmitting || !isDirty}
      onClick={handleSubmit(onSubmit, errors =>
        console.error('Update blocked by validation errors:', errors)
      )}
      type='button'
    >
      {isSubmitting && <Loader2 className='animate-spin' />}
      {isSubmitting ? t('buttonProcessing') : t('buttonSubmit')}
    </Button>
  );
}
