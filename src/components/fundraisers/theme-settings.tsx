import { SectionHeader } from './typography';

export function ThemeSettings() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-3'>
        <SectionHeader>Theme</SectionHeader>
        <input
          type='text'
          className='shadow px-4 py-2 w-full rounded-lg text-sm font-semibold bg-white'
          placeholder='Themes Dropdown'
        />
      </div>
      <SectionHeader showDivider={false}>Accent Color</SectionHeader>
      <SectionHeader showDivider={false}>Effects</SectionHeader>
    </div>
  );
}
