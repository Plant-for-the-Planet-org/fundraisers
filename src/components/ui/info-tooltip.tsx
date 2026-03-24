'use client';

import { useId, useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface InfoTooltipProps {
  content: string;
  triggerLabel?: string;
  className?: string;
  iconClassName?: string;
}

export function InfoTooltip({
  content,
  triggerLabel,
  className,
  iconClassName,
}: InfoTooltipProps) {
  const tooltipId = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn('relative flex items-center', className)}>
      <span
        role='button'
        tabIndex={0}
        aria-describedby={visible ? tooltipId : undefined}
        className='cursor-help rounded text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
        onClick={event => {
          event.preventDefault();
          event.stopPropagation();
          setVisible(prev => !prev);
        }}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            setVisible(prev => !prev);
          }
        }}
      >
        <Info className={cn('h-4 w-4', iconClassName)} aria-hidden='true' />
        {triggerLabel && <span className='sr-only'>{triggerLabel}</span>}
      </span>

      {visible && (
        <span
          id={`tooltip-${tooltipId}`}
          role='tooltip'
          className='absolute bottom-full left-1/2 z-10 mb-2 w-56 max-w-[calc(100vw-1rem)] -translate-x-1/2 rounded-lg bg-foreground px-3 py-2 text-xs text-background'
        >
          {content}
          <span
            aria-hidden='true'
            className='absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground'
          />
        </span>
      )}
    </div>
  );
}
