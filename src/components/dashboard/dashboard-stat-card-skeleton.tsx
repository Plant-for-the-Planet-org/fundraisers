import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton matching {@link CardBase} layout — same pattern as explore
 * {@link CategoryPageSkeleton} / {@link FeaturedFundraisersSkeleton}.
 */
export function DashboardStatCardSkeleton() {
  return (
    <Card
      className='border-none hover:shadow-md transition-shadow duration-300'
      role='status'
      aria-label='Loading'
    >
      <CardHeader>
        <Skeleton className='h-6 w-40 mb-2' />
        <Skeleton className='h-4 w-full max-w-[min(100%,20rem)]' />
      </CardHeader>
      <CardContent className='grow'>
        <Skeleton className='h-8 w-20' />
      </CardContent>
      <CardFooter>
        <Skeleton className='h-3 w-36 mt-1' />
      </CardFooter>
    </Card>
  );
}
