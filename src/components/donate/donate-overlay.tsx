'use client';

import type { SentInvitationGift } from '@planet-sdk/common';
import type { DonationFrequency } from '@/lib/types/donation';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { StripeCardFormHandle } from './stripe-card-form';
import type { StripeSepaFormHandle } from './stripe-sepa-form';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/utils/get-stripe';
import { sanitizeThankYouHtml } from '@/lib/utils/sanitize-html';
import {
  scrollElementIntoView,
  scrollToFirstError,
} from '@/lib/utils/scroll-into-view';
import {
  Dialog,
  DialogContentFullScreen,
  DialogTitle,
} from '@/components/ui/dialog';
import { DonateCTA } from './donate-cta';
import { DonateOptions } from './donate-options';
import { DonateOverlayLayout } from './donate-overlay-layout';
import { DonateOverlaySkeleton } from './donate-overlay-skeleton';
import { DonationFailureBanner } from './donation-failure-banner';
import { DonationFormProvider } from './donation-form-context';
import { DonationSummary } from './donation-summary';
import { DonationThankYou } from './donation-thank-you';
import { DonorInfo } from './donor-info';
import { GiftSummary } from './gift-summary';
import { PaymentMethods } from './payment-methods';
import { useDonationSubmission } from './use-donation-submission';

export interface DonationData {
  amountCents: number;
  currency: string;
  frequency: DonationFrequency;
  dedicated: boolean;
  gift?: SentInvitationGift;
}

interface DonateOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  donationData: DonationData | null;
  fundraiser: Fundraiser;
  paymentOptions: PaymentOptions;
  /** `true` once `paymentOptions` reflects the user's auth state — see `usePaymentOptions`. */
  paymentOptionsReady: boolean;
}

export function DonateOverlay({
  isOpen,
  onClose,
  donationData,
  fundraiser,
  paymentOptions,
  paymentOptionsReady,
}: DonateOverlayProps) {
  const tDonate = useTranslations('Donate');
  const dialogContentRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContentFullScreen
        ref={dialogContentRef}
        tabIndex={-1}
        className='light bg-gray-50 text-foreground'
        onEscapeKeyDown={e => e.preventDefault()}
        onOpenAutoFocus={event => {
          // Radix focuses the first focusable (the corner close button) by default, which makes Space/Enter dismiss the overlay. Focus the dialog surface instead so no control is one keystroke from firing.
          event.preventDefault();
          dialogContentRef.current?.focus();
        }}
      >
        <DialogTitle className='sr-only'>
          {tDonate('overlay.aria.label')}
        </DialogTitle>
        {donationData ? (
          <DonateOverlayInner
            donationData={donationData}
            fundraiser={fundraiser}
            paymentOptions={paymentOptions}
            paymentOptionsReady={paymentOptionsReady}
            onClose={onClose}
            isOpen={isOpen}
          />
        ) : (
          <DonateOverlaySkeleton onClose={onClose} />
        )}
      </DialogContentFullScreen>
    </Dialog>
  );
}

interface DonateOverlayInnerProps {
  donationData: DonationData;
  fundraiser: Fundraiser;
  paymentOptions: PaymentOptions;
  paymentOptionsReady: boolean;
  onClose: () => void;
  isOpen: boolean;
}

/** Inner component rendered only when donationData is available, so hooks can depend on it safely */
function DonateOverlayInner({
  donationData,
  fundraiser,
  paymentOptions,
  paymentOptionsReady,
  onClose,
  isOpen,
}: DonateOverlayInnerProps) {
  const locale = useLocale();
  const sepaFormRef = useRef<StripeSepaFormHandle>(null);
  const cardFormRef = useRef<StripeCardFormHandle>(null);

  const stripeConfig = paymentOptions.gateways.stripe;
  const stripePromise = stripeConfig
    ? getStripe(stripeConfig.authorization.stripePublishableKey, locale)
    : null;

  // Stripe card/SEPA fields set their inline errors synchronously, then signal
  // validation failure. Defer to the next frame so those error markers are in
  // the DOM before we scroll to the first one.
  const handlePaymentValidationFailed = useCallback(() => {
    requestAnimationFrame(() => {
      scrollToFirstError()?.focus?.();
    });
  }, []);

  const {
    onSubmit,
    donationState,
    reset,
    onPayPalCreateOrder,
    onPayPalApproved,
    onPayPalError,
    onWalletConfirm,
    onWalletError,
    onWalletCancel,
  } = useDonationSubmission(
    donationData,
    fundraiser,
    paymentOptions,
    sepaFormRef,
    cardFormRef,
    handlePaymentValidationFailed
  );
  const { thankYouState, error, isLoading } = donationState;

  // Reset donation state (backend errors) when overlay closes
  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const errorBannerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!error?.code) return;

    // Field-level rejections are marked on the inputs by DonationFormProvider,
    // which is a child, so its setError has run but the markers are not painted
    // yet. Wait a frame, then scroll to the field rather than to the banner.
    if (error.fieldErrors) {
      const frame = requestAnimationFrame(() => {
        scrollToFirstError()?.focus?.();
      });
      return () => cancelAnimationFrame(frame);
    }

    if (errorBannerRef.current) {
      scrollElementIntoView(errorBannerRef.current);
    }
  }, [error]);

  const thankYouModule = fundraiser.settings?.modules?.thankYouNote;
  const hostMessageConfig = useMemo(() => {
    const message =
      thankYouModule?.enabled && thankYouModule?.message
        ? sanitizeThankYouHtml(thankYouModule.message)
        : null;
    return message ? { message, hosts: fundraiser.hosts ?? [] } : null;
  }, [thankYouModule, fundraiser.hosts]);

  const leftColumn = thankYouState ? (
    <DonationThankYou
      thankYouState={thankYouState}
      fundraiserSlug={fundraiser.slug}
      hostMessageConfig={hostMessageConfig}
    />
  ) : (
    <>
      <DonorInfo />
      <PaymentMethods />
    </>
  );

  const rightColumn = (
    <>
      <GiftSummary />
      <DonationSummary />
      {thankYouState === null && (
        <>
          <DonateOptions />
          <DonateCTA
            isLoading={isLoading}
            isSuccess={false}
            stripePromise={stripePromise}
            resetError={reset}
            onPayPalCreateOrder={onPayPalCreateOrder}
            onPayPalApproved={onPayPalApproved}
            onPayPalError={onPayPalError}
            onWalletConfirm={onWalletConfirm}
            onWalletError={onWalletError}
            onWalletCancel={onWalletCancel}
          />
          {error?.code && (
            <div ref={errorBannerRef}>
              <DonationFailureBanner errorCode={error.code} reset={reset} />
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <Elements stripe={stripePromise}>
      <DonationFormProvider
        fundraiser={fundraiser}
        donationData={donationData}
        paymentOptions={paymentOptions}
        paymentOptionsReady={paymentOptionsReady}
        onSubmit={onSubmit}
        sepaFormRef={sepaFormRef}
        cardFormRef={cardFormRef}
        isOpen={isOpen}
        serverFieldErrors={error?.fieldErrors}
      >
        <DonateOverlayLayout
          onClose={onClose}
          leftColumn={leftColumn}
          rightColumn={rightColumn}
        />
      </DonationFormProvider>
    </Elements>
  );
}
