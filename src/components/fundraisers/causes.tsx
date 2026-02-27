import { Header2, PreviewSectionHeader2 } from './typography';

export function FundraiserCauses() {
  return (
    <div>
      <PreviewSectionHeader2
        className='flex-row justify-between'
        content='Causes Supported by this Fundraiser'
        showDivider={false}
        actionSlot={
          <button className='hover:bg-gray-100 dark:hover:bg-gray-800'>
            <Header2 content='Add Cause' />
          </button>
        }
      />
    </div>
  );
}
