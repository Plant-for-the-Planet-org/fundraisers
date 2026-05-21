'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { useImpersonationStore } from '@/stores/impersonation-store';

// Returns false on the server and true after client hydration, so SSR markup
// and the first client render agree (both render null) before persist rehydrates.
const subscribe = () => () => {};
const isHydrated = () => true;
const isNotHydrated = () => false;

export function ImpersonationBanner() {
  const hydrated = useSyncExternalStore(subscribe, isHydrated, isNotHydrated);
  const isActive = useImpersonationStore(state => state.isActive);
  const email = useImpersonationStore(state => state.email);
  const stop = useImpersonationStore(state => state.stop);
  const t = useTranslations('Auth');

  if (!hydrated || !isActive || !email) return null;

  const handleStop = () => {
    stop();
    window.location.reload();
  };

  return (
    <div className='relative z-[100] w-full bg-orange-400 text-orange-950'>
      <div className='max-w-[960px] mx-auto px-4 py-2 flex items-center justify-between gap-4 text-sm'>
        <span className='truncate'>
          {t.rich('impersonation.bannerMessage', {
            email,
            strong: chunks => <strong>{chunks}</strong>,
          })}
        </span>
        <button
          type='button'
          onClick={handleStop}
          className='shrink-0 rounded-md bg-orange-700 px-3 py-1 font-medium text-white hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-950/50'
        >
          {t('impersonation.stop')}
        </button>
      </div>
    </div>
  );
}
