import type { ReactNode } from 'react';

export function SidebarPanel({ children }: { children: ReactNode }) {
  return (
    <div className='lg:w-80 shrink-0'>
      {/* data-blur-surface: measured by ThemeShell's blur layer ('panels' mode) so blur hugs this column's real content height. */}
      <div data-blur-surface className='w-full md:w-80 flex flex-col gap-6'>
        {children}
      </div>
    </div>
  );
}
