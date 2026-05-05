'use client';

import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { DonationItem } from './donation-item';

interface ViewAllOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  donations: LeaderboardDonation[];
  anonymize: boolean;
  showAmount: boolean;
  showAvatar: boolean;
}

export function ViewAllOverlay({
  isOpen,
  onClose,
  donations,
  anonymize,
  showAmount,
  showAvatar,
}: ViewAllOverlayProps) {
  const t = useTranslations('Leaderboard.view');

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handleClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className='fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-start justify-center pt-[10vh]'
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className='w-full max-w-3xl mx-4 bg-background rounded-2xl shadow-2xl border border-border overflow-hidden'>
        <div className='flex items-center justify-between px-4 pt-4 pb-3 border-b border-border'>
          <h2 className='text-xl font-semibold text-foreground'>
            {t('viewAllOverlay.title')}
          </h2>
          <button
            type='button'
            onClick={handleClose}
            className='p-2 hover:bg-muted rounded-full transition-colors'
            aria-label={t('viewAllOverlay.closeAria')}
          >
            <X className='w-5 h-5 text-muted-foreground' />
          </button>
        </div>

        <div className='max-h-[60vh] overflow-y-auto p-4'>
          {donations.length > 0 ? (
            <div className='grid grid-cols-4 gap-4'>
              {donations.map(donation => (
                <DonationItem
                  key={donation.id}
                  donation={donation}
                  anonymize={anonymize}
                  showAmount={showAmount}
                  showAvatar={showAvatar}
                />
              ))}
            </div>
          ) : (
            <div className='py-8 text-center'>
              <p className='text-sm text-muted-foreground'>
                {t('viewAllOverlay.emptyState')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
