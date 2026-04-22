'use client';

import type { SelectedImage } from '@/lib/types/image-selection';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Image as ImageIcon, RefreshCw } from 'lucide-react';
import { unsplashClient } from '@/lib/api/unsplash-client';
import { DEFAULT_IMAGE_LOAD_CATEGORY_ID } from '@/lib/constants/image-categories';
import { cn } from '@/lib/utils';
import {
  createUnsplashSelectedImage,
  pickRandomPhoto,
  revokeSelectedImageObjectUrl,
} from '@/lib/utils/image-selection';
import { ImageComponentBase } from '@/components/fundraisers/image-component-base';
import { ImageSelectionOverlay } from '@/components/fundraisers/image-selection-overlay';

interface ImageSelectorProps {
  autoLoadDefault?: boolean;
}

export function ImageSelector({
  autoLoadDefault = true,
}: ImageSelectorProps = {}) {
  const t = useTranslations('Fundraisers.form.image');

  const [isImageOverlayOpen, setIsImageOverlayOpen] = useState(false);
  const [isLoadingDefaultImage, setIsLoadingDefaultImage] = useState(false);
  const [defaultImageError, setDefaultImageError] = useState<string | null>(
    null
  );
  const [hasAttemptedDefaultLoad, setHasAttemptedDefaultLoad] = useState(false);

  const latestImageRef = useRef<SelectedImage | null>(null);

  const { control, setValue } = useFormContext<FundraiserFormValues>();

  const currentImage =
    (useWatch({ control, name: 'image' }) as
      | SelectedImage
      | null
      | undefined) ?? null;

  const setSelectedImage = useCallback(
    (nextImage: SelectedImage | null, shouldDirty: boolean) => {
      const previousImage = latestImageRef.current;

      if (previousImage !== nextImage) {
        revokeSelectedImageObjectUrl(previousImage);
      }

      setValue('image', nextImage, {
        shouldDirty,
        shouldTouch: shouldDirty,
      });

      latestImageRef.current = nextImage;
    },
    [setValue]
  );

  const loadDefaultImage = useCallback(
    async (force: boolean = false) => {
      if (!force && latestImageRef.current) {
        return;
      }

      setIsLoadingDefaultImage(true);
      setDefaultImageError(null);

      try {
        const photos = await unsplashClient.getCategoryImages(
          DEFAULT_IMAGE_LOAD_CATEGORY_ID,
          20
        );
        const randomPhoto = pickRandomPhoto(photos);

        if (!randomPhoto) {
          throw new Error('No default image available');
        }

        const defaultImage = createUnsplashSelectedImage(randomPhoto);
        setSelectedImage(defaultImage, false);
      } catch {
        setDefaultImageError(t('states.defaultError'));
      } finally {
        setIsLoadingDefaultImage(false);
        setHasAttemptedDefaultLoad(true);
      }
    },
    [setSelectedImage, t]
  );

  useEffect(() => {
    latestImageRef.current = currentImage;
  }, [currentImage]);

  useEffect(() => {
    if (!autoLoadDefault || currentImage || hasAttemptedDefaultLoad) {
      return;
    }

    void loadDefaultImage();
  }, [
    autoLoadDefault,
    currentImage,
    hasAttemptedDefaultLoad,
    loadDefaultImage,
  ]);

  useEffect(() => {
    return () => {
      revokeSelectedImageObjectUrl(latestImageRef.current);
    };
  }, []);

  const handleImageSelect = useCallback(
    (selectedImage: SelectedImage) => {
      setSelectedImage(selectedImage, true);
    },
    [setSelectedImage]
  );

  const handleRetryDefaultImage = useCallback(() => {
    void loadDefaultImage(true);
  }, [loadDefaultImage]);

  const baseClassName =
    'w-full h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400';

  const fallbackContent = defaultImageError ? (
    <div className={cn(baseClassName, 'px-4')}>
      <ImageIcon className='w-16 h-16 mb-4' />
      <p className='text-sm font-medium mb-2'>{t('states.errorTitle')}</p>
      <p className='text-xs text-center mb-4'>{defaultImageError}</p>
      <button
        className='inline-flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
        onClick={handleRetryDefaultImage}
        type='button'
        aria-label={t('actions.retry')}
      >
        <RefreshCw className='w-4 h-4' />
        {t('actions.retry')}
      </button>
    </div>
  ) : (
    <div className={baseClassName}>
      {isLoadingDefaultImage && (
        <RefreshCw className='w-8 h-8 mb-4 animate-spin' />
      )}
      <p className='text-sm font-medium'>{t('states.loadingDefault')}</p>
    </div>
  );

  return (
    <>
      <ImageComponentBase
        imageUrl={currentImage?.url}
        alt={t('previewAlt')}
        fallback={fallbackContent}
      >
        <button
          onClick={() => {
            setIsImageOverlayOpen(true);
          }}
          className='absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 transition-all duration-200 hover:scale-110 flex items-center justify-center'
          aria-label={t('actions.changeAria')}
          type='button'
        >
          <ImageIcon className='h-4 w-4 text-white' />
        </button>
      </ImageComponentBase>

      <ImageSelectionOverlay
        isOpen={isImageOverlayOpen}
        onClose={() => {
          setIsImageOverlayOpen(false);
        }}
        onImageSelect={handleImageSelect}
      />
    </>
  );
}
