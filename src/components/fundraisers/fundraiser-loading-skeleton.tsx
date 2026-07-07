import { Skeleton } from '@/components/ui/skeleton';

export function FundraiserLoadingSkeleton() {
  return (
    <div className='flex flex-col md:flex-row gap-6 min-w-0'>
      {/* Left column */}
      <div className='lg:w-80 shrink-0'>
        <div className='md:hidden mb-4'>
          <Skeleton className='h-7 w-48 rounded-lg' />
        </div>
        <div className='w-full md:w-80 flex flex-col gap-6'>
          <Skeleton className='w-full h-80 rounded-2xl' />
          <div className='flex flex-col gap-4'>
            <div className='space-y-2'>
              <Skeleton className='h-2 w-full rounded-full' />
              <div className='flex justify-between'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-4 w-16' />
              </div>
            </div>
            <div className='flex justify-between'>
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-4 w-20' />
            </div>
            <div className='space-y-3'>
              <Skeleton className='h-4 w-24' />
              <div className='flex -space-x-2'>
                {[...Array(5)].map((_, i) => (
                  <Skeleton
                    key={i}
                    className='w-8 h-8 rounded-full border-2 border-white'
                  />
                ))}
              </div>
            </div>
            <div className='flex flex-col gap-2'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-px w-full' />
              {[...Array(2)].map((_, i) => (
                <div key={i} className='flex items-center gap-2.5'>
                  <Skeleton className='w-6 h-6 rounded-full' />
                  <Skeleton className='h-4 flex-1' />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className='flex-1 flex flex-col gap-6 min-w-0'>
        <header className='flex flex-col gap-4'>
          <div className='hidden md:block'>
            <Skeleton className='h-7 w-48 rounded-lg' />
          </div>
          <Skeleton className='h-10 w-3/4' />
        </header>
        <div className='flex gap-4'>
          <Skeleton className='h-8 w-20' />
          <Skeleton className='h-8 w-16' />
        </div>
        <div className='border-2 border-white/20 rounded-2xl overflow-hidden'>
          <div className='px-4 py-2.5 mx-1 mt-1 bg-white/10 rounded-tl-lg rounded-tr-lg flex justify-between items-center'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-6 w-20' />
          </div>
          <div className='p-4 flex flex-col gap-4'>
            <div className='grid grid-cols-2 gap-3'>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className='h-6 rounded-lg' />
              ))}
            </div>
            <Skeleton className='h-10 w-full rounded-lg' />
            <Skeleton className='h-9 w-full rounded-lg' />
          </div>
        </div>
        <div className='space-y-4'>
          <Skeleton className='h-5 w-32' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-5/6' />
            <Skeleton className='h-4 w-4/5' />
          </div>
        </div>
      </div>
    </div>
  );
}
