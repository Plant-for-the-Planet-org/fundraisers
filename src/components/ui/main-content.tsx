import type { ReactNode } from 'react';

export function MainContent({ children }: { children: ReactNode }) {
  return (
    <main className='main-content flex-1'>
      <div className='max-w-[960px] rounded-2xl backdrop-blur-[10px] w-full mx-auto my-8 px-4 py-4'>
        {children}
      </div>
    </main>
  );
}
