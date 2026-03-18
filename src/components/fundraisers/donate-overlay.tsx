'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';

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

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted || !isOpen || !donationData) return null;

  const overlayContent = (
    <div
      className='fixed inset-0 z-50 bg-gray-50 overflow-auto'
      role='dialog'
      aria-modal='true'
      aria-labelledby='donate-overlay-title'
    >
      {/* Close button — fixed so it stays visible while scrolling */}
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
          {/* Left Column */}
          <div className='flex-1 flex flex-col gap-6'>
            {/* Error Message */}
            {/* Success Message */}
            {/* Custom Fields Section */}
            {/* Payment Methods Section */}
            <div className='h-20 bg-gray-100 rounded-md' />
            <div className='h-40 bg-gray-100 rounded-md' />
            <div className='h-60 bg-gray-100 rounded-md' />
          </div>

          {/* Right Column */}
          <div className='lg:w-2/5 space-y-6'>
            {/*Dedication */}
            {/*Donation overview */}
            {/*DonateCTA */}
            <div className='h-40 bg-gray-100 rounded-md' />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlayContent, document.body);
}
