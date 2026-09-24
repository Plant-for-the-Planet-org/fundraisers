import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

export function SidebarPanel({
  children,
  flattenOnMobile = false,
}: {
  children: ReactNode;
  /** On mobile, let the children join the page's single column so they can be ordered alongside the main panel's. */
  flattenOnMobile?: boolean;
}) {
  return (
    <div
      className={cn('lg:w-80 shrink-0', flattenOnMobile && 'max-md:contents')}
    >
      <div
        className={cn(
          'w-full md:w-80 flex flex-col gap-6',
          flattenOnMobile && 'max-md:contents'
        )}
      >
        {children}
      </div>
    </div>
  );
}
