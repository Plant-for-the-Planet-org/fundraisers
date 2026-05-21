'use client';

// TODO: Replace this temporary success banner with the final designed UI component.
// Currently used only for testing and basic user feedback after donation success.
import type { SubmissionErrorKey } from '@/lib/types/submission-errors';

import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

export const DonationFailureBanner = ({
  errorCode,
  reset,
}: {
  errorCode: SubmissionErrorKey;
  reset: () => void;
}) => {
  const t = useTranslations('Donate.submissionErrors');
  return (
    <div className='bg-destructive/10 border border-destructive/30 rounded-lg p-4'>
      <div className='flex items-start gap-3'>
        <div className='flex-shrink-0'>
          <svg
            className='w-5 h-5 text-destructive'
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
              clipRule='evenodd'
            />
          </svg>
        </div>
        <div className='flex-1'>
          <h3 className='text-sm font-medium text-destructive'>
            {t(errorCode)}
          </h3>
        </div>
        <button
          onClick={reset}
          className='flex-shrink-0 text-destructive/70 hover:text-destructive'
        >
          <X className='w-4 h-4' />
        </button>
      </div>
    </div>
  );
};
