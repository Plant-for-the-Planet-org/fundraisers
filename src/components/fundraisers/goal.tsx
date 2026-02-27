import { PreviewSectionHeader1, PreviewSectionHeader2 } from './typography';

export function FundraiserGoalPreview() {
  return (
    <div>
      <PreviewSectionHeader1 content='$2,000 Raised' />
    </div>
  );
}

export function FundraiserGoalInput() {
  return (
    <div className='flex flex-col gap-3'>
      <PreviewSectionHeader2 content='Fundraiser Goal' />
      <input
        type='text'
        className='shadow px-4 py-2 w-full rounded-lg text-sm font-semibold bg-white'
        placeholder='$2,000'
      />
    </div>
  );
}
