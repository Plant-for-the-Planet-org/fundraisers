'use client';

import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { unsplashClient } from '@/lib/api/unsplash-client';
import {
  DEFAULT_IMAGE_CATEGORY_ID,
  getVisibleImageCategories,
} from '@/lib/constants/image-categories';
import type { SelectedImage, UnsplashPhoto } from '@/lib/types/image-selection';
import { cn } from '@/lib/utils/cn';
import {
  MAX_IMAGE_FILE_SIZE_MB,
  createUnsplashSelectedImage,
  createUploadedSelectedImage,
  validateImageFile,
} from '@/lib/utils/image-selection';

interface ImageSelectionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (image: SelectedImage) => void;
}

export function ImageSelectionOverlay({
  isOpen,
  onClose,
  onImageSelect,
}: ImageSelectionOverlayProps) {
  const t = useTranslations('Fundraisers.create.image');

  const categories = useMemo(() => getVisibleImageCategories(), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    categories[0]?.id ?? DEFAULT_IMAGE_CATEGORY_ID
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const [images, setImages] = useState<UnsplashPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const loadCategoryImages = useCallback(
    async (categoryId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const photos = await unsplashClient.getCategoryImages(categoryId, 20);
        setImages(photos);
      } catch {
        setError(t('states.loadError'));
        setImages([]);
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  const loadSearchImages = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        await loadCategoryImages(selectedCategory);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await unsplashClient.searchPhotos(query, 1, 20);
        setImages(result.results);
      } catch {
        setError(t('states.loadError'));
        setImages([]);
      } finally {
        setIsLoading(false);
      }
    },
    [loadCategoryImages, selectedCategory, t]
  );

  const getUploadErrorMessage = useCallback(
    (code: 'FILE_TOO_LARGE' | 'INVALID_FILE_TYPE' | 'EMPTY_FILE'): string => {
      if (code === 'FILE_TOO_LARGE') {
        return t('errors.fileTooLarge', {
          maxMb: `${MAX_IMAGE_FILE_SIZE_MB}`,
        });
      }

      if (code === 'EMPTY_FILE') {
        return t('errors.emptyFile');
      }

      return t('errors.invalidFileType');
    },
    [t]
  );

  const handleFileUpload = useCallback(
    (file: File) => {
      const validationResult = validateImageFile(file);

      if (!validationResult.isValid && validationResult.error) {
        setError(getUploadErrorMessage(validationResult.error.code));
        return;
      }

      const selectedImage = createUploadedSelectedImage(file);
      onImageSelect(selectedImage);
      onClose();
    },
    [getUploadErrorMessage, onClose, onImageSelect]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);

      const files = Array.from(event.dataTransfer.files);
      const imageFile = files.find(file => file.type.startsWith('image/'));

      if (imageFile) {
        handleFileUpload(imageFile);
      }
    },
    [handleFileUpload]
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (file) {
        handleFileUpload(file);
      }

      event.currentTarget.value = '';
    },
    [handleFileUpload]
  );

  const handleImageSelect = useCallback(
    (photo: UnsplashPhoto) => {
      const selectedImage = createUnsplashSelectedImage(photo);
      onImageSelect(selectedImage);
      onClose();
    },
    [onClose, onImageSelect]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (categories.length === 0) {
      return;
    }

    const categoryExists = categories.some(
      category => category.id === selectedCategory
    );

    if (!categoryExists) {
      setSelectedCategory(categories[0]?.id ?? DEFAULT_IMAGE_CATEGORY_ID);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeoutId = setTimeout(
      () => {
        if (searchQuery.trim()) {
          void loadSearchImages(searchQuery);
          return;
        }

        void loadCategoryImages(selectedCategory);
      },
      searchQuery.trim() ? 300 : 0
    );

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    isOpen,
    loadCategoryImages,
    loadSearchImages,
    searchQuery,
    selectedCategory,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) {
    return null;
  }

  return createPortal(
    <div
      className='fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4'
      onClick={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className='w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-gray-200/60 bg-white dark:bg-zinc-900 dark:border-zinc-700 animate-in fade-in-0 zoom-in-95 duration-200'>
        <div className='px-4 pt-4 pb-2 border-b border-gray-100 dark:border-zinc-700'>
          <div className='flex items-center justify-between gap-4'>
            <h2 className='text-xl font-semibold text-zinc-900 dark:text-zinc-100'>
              {t('overlay.title')}
            </h2>
            <button
              onClick={onClose}
              className='p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800'
              aria-label={t('actions.closeAria')}
            >
              <X className='w-5 h-5 text-gray-500 dark:text-zinc-400' />
            </button>
          </div>
        </div>

        <div className='max-h-[70vh] overflow-y-auto p-4 space-y-4'>
          <div
            className={cn(
              'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
              isDragOver
                ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-zinc-700 dark:hover:border-zinc-500'
            )}
            onDragOver={event => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={event => {
              event.preventDefault();
              setIsDragOver(false);
            }}
            onDrop={handleDrop}
          >
            <input
              type='file'
              accept='image/*'
              onChange={handleFileSelect}
              className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
              aria-label={t('overlay.uploadInputAria')}
            />
            <div className='space-y-2'>
              <div className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
                {t('overlay.uploadTitle')}
              </div>
              <div className='text-xs text-gray-500 dark:text-zinc-400'>
                {t('overlay.uploadSubtitle')}{' '}
                <a
                  href='https://unsplash.com/?utm_source=plant-for-the-planet&utm_medium=referral'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-600 hover:text-blue-800 underline dark:text-blue-400 dark:hover:text-blue-300'
                >
                  {t('attribution.unsplashLink')}
                </a>
              </div>
            </div>
          </div>

          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500' />
            <input
              type='text'
              placeholder={t('overlay.searchPlaceholder')}
              value={searchQuery}
              onChange={event => {
                setSearchQuery(event.target.value);
              }}
              className='w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-10 pr-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
              autoFocus
            />
          </div>

          <div className='flex flex-col sm:grid sm:grid-cols-4 gap-4'>
            <div className='sm:col-span-1 min-w-[150px]'>
              <div className='flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible'>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSearchQuery('');
                    }}
                    className={cn(
                      'flex-shrink-0 sm:w-full text-left px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap',
                      selectedCategory === category.id
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-medium'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    )}
                  >
                    {t(`categories.${category.id}` as never)}
                  </button>
                ))}
              </div>
            </div>

            <div className='sm:col-span-3'>
              {error && (
                <div className='text-center py-8'>
                  <div className='w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3'>
                    <X className='w-6 h-6 text-red-600 dark:text-red-300' />
                  </div>
                  <h3 className='font-medium text-zinc-900 dark:text-zinc-100 mb-1'>
                    {t('states.errorTitle')}
                  </h3>
                  <p className='text-sm text-zinc-600 dark:text-zinc-400 mb-3'>
                    {error}
                  </p>
                  <button
                    onClick={() => {
                      if (searchQuery.trim()) {
                        void loadSearchImages(searchQuery);
                      } else {
                        void loadCategoryImages(selectedCategory);
                      }
                    }}
                    className='px-3 py-2 text-sm rounded-md border border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/20'
                  >
                    {t('actions.tryAgain')}
                  </button>
                </div>
              )}

              {isLoading && (
                <div className='text-center py-8'>
                  <div className='w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3' />
                  <p className='text-sm text-zinc-600 dark:text-zinc-400'>
                    {t('states.loading')}
                  </p>
                </div>
              )}

              {!isLoading && !error && images.length === 0 && (
                <div className='text-center py-8'>
                  <div className='w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3'>
                    <Search className='w-6 h-6 text-gray-400 dark:text-zinc-500' />
                  </div>
                  <h3 className='font-medium text-zinc-900 dark:text-zinc-100 mb-1'>
                    {t('states.noResultsTitle')}
                  </h3>
                  <p className='text-sm text-zinc-600 dark:text-zinc-400'>
                    {searchQuery.trim()
                      ? t('states.noResultsWithQuery', { query: searchQuery })
                      : t('states.noResultsDescription')}
                  </p>
                </div>
              )}

              {!isLoading && !error && images.length > 0 && (
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                  {images.map(photo => (
                    <div key={photo.id} className='relative group'>
                      <button
                        onClick={() => {
                          handleImageSelect(photo);
                        }}
                        className='relative block w-full aspect-square bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg'
                        aria-label={t('actions.selectImageAria')}
                      >
                        <img
                          src={photo.urls.small}
                          alt={photo.altDescription ?? t('previewAlt')}
                          className='w-full h-full object-cover'
                          loading='lazy'
                        />
                        <div className='absolute inset-0 border-2 border-transparent group-hover:border-green-500 rounded-lg transition-colors' />
                      </button>

                      <div className='absolute inset-0 bg-black/50 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg'>
                        <div className='text-white text-xs pointer-events-auto'>
                          {t('attribution.photoBy')}{' '}
                          <a
                            href={`${photo.user.links.html}?utm_source=plant-for-the-planet&utm_medium=referral`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='underline hover:no-underline'
                            onClick={event => {
                              event.stopPropagation();
                            }}
                          >
                            {photo.user.name}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
