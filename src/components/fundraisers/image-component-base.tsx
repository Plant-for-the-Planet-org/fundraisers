'use client';

import type { ReactNode } from 'react';

import { Target } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ImageComponentBaseProps {
  imageUrl?: string | null;
  alt: string;
  fallback?: ReactNode;
  className?: string;
  imageClassName?: string;
  children?: ReactNode;
}

export function ImageComponentBase({
  imageUrl,
  alt,
  fallback,
  className,
  imageClassName,
  children,
}: ImageComponentBaseProps) {
  return (
    <div
      className={cn(
        'self-stretch h-80 relative bg-white/50 dark:bg-gray-800 rounded-2xl overflow-hidden',
        className
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          className={cn('w-full h-full object-cover', imageClassName)}
        />
      ) : fallback ? (
        fallback
      ) : (
        <div className='w-full h-full flex items-center justify-center'>
          <Target className='w-16 h-16 text-gray-400' />
        </div>
      )}
      {children}
    </div>
  );
}
