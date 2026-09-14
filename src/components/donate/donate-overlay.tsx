'use client';

import type { RefObject } from 'react';
import type { SentInvitationGift } from '@planet-sdk/common';
import type { DonationFrequency } from '@/lib/types/donation';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { StripeCardFormHandle } from './stripe-card-form';
import type { StripeSepaFormHandle } from './stripe-sepa-form';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormState } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { Elements } from '@stripe/react-stripe-js';
import { trackEvent } from '@/lib/analytics/track';
import { getStripe } from '@/lib/utils/get-stripe';
import { sanitizeThankYouHtml } from '@/lib/utils/sanitize-html';
import {
  scrollElementIntoView,
  scrollToField,
  scrollToFirstError,
} from '@/lib/utils/scroll-into-view';
import { useAuthStore } from '@/stores/auth-store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const signedIn = useAuthStore(s => s.isAuthenticated);
  // Set by the inner form once a result screen (thank-you, pending) is showing.
  const hasResultRef = useRef(false);
  // Set by the inner form while the donor has typed something worth keeping.
  const hasInputRef = useRef(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);

  // Closing from the donation form is an abandoned donation; closing a result screen is not. Every close route goes through here so none is left untracked.
  const handleClose = () => {
    if (donationData && !hasResultRef.current) {
      trackEvent('donation_exited', {
        fundraiser: fundraiser.slug,
        amount: donationData.amountCents / 100,
        currency: donationData.currency,
        frequency: donationData.frequency,
        signedIn,
      });
    }
    hasResultRef.current = false;
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) handleClose();
      }}
    >
      <DialogContentFullScreen
        ref={dialogContentRef}
        tabIndex={-1}
        className='light bg-gray-50 text-foreground'
        onEscapeKeyDown={event => {
          // Only an open combobox owns Esc, because it closes its list on the same key. Other expanded controls in the overlay, such as the gift email preview, have no Esc handler of their own, so claiming the key for them would leave Esc doing nothing at all.
          const target = event.target as HTMLElement | null;
          const isOpenCombobox =
            target?.getAttribute('role') === 'combobox' &&
            target.getAttribute('aria-expanded') === 'true';
          if (isOpenCombobox) {
            event.preventDefault();
            return;
          }
          // Nothing typed yet, or a result screen: Esc closes like the close button.
          if (hasResultRef.current || !hasInputRef.current) return;
          event.preventDefault();
          setIsLeaveConfirmOpen(true);
        }}
        onOpenAutoFocus={event => {
          // Radix focuses the first focusable (the corner close button) by default, which makes Space/Enter dismiss the overlay.
          // A signed-out donor starts in the email field, except on touch devices where an autofocused input would open the keyboard over the whole overlay. Everyone else lands on the dialog surface so no control is one keystroke from firing.
          event.preventDefault();
          const isTouch = window.matchMedia('(pointer: coarse)').matches;
          const emailField = isTouch
            ? null
            : dialogContentRef.current?.querySelector<HTMLInputElement>(
                'input[name="email"]'
              );
          (emailField ?? dialogContentRef.current)?.focus();
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
            onClose={handleClose}
            hasResultRef={hasResultRef}
            hasInputRef={hasInputRef}
            isOpen={isOpen}
          />
        ) : (
          <DonateOverlaySkeleton onClose={handleClose} />
        )}
        <AlertDialog
          open={isLeaveConfirmOpen}
          onOpenChange={setIsLeaveConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {tDonate('overlay.leaveConfirm.title')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {tDonate('overlay.leaveConfirm.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {/* Staying is the safe choice, so it carries the fundraiser accent. Leaving is the quiet one. */}
              <AlertDialogAction
                onClick={handleClose}
                className='border border-border bg-background text-foreground shadow-xs hover:bg-accent'
              >
                {tDonate('overlay.leaveConfirm.confirm')}
              </AlertDialogAction>
              <AlertDialogCancel className='border-transparent bg-accent-color text-[var(--cta-foreground,#fff)] hover:bg-accent-color hover:text-[var(--cta-foreground,#fff)] hover:opacity-90'>
                {tDonate('overlay.leaveConfirm.cancel')}
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
  hasResultRef: RefObject<boolean>;
  hasInputRef: RefObject<boolean>;
  isOpen: boolean;
}

// Fields the donor picks rather than types. Losing them costs one click, so they do not count as input worth a confirmation.
const CHOICE_FIELDS = new Set([
  'selectedPaymentMethod',
  'selectedSavedMethodId',
  'selectedAddressId',
  'willAbsorbFee',
  'makeMonthly',
]);

/** Mirrors "the donor has typed something" into a ref the outer dialog reads on Esc. Lives inside the form provider. Card and IBAN entry are Stripe fields outside the form and are not counted yet. */
function FormInputSync({ hasInputRef }: { hasInputRef: RefObject<boolean> }) {
  const { dirtyFields } = useFormState();
  const hasTypedInput = Object.keys(dirtyFields).some(
    field => !CHOICE_FIELDS.has(field)
  );

  useEffect(() => {
    hasInputRef.current = hasTypedInput;
  }, [hasTypedInput, hasInputRef]);

  return null;
}

/** Inner component rendered only when donationData is available, so hooks can depend on it safely */
function DonateOverlayInner({
  donationData,
  fundraiser,
  paymentOptions,
  paymentOptionsReady,
  onClose,
  hasResultRef,
  hasInputRef,
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
      scrollToFirstError()?.focus?.({ preventScroll: true });
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

  useEffect(() => {
    hasResultRef.current = thankYouState !== null;
  }, [thankYouState, hasResultRef]);

  // Reset donation state (backend errors) when overlay closes
  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const errorBannerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!error?.code) return;

    if (error.fieldErrors) {
      // The field is already on the page, so find it by its name and scroll
      // to it directly. This avoids waiting for the error styling to appear.
      const [firstField] = Object.keys(error.fieldErrors);
      const target = firstField ? scrollToField(firstField) : null;
      if (target) {
        target.focus({ preventScroll: true });
        return;
      }

      // Some fields cannot be found by name, so wait for their error marker
      // to appear and then scroll to the first field with an error.
      const frame = requestAnimationFrame(() => {
        scrollToFirstError()?.focus?.({ preventScroll: true });
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
        <FormInputSync hasInputRef={hasInputRef} />
        <DonateOverlayLayout
          onClose={onClose}
          leftColumn={leftColumn}
          rightColumn={rightColumn}
        />
      </DonationFormProvider>
    </Elements>
  );
}
