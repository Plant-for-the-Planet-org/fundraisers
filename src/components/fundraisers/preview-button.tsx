'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ViewButton({ slug }: { slug: string }) {
  const t = useTranslations('Fundraisers.form');
  return (
    <Button variant='ghost' type='button' asChild>
      <Link href={`/raise/${slug}`} target='_blank' rel='noopener noreferrer'>
        <Eye className='size-4' />
        {t('viewButton')}
      </Link>
    </Button>
  );
}
