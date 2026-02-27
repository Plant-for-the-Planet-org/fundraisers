import { PreviewSectionHeader2 } from './typography';

export function FundraiserDonorsPreview() {
  return (
    <div className='flex flex-col gap-2'>
      <PreviewSectionHeader2 content='200 Donors' />
      <div className='flex flex-col gap-1.5'>
        <div className='h-8 flex items-center text-sm'>
          <div className='w-6 h-6 border-2 border-white rounded-full bg-red-500' />
        </div>
        <div className='text-sm'>Donors Names</div>
      </div>
    </div>
  );
}
