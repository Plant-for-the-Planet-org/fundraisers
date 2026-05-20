import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FundraiserNotFound() {
  return (
    <div className='flex items-center justify-center py-24'>
      <div className='max-w-md mx-auto text-center'>
        <h1 className='text-6xl font-bold mb-4'>404</h1>
        <h2 className='text-2xl font-semibold mb-2'>Fundraiser Not Found</h2>
        <p className='text-foreground/60 mb-8'>
          The fundraiser you&apos;re looking for doesn&apos;t exist or may have
          been removed.
        </p>
        <div className='flex flex-col gap-3'>
          <Button asChild>
            <Link href='/explore'>Browse Fundraisers</Link>
          </Button>
          <Button variant='outline' asChild>
            <Link href='/'>Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
