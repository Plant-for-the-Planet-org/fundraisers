import { X } from 'lucide-react';

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
  return (
    <div
      className='fixed inset-0 z-50 bg-background/80 backdrop-blur-2xl overflow-auto'
      role='dialog'
      aria-modal='true'
      aria-label='donation details'
    >
      <button
        type='button'
        onClick={onClose}
        className='fixed top-6 right-6 z-10 p-3 rounded-full bg-background border border-border shadow-sm hover:shadow-md transition-all hover:bg-muted'
        aria-label='Close donation overlay'
      >
        <X className='w-5 h-5 text-muted-foreground' />
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
