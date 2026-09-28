import type { ComponentProps } from 'react';

import { Settings2, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

type SectionSettingsButtonProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'variant' | 'size' | 'asChild'
> & {
  /** Shows `X` instead of the settings icon while the menu is open. Leave unset when the button opens a dialog. */
  isOpen?: boolean;
};

/**
 * Settings icon for a `SectionHeader` action slot. Other props and `ref` pass through, so it works inside `DropdownMenuTrigger asChild`.
 */
export function SectionSettingsButton({
  isOpen = false,
  className,
  ...props
}: SectionSettingsButtonProps) {
  const Icon = isOpen ? X : Settings2;

  return (
    <Button
      type='button'
      variant='ghost'
      size='sm'
      {...props}
      className={cn(
        'p-1 h-auto hover:bg-muted-foreground/15 dark:hover:bg-muted-foreground/30',
        className
      )}
    >
      <Icon className='w-4 h-4' />
    </Button>
  );
}
