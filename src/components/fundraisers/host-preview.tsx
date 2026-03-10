'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getImageUrl } from '@/lib/utils/images';
import { SectionHeader } from './typography';

type ProfilePlaceholder = {
  id: string;
  slug: string;
  firstname: string | null;
  lastname: string | null;
  displayName: string | null;
  country: string | null;
  image: string | null;
};

export function HostPreview() {
  const t = useTranslations('Fundraisers');

  const [profile] = useState<ProfilePlaceholder>({
    id: 'prf_P8800000000va24Xb0000NHj',
    slug: 'john-doe',
    firstname: 'John',
    lastname: 'Doe',
    displayName: 'John Doe',
    country: 'US',
    image: null,
  });

  const hostName =
    profile.displayName ||
    [profile.firstname, profile.lastname].filter(Boolean).join(' ') ||
    t('unknownHost');
  const imageUrl = getImageUrl('profile', 'thumb', profile.image);
  const gradient = useMemo(() => {
    const gradients = [
      'from-emerald-400 via-lime-400 to-amber-300',
      'from-sky-400 via-blue-500 to-indigo-500',
      'from-rose-400 via-pink-500 to-fuchsia-500',
      'from-amber-400 via-orange-500 to-rose-500',
      'from-teal-400 via-cyan-500 to-blue-500',
    ];
    const seed = profile.id || profile.slug || hostName;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) % 2147483647;
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index] ?? gradients[0];
  }, [hostName, profile.id, profile.slug]);

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>{t('hostedByLabel')}</SectionHeader>
      <div className='flex flex-row items-center gap-2.5'>
        <div className='h-6 w-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center'>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={hostName}
              className='h-full w-full object-cover'
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${gradient}`} />
          )}
        </div>
        <div className='text-zinc-800 dark:text-gray-100 text-base font-medium leading-tight'>
          {hostName}
        </div>
      </div>
    </div>
  );
}
