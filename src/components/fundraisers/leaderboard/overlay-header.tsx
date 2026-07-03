import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { DialogTitle } from '@/components/ui/dialog';

interface OverlayHeaderProps {
  onClose: () => void;
}

export function OverlayHeader({ onClose }: OverlayHeaderProps) {
  const t = useTranslations('Leaderboard.view');

  return (
    <div className='flex items-start justify-between px-4 pt-4 pb-3'>
      <div>
        <DialogTitle className='text-xl font-semibold text-foreground'>
          {t('viewAllOverlay.title')}
        </DialogTitle>
        <p className='text-sm text-muted-foreground mt-1'>
          {t('viewAllOverlay.subtitle')}
        </p>
      </div>
      <button
        type='button'
        onClick={onClose}
        className='p-2 hover:bg-muted rounded-full transition-colors'
        aria-label={t('viewAllOverlay.closeAria')}
      >
        <X className='w-5 h-5 text-muted-foreground' />
      </button>
    </div>
  );
}
