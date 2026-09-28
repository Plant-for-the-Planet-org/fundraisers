'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { createContext, useContext } from 'react';

interface FundraiserDetailValue {
  fundraiser: Fundraiser;
  /** Owners and admins. View-only co-hosts see the same pages without the edit actions. */
  canEdit: boolean;
}

export const FundraiserDetailContext =
  createContext<FundraiserDetailValue | null>(null);

function useDetailValue(): FundraiserDetailValue {
  const value = useContext(FundraiserDetailContext);
  if (!value) {
    throw new Error(
      'Fundraiser detail hooks must be used inside FundraiserDetailShell'
    );
  }
  return value;
}

export function useFundraiserDetail(): Fundraiser {
  return useDetailValue().fundraiser;
}

export function useCanEditFundraiser(): boolean {
  return useDetailValue().canEdit;
}
