'use client';

import type { SelectedImage, UnsplashPhoto } from '@/lib/types/image-selection';
import type { FundraiserFormValues } from '@/components/fundraisers/fundraiser-form-schema';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Image as ImageIcon, RefreshCw, Shuffle } from 'lucide-react';
import { unsplashClient } from '@/lib/api/unsplash-client';
import { DEFAULT_IMAGE_LOAD_CATEGORY_ID } from '@/lib/constants/image-categories';
import { cn } from '@/lib/utils';
import {
  createUnsplashSelectedImage,
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
  // Cached batch of default photos so each shuffle advances through the batch
  // instead of refetching from Unsplash on every click. We only refetch once
  // the batch is exhausted.
  const photoBatchRef = useRef<UnsplashPhoto[]>([]);
  const photoCursorRef = useRef(0);

  const { control, setValue } = useFormContext<FundraiserFormValues>();
  const { defaultValues } = useFormState({ control });

  // Shuffle button is hidden once the form's defaultValues contain a saved image
  // (the server baseline, not the current in-form selection). Auto-load on mount
  // is gated separately via hasAttemptedDefaultLoad.
  const showShuffle = !(
    (defaultValues?.image as SelectedImage | null | undefined) ?? null
  );

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

  const applyNextDefaultPhoto = useCallback(
    async (shouldDirty: boolean) => {
      setIsLoadingDefaultImage(true);
      setDefaultImageError(null);

      try {
        // Refill the batch when it is empty or fully consumed.
        if (photoCursorRef.current >= photoBatchRef.current.length) {
          photoBatchRef.current = await unsplashClient.getCategoryImages(
            DEFAULT_IMAGE_LOAD_CATEGORY_ID,
            20
          );
          if (photoBatchRef.current.length === 0) {
            throw new Error('No images returned from Unsplash');
          }
          photoCursorRef.current = 0;
        }

        const nextPhoto = photoBatchRef.current[photoCursorRef.current];

        if (!nextPhoto) {
          throw new Error('No default image available');
        }

        photoCursorRef.current += 1;
        setSelectedImage(createUnsplashSelectedImage(nextPhoto), shouldDirty);
      } catch (error) {
        console.error('[ImageSelector] applyNextDefaultPhoto failed', error);
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

    void applyNextDefaultPhoto(false);
  }, [
    autoLoadDefault,
    currentImage,
    hasAttemptedDefaultLoad,
    applyNextDefaultPhoto,
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
    void applyNextDefaultPhoto(false);
  }, [applyNextDefaultPhoto]);

  const handleShuffleImage = useCallback(() => {
    void applyNextDefaultPhoto(true);
  }, [applyNextDefaultPhoto]);

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
        <div className='absolute bottom-3 right-3 flex items-center gap-2'>
          {showShuffle && (
            <button
              onClick={handleShuffleImage}
              disabled={isLoadingDefaultImage}
              className='w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 transition-all duration-200 hover:scale-110 flex items-center justify-center disabled:opacity-50 disabled:hover:scale-100'
              aria-label={t('actions.shuffleAria')}
              title={t('actions.shuffleAria')}
              type='button'
            >
              <Shuffle
                className={cn(
                  'h-4 w-4 text-white',
                  isLoadingDefaultImage && 'animate-pulse'
                )}
              />
            </button>
          )}
          <button
            onClick={() => {
              setIsImageOverlayOpen(true);
            }}
            className='w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 transition-all duration-200 hover:scale-110 flex items-center justify-center'
            aria-label={t('actions.changeAria')}
            type='button'
          >
            <ImageIcon className='h-4 w-4 text-white' />
          </button>
        </div>
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
