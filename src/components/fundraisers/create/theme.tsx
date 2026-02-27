import { PreviewSectionHeader2 } from '../typography';

export function FundraiserTheme() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-3'>
        <PreviewSectionHeader2 content='Theme' />
        <input
          type='text'
          className='shadow px-4 py-2 w-full rounded-lg text-sm font-semibold bg-white'
          placeholder='Themes Dropdown'
        />
      </div>
      <PreviewSectionHeader2 content='Accent Color' showDivider={false} />
      <PreviewSectionHeader2 content='Effects' showDivider={false} />
    </div>
  );
}
