import { useTranslations } from 'next-intl';
import { FundraiserLayout } from '@/components/ui/fundraiser-layout';
import { MainPanel } from '@/components/ui/fundraiser-layout/main-panel';
import { SidebarPanel } from '@/components/ui/fundraiser-layout/sidebar-panel';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state for the project page. Built from the same layout primitives as
 * `ProjectView` so the real content lands in place without shifting.
 */
export function ProjectSkeleton() {
  const t = useTranslations('Projects');

  return (
    <div role='status' aria-label={t('loadingAria')}>
      <FundraiserLayout>
        <SidebarPanel>
          {/* Hero image — h-80 matches ImageComponentBase */}
          <Skeleton className='w-full h-80 rounded-2xl' />
        </SidebarPanel>
        <MainPanel>
          {/* Top project badge */}
          <Skeleton className='h-6 w-52 rounded-full' />
          {/* Title */}
          <Skeleton className='h-10 w-3/4' />
          {/* Owner */}
          <Skeleton className='h-6 w-56' />
          {/* Cost per unit */}
          <Skeleton className='h-4 w-40' />
          {/* Contribution */}
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
