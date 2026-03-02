import { Header2, PreviewSectionHeader2 } from './typography';

export function ProjectSelection() {
  return (
    <div className='flex flex-col gap-3'>
      <PreviewSectionHeader2
        className='flex-row justify-between'
        content='Causes Supported by this Fundraiser'
        showDivider={true}
        actionSlot={
          <button className='hover:bg-gray-100 dark:hover:bg-gray-800'>
            <Header2 content='Add Cause' />
          </button>
        }
      />
    </div>
  );
}
