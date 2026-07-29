import { useTranslations } from 'next-intl';
import { FundraiserLayout } from '@/components/ui/fundraiser-layout';
import { MainPanel } from '@/components/ui/fundraiser-layout/main-panel';
import { SidebarPanel } from '@/components/ui/fundraiser-layout/sidebar-panel';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state for the project page. Mirrors `ProjectView`'s layout
 * primitives, grouping, and spacing so the real content lands in place without
 * shifting.
 */
export function ProjectSkeleton() {
  const t = useTranslations('Project');

  return (
    <div
      className='project-skeleton'
      role='status'
      aria-label={t('loadingAria')}
    >
      <FundraiserLayout>
        <SidebarPanel>
          {/* Hero image — h-80 matches ImageComponentBase */}
          <Skeleton className='w-full h-80 rounded-2xl' />
        </SidebarPanel>
        <MainPanel>
          {/* Hero: badge, title, owner, cost per unit */}
          <div className='flex flex-col gap-4'>
            <Skeleton className='h-6 w-52 rounded-full' />
            <div className='flex flex-col gap-3'>
              <Skeleton className='h-10 w-3/4' />
              <div className='flex flex-row items-center gap-2.5'>
                <Skeleton className='h-6 w-6 rounded-full' />
                <Skeleton className='h-5 w-56' />
              </div>
            </div>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='flex flex-col gap-3'>
                <Skeleton className='h-4 w-28' />
                <Skeleton className='h-px w-full' />
                <Skeleton className='h-5 w-16' />
              </div>
            </div>
          </div>
          {/* Contribution card */}
          <Skeleton className='h-96 w-full rounded-2xl' />
          {/* About */}
          <div className='flex flex-col gap-3'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-px w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-2/3' />
          </div>
        </MainPanel>
      </FundraiserLayout>
    </div>
  );
}
