import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

type BaseTypographyProps = {
  children: ReactNode;
  className?: string;
};

type SectionHeaderBaseProps = BaseTypographyProps & {
  containerClassName?: string;
  actionSlot?: ReactNode;
  showDivider?: boolean;
};

// TODO: remove this while working on title as it does not really fall under typography
export function ContentSectionTitle({
  children,
  className,
}: BaseTypographyProps) {
  return (
    <>
      <h1
        className={cn(
          'text-4xl font-bold cursor-text hover:opacity-80 transition-opacity',
          className
        )}
        style={{ fontFamily: 'var(--theme-title-font)' }}
      >
        {children}
      </h1>
    </>
  );
}

export function Heading1({ children, className }: BaseTypographyProps) {
  return (
    <h1
      className={cn(
        'text-zinc-800 dark:text-gray-100 text-sm font-semibold leading-tight',
        className
      )}
    >
      {children}
    </h1>
  );
}

export function Heading2({ children, className }: BaseTypographyProps) {
  return (
    <h2
      className={cn(
        'text-zinc-800 dark:text-gray-100 text-sm font-semibold leading-tight',
        className
      )}
    >
      {children}
    </h2>
  );
}

export function SectionHeader({
  containerClassName,
  children,
  className,
  actionSlot,
  showDivider = true,
}: SectionHeaderBaseProps) {
  return (
    <div className={cn(containerClassName)}>
      <div className={cn('flex flex-col', className)}>
        <Heading2 className='mb-1'>{children}</Heading2>
        {actionSlot}
      </div>
      {showDivider && <div className='h-px bg-gray-200 dark:bg-gray-700' />}
    </div>
  );
}
