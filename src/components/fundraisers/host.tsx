import { PreviewSectionHeader2 } from './typography';

export function FundraiserHostPreview() {
  return (
    <div className='flex flex-col gap-3'>
      <PreviewSectionHeader2 content='Hosted by' />
      <div className='flex flex-row gap-2'>
        <div className='h-6 w-6 rounded-full bg-red-500' />
        <div>Host Name</div>
      </div>
    </div>
  );
}
