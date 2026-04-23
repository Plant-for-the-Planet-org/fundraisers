'use client';

import type { SelectedImage } from '@/lib/types/image-selection';
import type { CreateFundraiserFormValues } from '@/components/fundraisers/create-fundraiser-form-context';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createFundraiser } from '@/lib/api/create-fundraiser-service';
import { unsplashClient } from '@/lib/api/unsplash-client';
import { buildCreateFundraiserRequest } from '@/lib/utils/fundraiser-data-builder';
import { imageToBase64 } from '@/lib/utils/image-processor';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';

export function CreateFundraiserButton() {
  const t = useTranslations('Fundraisers.create.formSubmission');
  const { handleSubmit } = useFormContext<CreateFundraiserFormValues>();
  const accessToken = useAuthStore(state => state.accessToken);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: CreateFundraiserFormValues) => {
    if (!accessToken) return;

    setIsSubmitting(true);

    try {
      const image = values.image as SelectedImage | undefined;

      if (image?.source === 'unsplash' && image.downloadLocation) {
        try {
          await unsplashClient.trackDownload(image.downloadLocation);
        } catch (downloadError) {
          console.warn('Failed to track Unsplash download:', downloadError);
        }
      }

      let imageFile: string | undefined;
      if (image) {
        imageFile = await imageToBase64(image);
      }

      const request = buildCreateFundraiserRequest(values, imageFile);
      const fundraiser = await createFundraiser(request, accessToken);
      if (!fundraiser.slug) {
        throw new Error('Invalid response from server - missing slug');
      }
      toast.success(t('successMessage'));
      router.replace(`/fundraisers/${fundraiser.slug}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create fundraiser';
      toast.error(t('errorMessage'), { description: message });
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      className='bg-blue-500 text-white rounded-lg font-semibold'
      disabled={isSubmitting}
      onClick={handleSubmit(onSubmit)}
      type='button'
    >
      {isSubmitting && <Loader2 className='animate-spin' />}
      {isSubmitting ? t('buttonProcessing') : t('buttonSubmit')}
    </Button>
  );
}
