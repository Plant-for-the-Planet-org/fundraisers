import * as React from 'react';
import { cn } from '@/lib/utils/index';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'border-input placeholder:text-muted-foreground flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40',
        'resize-none',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
