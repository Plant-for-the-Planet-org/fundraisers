import type { ReactNode } from 'react';

export function SidebarPanel({ children }: { children: ReactNode }) {
  return (
    <div className='lg:w-80 shrink-0'>
      <div className='w-full md:w-80 flex flex-col gap-6'>{children}</div>
    </div>
  );
}
