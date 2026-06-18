import type { ReactNode } from 'react';

export function MainContent({ children }: { children: ReactNode }) {
  return (
    <main className='flex-1'>
      <div
        data-main-content-surface
        className='max-w-[960px] rounded-2xl w-full mx-auto my-8 px-4 py-4'
      >
        {children}
      </div>
    </main>
  );
}
