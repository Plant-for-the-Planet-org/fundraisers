'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { getFundraiserAuthenticated } from '@/lib/api/fundraiser-service';
import { buildTheme } from '@/lib/theme/build-theme';
import { useThemeStore } from '@/stores/theme-store';
import type { Fundraiser } from '@/lib/types/fundraiser';
import { FundraiserView } from '@/components/fundraisers/fundraiser-view';

export function FundraiserAuthRetry({ slug }: { slug: string }) {
  const accessToken = useAuthStore(s => s.accessToken);
  const isAuthInitializing = useAuthStore(s => s.isAuthInitializing);
  const setSelectedTheme = useThemeStore(s => s.setSelectedTheme);
  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (isAuthInitializing) return;

    const request = accessToken
      ? getFundraiserAuthenticated(slug, accessToken)
      : Promise.reject(new Error('unauthenticated'));

    request
      .then(data => {
        setFundraiser(data);
        setSelectedTheme(buildTheme(data.settings?.theme ?? null));
      })
      .catch(() => setFailed(true));
  }, [isAuthInitializing, accessToken, slug, setSelectedTheme]);

  if (failed) notFound();
  if (!fundraiser) return null;

  return <FundraiserView fundraiser={fundraiser} />;
}
