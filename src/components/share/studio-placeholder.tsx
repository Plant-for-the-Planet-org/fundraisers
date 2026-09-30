'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { previewFitProps } from './preview-fit';
import { useCanShareFiles } from './use-can-share-files';

/**
 * About the donor studio's size and layout, so nothing jumps when it mounts. Kept apart from the studio so a page can show it without loading the studio.
 * Like the studio, it starts on a story where the share sheet takes files and on a post elsewhere. `fitHeight` is the studio's.
 */
export function StudioPlaceholder({ fitHeight }: { fitHeight?: string }) {
  const shareFiles = useCanShareFiles();
  const story = shareFiles !== false;
  return (
    <div className='@container' aria-hidden='true'>
      <div className='flex flex-col gap-4 @2xl:grid @2xl:grid-cols-[minmax(0,1fr)_20rem] @2xl:items-start @2xl:gap-x-8'>
        <div className='@container grid gap-4'>
          <Skeleton className='h-9' />
          <div className='grid grid-cols-2 gap-2 @sm:grid-cols-3'>
            <Skeleton className='h-22 rounded-lg' />
            <Skeleton className='h-22 rounded-lg' />
            <Skeleton className='h-22 rounded-lg' />
          </div>
        </div>
        <div className='flex flex-col items-center gap-3'>
          {story && <Skeleton className='h-9 w-40' />}
          <div {...previewFitProps(fitHeight, story ? 9 / 16 : 4 / 5)}>
            <Skeleton
              className={cn(
                'w-full max-w-[17rem] rounded-[1.75rem]',
                story ? 'aspect-[9/16]' : 'aspect-[4/5]'
              )}
            />
          </div>
          <Skeleton className='h-4 w-40' />
          <Skeleton className='h-9 w-full' />
          {shareFiles && <Skeleton className='h-9 w-full' />}
        </div>
      </div>
    </div>
  );
}
