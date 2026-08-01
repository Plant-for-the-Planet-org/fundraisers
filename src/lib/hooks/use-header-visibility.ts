'use client';

import type { HeaderVisibility } from '@/lib/utils/header-visibility';

import { useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getHeaderVisibility } from '@/lib/utils/header-visibility';

/**
 * Tells a header component which of its items the current route hides.
 * Wires `getHeaderVisibility` to the router.
 */
export function useHeaderVisibility(): HeaderVisibility {
  const pathname = usePathname();
  const redirectTo = useSearchParams().get('redirectTo');

  return useMemo(
    () => getHeaderVisibility({ pathname, redirectTo }),
    [pathname, redirectTo]
  );
}
