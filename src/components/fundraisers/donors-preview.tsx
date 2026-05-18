import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { FallbackAvatar } from '@/components/ui/fallback-avatar';
import { SectionHeader } from './typography';

export function DonorsPreview() {
  const t = useTranslations('Fundraisers.form.donorsPreview');
  const donors = [
    { id: '1', name: 'Ava' },
    { id: '2', name: 'Noah' },
    { id: '3', name: 'Mia' },
    { id: '4', name: 'Liam' },
    { id: '5', name: 'Zoe' },
  ];
  const donorCount = 200;
  const namedDonors = donors.slice(0, 2);
  const remainingCount = Math.max(0, donorCount - namedDonors.length);

  return (
    <div className='flex flex-col gap-4'>
      <SectionHeader>{t('donorCount', { count: donorCount })}</SectionHeader>

      <div className='flex flex-col gap-2.5'>
        <div className='flex items-center'>
          {donors.map((donor, index) => (
            <Avatar
              key={donor.id}
              className={cn(
                'w-6 h-6 border-2 border-card',
                index > 0 && '-ml-1'
              )}
              title={donor.name}
            >
              <FallbackAvatar seed={donor.id} />
            </Avatar>
          ))}
        </div>

        <div className='text-zinc-800 dark:text-gray-100 text-sm font-normal leading-tight'>
          {namedDonors.map((donor, index) => (
            <span key={donor.id}>
              {donor.name}
              {index < namedDonors.length - 1 && ', '}
            </span>
          ))}
          {remainingCount > 0 && (
            <span>{t('others', { count: remainingCount })}</span>
          )}
        </div>
      </div>
    </div>
  );
}
