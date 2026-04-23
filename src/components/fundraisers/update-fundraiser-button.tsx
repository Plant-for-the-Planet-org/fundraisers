'use client';

import type { SelectedImage } from '@/lib/types/image-selection';
import type { UpdateDirtyFields } from '@/lib/utils/fundraiser-data-builder';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useState } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateFundraiser } from '@/lib/api/fundraiser-service';
import { unsplashClient } from '@/lib/api/unsplash-client';
import { buildUpdateFundraiserRequest } from '@/lib/utils/fundraiser-data-builder';
import { imageToBase64 } from '@/lib/utils/image-processor';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';

interface UpdateFundraiserButtonProps {
  fundraiserId: string;
}

export function UpdateFundraiserButton({
  fundraiserId,
}: UpdateFundraiserButtonProps) {
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
        imageFile
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
      const message =
        err instanceof Error ? err.message : 'Failed to update fundraiser';
      toast.error(t('errorMessage'), { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      className='bg-blue-500 text-white rounded-lg font-semibold'
      disabled={isSubmitting || !isDirty}
      onClick={handleSubmit(onSubmit)}
      type='button'
    >
      {isSubmitting && <Loader2 className='animate-spin' />}
      {isSubmitting ? t('buttonProcessing') : t('buttonSubmit')}
    </Button>
  );
}
