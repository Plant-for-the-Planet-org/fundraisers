'use client';

import { useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils/cn';

interface InfoTooltipProps {
  content: string;
  triggerLabel?: string;
  className?: string;
  iconClassName?: string;
  /** False makes the icon a pointer-only affordance, hidden from assistive tech. Pair it with `aria-describedby` on the control the tooltip explains, so keyboard and screen reader users still get the text. */
  focusable?: boolean;
}
// Uses Radix Popover to automatically handle viewport collisions and positioning.
// Tooltip content is rendered in a portal and repositions when space is limited,
// preventing clipping near screen edges on both mobile and desktop devices.
export function InfoTooltip({
  content,
  triggerLabel,
  className,
  iconClassName,
  focusable = true,
}: InfoTooltipProps) {
  const t = useTranslations('Common.aria');
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const pointerType = useRef<string>('mouse');

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        {/* When it is not focusable it is not a control either: announcing a button no keyboard user can reach or operate fails WCAG 2.1.1, so hide it and let the sr-only description on the explained control carry the text. */}
        <span
          role={focusable ? 'button' : undefined}
          tabIndex={focusable ? 0 : undefined}
          aria-hidden={focusable ? undefined : true}
          aria-label={
            focusable ? (triggerLabel ?? t('moreInformation')) : undefined
          }
          aria-describedby={focusable && open ? tooltipId : undefined}
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
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
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
          id={tooltipId}
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
