'use client';

// Temporary overlay to display donation details after user clicks "Donate" in the DonationForm. This is a placeholder for the actual payment flow, which will be implemented in a future iteration.

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/currency';
import type { Fundraiser } from '@/lib/types/fundraiser';

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

  const lineItems = fundraiser.projectAllocations.map(allocation => ({
    project: allocation.project,
    amount: (donationData.amount / 100) * (allocation.percentage / 100),
    percentage: allocation.percentage,
  }));

  return createPortal(
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/50'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Panel */}
      <div className='relative bg-background min-h-full w-full flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
          <h2 className='text-base font-semibold text-foreground'>
            Complete Your Donation
          </h2>
          <button
            onClick={onClose}
            className='text-muted-foreground hover:text-foreground transition-colors'
            aria-label='Close'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='flex flex-col gap-5 p-5'>
          {/* Donation summary */}
          <section className='flex flex-col gap-2'>
            <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
              Donation Summary
            </h3>
            <div className='bg-muted rounded-xl p-4 flex flex-col gap-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Amount</span>
                <span className='font-semibold text-foreground'>
                  {formatCurrency(donationData.amount, donationData.currency)}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Frequency</span>
                <span className='font-medium text-foreground'>
                  {FREQUENCY_LABELS[donationData.frequency] ??
                    donationData.frequency}
                </span>
              </div>
              {donationData.dedicated && (
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Dedicated gift</span>
                  <span className='font-medium text-foreground'>Yes</span>
                </div>
              )}
            </div>
          </section>

          {/* Project line items */}
          {lineItems.length > 0 && (
            <section className='flex flex-col gap-2'>
              <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
                Project Allocation
              </h3>
              <div className='flex flex-col gap-2'>
                {lineItems.map(item => (
                  <div
                    key={item.project.id}
                    className='flex justify-between items-center text-sm'
                  >
                    <span className='text-foreground flex-1 min-w-0 truncate pr-4'>
                      {item.project.name}
                    </span>
                    <span className='text-muted-foreground shrink-0'>
                      {item.percentage}% &mdash;{' '}
                      {formatCurrency(
                        Math.round(item.amount * 100),
                        donationData.currency
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Debug: raw donation data */}
          <section className='flex flex-col gap-2'>
            <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
              Debug: Donation Data
            </h3>
            <pre className='bg-muted rounded-xl p-4 text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all'>
              {JSON.stringify(donationData, null, 2)}
            </pre>
          </section>

          {/* Donor details (placeholder) */}
          <section className='flex flex-col gap-3'>
            <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
              Donor Details
            </h3>
            <div className='flex flex-col gap-1'>
              <label
                htmlFor='donorAlias'
                className='text-sm font-medium text-foreground'
              >
                Display name
              </label>
              <input
                id='donorAlias'
                {...register('donorAlias')}
                placeholder='Your name (as shown on the fundraiser)'
                className='h-9 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
              />
            </div>
          </section>

          {/* Payment placeholder */}
          <section className='flex flex-col gap-2'>
            <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
              Payment
            </h3>
            <div className='bg-muted rounded-xl p-4 text-sm text-muted-foreground text-center'>
              Payment integration coming soon
            </div>
          </section>

          <Button
            className='w-full font-medium'
            style={{ backgroundColor: 'var(--accent-color)' }}
            disabled
          >
            {formatCurrency(donationData.amount, donationData.currency)} &mdash;
            Pay now
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
