'use client';

import type { ChangeEvent, DragEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { unsplashClient } from '@/lib/api/unsplash-client';
import type { UnsplashPhoto } from '@/lib/api/unsplash-service';
import { getVisibleImageCategories } from '@/lib/constants/image-categories';
import type { SelectedImage } from '@/lib/types/image-selection';
import {
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

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('outdoors');
  const [isDragOver, setIsDragOver] = useState(false);
  const [images, setImages] = useState<UnsplashPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const categories = useMemo(() => getVisibleImageCategories(), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadCategoryImages = useCallback(
    async (categoryId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const photos = await unsplashClient.getCategoryImages(categoryId, 20);
        setImages(photos);
      } catch {
        setError(t('states.loadError.message'));
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
        loadCategoryImages(selectedCategory);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await unsplashClient.searchPhotos(query, 1, 20);
        setImages(result.results);
      } catch {
        setError(t('states.searchError.message'));
        setImages([]);
      } finally {
        setIsLoading(false);
      }
    },
    [loadCategoryImages, selectedCategory, t]
  );

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      setSelectedCategory(categoryId);
      setSearchQuery('');
      loadCategoryImages(categoryId);
    },
    [loadCategoryImages]
  );

  const handleFileUpload = useCallback(
    (file: File) => {
      setUploadError(null);

      const validation = validateImageFile(file);
      if (!validation.isValid) {
        const code = validation.error?.code;
        if (code === 'FILE_TOO_LARGE') {
          setUploadError(t('upload.errors.fileTooLarge'));
        } else {
          setUploadError(t('upload.errors.invalidType'));
        }
        return;
      }

      const selectedImage = createUploadedSelectedImage(file);
      onImageSelect(selectedImage);
      onClose();
    },
    [onClose, onImageSelect, t]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = Array.from(e.dataTransfer.files)[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
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
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeoutId = setTimeout(
      () => {
        if (searchQuery.trim()) {
          loadSearchImages(searchQuery);
        } else {
          loadCategoryImages(selectedCategory);
        }
      },
      searchQuery.trim() ? 300 : 0
    );

    return () => clearTimeout(timeoutId);
  }, [
    isOpen,
    loadCategoryImages,
    loadSearchImages,
    searchQuery,
    selectedCategory,
  ]);

  const overlayContent = useMemo(() => {
    if (!isOpen) {
      return null;
    }

    return (
      <div
        className='fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-start justify-center pt-[10vh]'
        role='dialog'
        aria-modal='true'
        aria-label={t('overlay.ariaLabel')}
      >
        <div className='w-full max-w-4xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-800 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200'>
          <div className='px-4 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800'>
            <div className='flex items-center justify-between gap-4'>
              <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-50'>
                {t('overlay.title')}
              </h2>
              <button
                type='button'
                onClick={onClose}
                className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors'
                aria-label={t('overlay.close')}
              >
                <X className='w-5 h-5 text-gray-500 dark:text-gray-400' />
              </button>
            </div>
          </div>

          <div className='max-h-[70vh] overflow-y-auto'>
            <div className='p-4 space-y-4'>
              <div
                className={cn(
                  'relative border-2 border-dashed rounded-xl p-6 text-center transition-colors',
                  isDragOver
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleFileSelect}
                  className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                  aria-label={t('upload.ariaLabel')}
                />
                <div className='space-y-2'>
                  <div className='text-sm font-medium text-gray-900 dark:text-gray-50'>
                    {t('upload.title')}
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                    {t('upload.subtitle')}{' '}
                    <a
                      href='https://unsplash.com/?utm_source=plant-for-the-planet&utm_medium=referral'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='underline underline-offset-2 hover:no-underline'
                    >
                      {t('upload.unsplash')}
                    </a>
                  </div>

                  {uploadError && (
                    <p className='text-xs text-red-600 dark:text-red-400'>
                      {uploadError}
                    </p>
                  )}
                </div>
              </div>

              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                <input
                  type='text'
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='w-full h-10 pl-10 pr-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 placeholder:text-gray-400 outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
                  autoFocus
                  aria-label={t('search.ariaLabel')}
                />
              </div>

              <div className='flex flex-col sm:grid sm:grid-cols-4 gap-4'>
                <div className='sm:col-span-1 min-w-[150px]'>
                  <div className='flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible'>
                    {categories.map(category => (
                      <button
                        key={category.id}
                        type='button'
                        onClick={() => handleCategorySelect(category.id)}
                        className={cn(
                          'flex-shrink-0 sm:w-full text-left px-3 py-2 rounded-xl text-sm transition-colors whitespace-nowrap',
                          selectedCategory === category.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
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
                      <h3 className='font-medium text-gray-900 dark:text-gray-50 mb-1'>
                        {t('states.loadError.title')}
                      </h3>
                      <p className='text-sm text-gray-600 dark:text-gray-300 mb-4'>
                        {error}
                      </p>
                      <button
                        type='button'
                        onClick={() =>
                          searchQuery.trim()
                            ? loadSearchImages(searchQuery)
                            : loadCategoryImages(selectedCategory)
                        }
                        className='h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm'
                      >
                        {t('states.loadError.retry')}
                      </button>
                    </div>
                  )}

                  {isLoading && (
                    <div className='text-center py-8'>
                      <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3' />
                      <p className='text-sm text-gray-600 dark:text-gray-300'>
                        {t('states.loading')}
                      </p>
                    </div>
                  )}

                  {!isLoading && !error && images.length === 0 && (
                    <div className='text-center py-8'>
                      <h3 className='font-medium text-gray-900 dark:text-gray-50 mb-1'>
                        {t('states.empty.title')}
                      </h3>
                      <p className='text-sm text-gray-600 dark:text-gray-300'>
                        {searchQuery.trim()
                          ? t('states.empty.search', { query: searchQuery })
                          : t('states.empty.category')}
                      </p>
                    </div>
                  )}

                  {!isLoading && !error && images.length > 0 && (
                    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                      {images.map(photo => (
                        <div key={photo.id} className='relative group'>
                          <button
                            type='button'
                            onClick={() => handleImageSelect(photo)}
                            className='relative aspect-square w-full bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
                            aria-label={t('grid.selectImage')}
                          >
                            <img
                              src={photo.urls.small}
                              alt={
                                photo.altDescription ||
                                t('grid.photoAlt', {
                                  photographer: photo.user.name,
                                })
                              }
                              className='w-full h-full object-cover'
                              loading='lazy'
                            />
                            <span className='absolute inset-0 border-2 border-transparent group-hover:border-primary rounded-xl transition-colors' />
                          </button>

                          <div className='absolute inset-0 bg-black/50 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl'>
                            <div className='text-white text-[11px] pointer-events-auto'>
                              {t('grid.attributionPrefix')}{' '}
                              <a
                                href={`${photo.user.links.html}?utm_source=plant-for-the-planet&utm_medium=referral`}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='underline underline-offset-2 hover:no-underline'
                                onClick={e => e.stopPropagation()}
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
        </div>
      </div>
    );
  }, [
    categories,
    error,
    handleCategorySelect,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileSelect,
    handleImageSelect,
    isDragOver,
    images,
    isLoading,
    isOpen,
    loadCategoryImages,
    loadSearchImages,
    onClose,
    searchQuery,
    selectedCategory,
    t,
    uploadError,
  ]);

  if (!mounted) {
    return null;
  }

  return overlayContent ? createPortal(overlayContent, document.body) : null;
}
