'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils/cn';

interface InfoTooltipProps {
  content: string;
  triggerLabel?: string;
  className?: string;
  iconClassName?: string;
}
// Uses Radix Popover to automatically handle viewport collisions and positioning.
// Tooltip content is rendered in a portal and repositions when space is limited,
// preventing clipping near screen edges on both mobile and desktop devices.
export function InfoTooltip({
  content,
  triggerLabel,
  className,
  iconClassName,
}: InfoTooltipProps) {
  const t = useTranslations('Common.aria');
  const [open, setOpen] = useState(false);
  const pointerType = useRef<string>('mouse');

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <span
          role='button'
          tabIndex={0}
          aria-label={triggerLabel ?? t('moreInformation')}
          className={cn(
            'inline-flex cursor-help items-center rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            className
          )}
          onPointerDown={event => {
            pointerType.current = event.pointerType;
          }}
          // Hover only for mouse; touch uses tap-to-toggle.
          onPointerEnter={event => {
            if (event.pointerType === 'mouse') setOpen(true);
          }}
          onPointerLeave={event => {
            if (event.pointerType === 'mouse') setOpen(false);
          }}
          onClick={event => {
            // Prevent clicks from triggering parent elements.
            event.stopPropagation();
            // Hover controls desktop behavior; allow Radix toggle on touch.
            if (pointerType.current === 'mouse') event.preventDefault();
          }}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              setOpen(prev => !prev);
            }
          }}
        >
          <Info className={cn('h-4 w-4', iconClassName)} aria-hidden='true' />
        </span>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          role='tooltip'
          side='top'
          sideOffset={6}
          collisionPadding={8}
          // Keep focus on the trigger when opened.
          onOpenAutoFocus={event => event.preventDefault()}
          className='z-50 w-56 max-w-[calc(100vw-1rem)] rounded-lg bg-foreground px-3 py-2 text-xs text-background data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95'
        >
          {content}
          <PopoverPrimitive.Arrow className='fill-foreground' />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
