'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { DonateOverlayLayout } from './donate-overlay-layout';
import { DonateOverlaySkeleton } from './donate-overlay-skeleton';
import { DonorInfo } from './donor-info';
import { DonationSummary } from './donation-summary';
import { PaymentMethods } from './payment-methods';
import { DonateCTA } from './donate-cta';

export interface DonationData {
  amount: number;
  currency: string;
  frequency: string;
  dedicated: boolean;
}

interface DonorFormValues {
  donorAlias: string;
  isAnonymous: boolean;
}

interface DonateOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  donationData: DonationData | null;
  fundraiser: Fundraiser;
}

const FREQUENCY_LABELS: Record<string, string> = {
  'one-time': 'One-time',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

// donate-overlay-layout.tsx
// Shared shell — used by both the real overlay and the skeleton

// Shown while donation data is loading

export function DonateOverlay({
  isOpen,
  onClose,
  donationData,
  fundraiser,
}: DonateOverlayProps) {
  const mounted = typeof window !== 'undefined';

  const { register, reset } = useForm<DonorFormValues>({
    defaultValues: { donorAlias: '', isAnonymous: false },
  });

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  // Show skeleton while donation data is still being fetched
  if (!donationData) return <DonateOverlaySkeleton onClose={onClose} />;

  return createPortal(
    <DonateOverlayLayout
      onClose={onClose}
      leftColumn={
        <>
          {/* Error Message */}
          {/* Success Message */}
          <DonorInfo />
          {/* Custom Fields Section - future implementation */}
          <PaymentMethods />
        </>
      }
      rightColumn={
        <>
          {/* Dedication - future implementation */}
          <DonationSummary />
          <DonateCTA />
        </>
      }
    />,
    document.body
  );
}
