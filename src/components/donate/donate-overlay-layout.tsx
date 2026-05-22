import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DonateOverlayLayoutProps {
  onClose: () => void;
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
}

export function DonateOverlayLayout({
  onClose,
  leftColumn,
  rightColumn,
}: DonateOverlayLayoutProps) {
  const tDonate = useTranslations('Donate');
  return (
    <div
      className='light fixed inset-0 z-50 bg-gray-50 text-foreground overflow-auto'
      role='dialog'
      aria-modal='true'
      aria-label={tDonate('overlay.aria.label')}
    >
      <button
        type='button'
        onClick={onClose}
        className='fixed top-6 right-6 z-10 p-3 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all hover:bg-gray-50'
        aria-label={tDonate('overlay.aria.close')}
      >
        <X className='w-5 h-5 text-gray-600' />
      </button>

      <div className='w-full max-w-[960px] mx-auto px-6 py-12'>
        <div className='flex flex-col lg:flex-row gap-8'>
          <div className='flex-1 flex flex-col gap-6'>{leftColumn}</div>
          <div className='lg:w-96 space-y-6'>{rightColumn}</div>
        </div>
      </div>
    </div>
  );
}
