import { Heading2, SectionHeader } from './typography';

export function ProjectSelection() {
  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader
        className='flex-row justify-between'
        showDivider={true}
        actionSlot={
          <button className='hover:bg-gray-100 dark:hover:bg-gray-800'>
            {/* TODO: remove Heading2 while working on this, not appropriate for a button, and nested h2 muddies the heading hierarchy */}
            <Heading2>Add Cause</Heading2>
          </button>
        }
      >
        Causes Supported by this Fundraiser
      </SectionHeader>
    </div>
  );
}
