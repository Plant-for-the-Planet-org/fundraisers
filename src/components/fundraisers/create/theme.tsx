import { PreviewSectionHeader2 } from '../typography';

export function FundraiserTheme() {
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <PreviewSectionHeader2 content='Theme' />
      </div>
      <div>
        <PreviewSectionHeader2 content='Accent Color' showDivider={false} />
      </div>
      <div>
        <PreviewSectionHeader2 content='Effects' showDivider={false} />
      </div>
    </div>
  );
}
