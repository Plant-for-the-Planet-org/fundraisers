'use client';

import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot='checkbox'
      className={cn(
        'h-4 w-4 shrink-0 cursor-pointer rounded border-2 border-border bg-background transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:border-foreground data-[state=checked]:bg-foreground',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className='flex items-center justify-center text-background'>
        <Check className='h-3 w-3' aria-hidden='true' />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
