'use client';

// Add size prop when multiple sizes are needed (e.g. 'sm' | 'md')
export function Spinner() {
  return (
    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
  );
}
