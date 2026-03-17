'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FundraiserError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className='flex flex-col items-center justify-center gap-6 py-24 text-center'>
      <AlertCircle className='w-12 h-12 text-muted-foreground' />
      <div className='flex flex-col gap-2'>
        <h1 className='text-xl font-semibold text-foreground'>
          Something went wrong
        </h1>
        <p className='text-sm text-muted-foreground max-w-sm'>
          This fundraiser could not be loaded. Please try again, or browse other
          fundraisers.
        </p>
      </div>
      <div className='flex gap-3'>
        <Button onClick={reset}>Try again</Button>
        <Button variant='outline' asChild>
          <Link href='/explore'>Browse fundraisers</Link>
        </Button>
      </div>
    </div>
  );
}
