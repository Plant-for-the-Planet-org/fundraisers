'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Dialog as SheetPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils/cn';
import { XmarkIcon } from './ui-icons';

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot='sheet' {...props} />;
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot='sheet-trigger' {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot='sheet-close' {...props} />;
}

function SheetContent({
  className,
  children,
  side = 'left',
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'left' | 'right';
}) {
  const t = useTranslations('Common.actions');

  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay
        data-slot='sheet-overlay'
        className='fixed inset-0 z-50 bg-black/50'
      />
      <SheetPrimitive.Content
        data-slot='sheet-content'
        className={cn(
          'fixed inset-y-0 z-50 flex h-full w-72 max-w-[85vw] flex-col gap-4 bg-background p-4 shadow-lg outline-none',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className='absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden'>
          <XmarkIcon className='size-4' />
          <span className='sr-only'>{t('close')}</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot='sheet-title'
      className={cn('font-semibold text-foreground', className)}
      {...props}
    />
  );
}

export { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger };
