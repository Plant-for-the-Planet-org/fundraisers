'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

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
      className='fixed inset-0 z-50 bg-gray-50 overflow-auto'
      role='dialog'
      aria-modal='true'
      aria-labelledby='donate-overlay-title'
    >
      <button
        type='button'
        onClick={onClose}
        className='fixed top-6 right-6 z-10 p-3 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all hover:bg-gray-50'
        aria-label='Close donation overlay'
      >
        <X className='w-5 h-5 text-gray-600' />
      </button>

      <div className='w-full max-w-5xl mx-auto px-6 py-12'>
        <div className='flex flex-col lg:flex-row gap-8'>
          <div className='flex-1 flex flex-col gap-6'>{leftColumn}</div>
          <div className='lg:w-2/5 space-y-6'>{rightColumn}</div>
        </div>
      </div>
    </div>
  );
}

// Shown while donation data is loading

export function DonateOverlaySkeleton({ onClose }: { onClose: () => void }) {
  return createPortal(
    <DonateOverlayLayout
      onClose={onClose}
      leftColumn={
        <>
          <Skeleton className='h-20 rounded-md' />
          <Skeleton className='h-40 rounded-md' />
          <Skeleton className='h-60 rounded-md' />
        </>
      }
      rightColumn={<Skeleton className='h-40 rounded-md' />}
    />,
    document.body
  );
}

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
          {/* Custom Fields Section */}
          {/* Payment Methods Section */}
        </>
      }
      rightColumn={
        <>
          {/* Dedication */}
          {/* Donation overview */}
          {/* DonateCTA */}
        </>
      }
    />,
    document.body
  );
}
