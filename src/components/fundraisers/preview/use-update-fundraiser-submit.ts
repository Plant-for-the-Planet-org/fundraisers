'use client';

import type { FundraiserSettings } from '@/lib/types/fundraiser';
import type { SelectedImage } from '@/lib/types/image-selection';
import type { UpdateDirtyFields } from '@/lib/utils/fundraiser-data-builder';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useState } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { updateFundraiser } from '@/lib/api/fundraiser-service';
import { unsplashClient } from '@/lib/api/unsplash-client';
import { buildUpdateFundraiserRequest } from '@/lib/utils/fundraiser-data-builder';
import { imageToBase64 } from '@/lib/utils/image-processor';
import { useAuthStore } from '@/stores/auth-store';

interface UseUpdateFundraiserSubmitArgs {
  fundraiserId: string;
  existingSettings: FundraiserSettings | null;
}

/**
 * Shared update-fundraiser submit logic, consumed by both the primary CTA
 * (`UpdateFundraiserButton`) and the preview dialog's Save button. `submit` is
 * a ready `onClick` handler; `isDirty` lets callers gate the button.
 */
export function useUpdateFundraiserSubmit({
  fundraiserId,
  existingSettings,
}: UseUpdateFundraiserSubmitArgs) {
  const t = useTranslations('Fundraisers.edit.formSubmission');
  const { control, handleSubmit, reset } =
    useFormContext<FundraiserFormValues>();
  const { isDirty, dirtyFields, defaultValues } = useFormState({ control });
  const accessToken = useAuthStore(state => state.accessToken);
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

      if (Object.keys(request).length === 0) return;

      const updated = await updateFundraiser(
        fundraiserId,
        request,
        accessToken
      );

      reset(values);
      toast.success(t('successMessage'));
      return updated;
    } catch (err) {
      console.error('Failed to update fundraiser:', err);
      toast.error(t('errorMessage'), { description: t('errorDescription') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submit: handleSubmit(onSubmit, errors =>
      console.error('Update blocked by validation errors:', errors)
    ),
    isSubmitting,
    isDirty,
  };
}
