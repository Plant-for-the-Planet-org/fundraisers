'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImageIcon, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';

import type { CreateFundraiserFormValues } from './create-fundraiser-form-context';
import { ImageSelectionOverlay } from './image-selection-overlay';
import { unsplashClient } from '@/lib/api/unsplash-client';
import {
  createUnsplashSelectedImage,
  pickRandomPhoto,
  revokeSelectedImageObjectUrl,
} from '@/lib/utils/image-selection';

export function ImageSelector() {
  const t = useTranslations('Fundraisers.create.image');
  const { setValue, watch } = useFormContext<CreateFundraiserFormValues>();

  const image = watch('image');

  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [defaultError, setDefaultError] = useState<string | null>(null);

  const previousImageRef = useRef(image);

  const loadDefaultImage = useCallback(async () => {
    setDefaultError(null);

    try {
      const photos = await unsplashClient.getCategoryImages('nature', 20);
      const photo = pickRandomPhoto(photos);
      if (!photo) {
        throw new Error('NO_DEFAULT_IMAGE');
      }

      setValue('image', createUnsplashSelectedImage(photo), {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    } catch {
      setDefaultError(t('states.defaultLoadError.message'));
    }
  }, [setValue, t]);

  useEffect(() => {
    if (!image) {
      void loadDefaultImage();
    }
  }, [image, loadDefaultImage]);

  useEffect(() => {
    const previousImage = previousImageRef.current ?? null;
    if (previousImage && previousImage !== image) {
      revokeSelectedImageObjectUrl(previousImage);
    }
    previousImageRef.current = image;
  }, [image]);

  useEffect(() => {
    return () => {
      revokeSelectedImageObjectUrl(previousImageRef.current ?? null);
    };
  }, []);

  return (
    <div className='self-stretch h-80 relative bg-white/50 dark:bg-gray-800 rounded-2xl overflow-hidden'>
      {image ? (
        <img
          className='w-full h-full object-cover'
          src={image.url}
          alt={t('preview.alt')}
        />
      ) : defaultError ? (
        <div className='w-full h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 px-6'>
          <ImageIcon className='w-16 h-16 mb-4' />
          <p className='text-sm font-medium mb-2'>
            {t('states.defaultLoadError.title')}
          </p>
          <p className='text-xs text-center mb-4'>{defaultError}</p>
          <button
            type='button'
            onClick={loadDefaultImage}
            className='h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm flex items-center gap-2'
          >
            <RefreshCw className='w-4 h-4' />
            {t('states.defaultLoadError.retry')}
          </button>
        </div>
      ) : (
        <div className='w-full h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400'>
          <RefreshCw className='w-8 h-8 mb-4 animate-spin' />
          <p className='text-sm font-medium'>{t('states.defaultLoading')}</p>
        </div>
      )}

      <button
        type='button'
        onClick={() => setIsOverlayOpen(true)}
        className='absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 transition-all duration-200 hover:scale-110 flex items-center justify-center'
        aria-label={t('preview.change')}
      >
        <ImageIcon className='h-4 w-4 text-white' />
      </button>

      <ImageSelectionOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        onImageSelect={selected => {
          setValue('image', selected, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });
        }}
      />
    </div>
  );
}
