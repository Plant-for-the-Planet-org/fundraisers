import { SectionHeader } from './typography';

export function DonorsPreview() {
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
  const fallbackColors = [
    'bg-amber-500',
    'bg-blue-500',
    'bg-lime-500',
    'bg-red-400',
    'bg-orange-900',
  ];

  return (
    <div className='flex flex-col gap-4'>
      <SectionHeader>
        {donorCount} {donorCount === 1 ? 'Donor' : 'Donors'}
      </SectionHeader>

      <div className='flex flex-col gap-2.5'>
        <div className='flex items-center'>
          {donors.map((donor, index) => (
            <div
              key={donor.id}
              className={`w-6 h-6 border-2 border-white rounded-full -ml-1 first:ml-0 ${fallbackColors[index % fallbackColors.length]}`}
              title={donor.name}
            />
          ))}
        </div>

        <div className='text-zinc-800 dark:text-gray-100 text-sm font-normal leading-tight'>
          {namedDonors.map((donor, index) => (
            <span key={donor.id}>
              {donor.name}
              {index < namedDonors.length - 1 && ', '}
            </span>
          ))}
          {remainingCount > 0 && <span> and {remainingCount} others</span>}
        </div>
      </div>
    </div>
  );
}
