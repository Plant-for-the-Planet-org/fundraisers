import { PreviewSectionHeader2 } from './typography';

export function WorkspaceSelector() {
  return (
    <div className='flex flex-col gap-3'>
      <PreviewSectionHeader2 content='Country' />
      <input
        type='text'
        className='shadow px-4 py-2 w-full rounded-lg text-sm font-semibold bg-white'
        placeholder='Country'
      />
    </div>
  );
}
